import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "../../../lib/openai";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../../lib/auth";

const FREE_LIMIT = 3;

// Rate limiting: 10 POST requests per user per minute (in-memory, per instance)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

type RunItem = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
};

async function getAgentState(agentSlug: string, userId: string | null) {
  const agent = await prisma.agent.findUnique({
    where: { slug: agentSlug },
    select: {
      id: true, slug: true, name: true, description: true,
      runsCount: true, pricingType: true, pricingLabel: true,
      pricingAmountPln: true, pricingAmountPlnPerMonth: true,
    },
  });

  if (!agent) return null;

  const isFree = agent.pricingType === "FREE";

  const hasAccess = userId
    ? (isFree || !!(await prisma.agentAccess.findUnique({
        where: { userId_agentId: { userId, agentId: agent.id } },
      })))
    : false;

  const userRunCount = userId
    ? await prisma.agentRun.count({ where: { agentId: agent.id, userId } })
    : 0;

  const usedFreeRuns = userId ? Math.min(userRunCount, FREE_LIMIT) : 0;
  const remainingFreeRuns =
    hasAccess || isFree ? FREE_LIMIT : Math.max(0, FREE_LIMIT - userRunCount);

  const latestRuns = await prisma.agentRun.findMany({
    where: { agentId: agent.id, ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, inputJson: true, outputText: true, createdAt: true },
  });

  const runs: RunItem[] = latestRuns.map((r) => ({
    id: r.id,
    input: r.inputJson,
    output: r.outputText,
    createdAt: r.createdAt.toLocaleString("pl-PL"),
  }));

  return {
    agentId: agent.id,
    agentName: agent.name,
    agentDescription: agent.description,
    pricingType: agent.pricingType,
    pricingLabel: agent.pricingLabel,
    pricingAmountPln: agent.pricingAmountPln,
    pricingAmountPlnPerMonth: agent.pricingAmountPlnPerMonth,
    freeLimit: FREE_LIMIT,
    usedFreeRuns,
    remainingFreeRuns,
    hasAccess,
    latestRuns: runs,
  };
}

export async function GET(req: NextRequest) {
  const agentSlug = req.nextUrl.searchParams.get("agentSlug")?.trim();
  if (!agentSlug) {
    return NextResponse.json({ error: "Brak parametru agentSlug." }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const state = await getAgentState(agentSlug, userId);

  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
  }

  return NextResponse.json({ ...state, isAuthenticated: !!userId });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "Zaloguj się, aby uruchomić agenta.", requiresAuth: true },
        { status: 401 }
      );
    }

    // Rate limit check
    const { allowed, retryAfterSec } = checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfterSec} s.` },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    const body = await req.json();
    const agentSlug = typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";
    const userInput = typeof body.input === "string" ? body.input.trim() : "";

    if (!agentSlug || !userInput) {
      return NextResponse.json({ error: "Brak wymaganych pól: agentSlug, input." }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
      select: { id: true, name: true, description: true, status: true, pricingType: true },
    });

    if (!agent || agent.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
    }

    const isFree = agent.pricingType === "FREE";

    const hasAccess = isFree
      ? true
      : !!(await prisma.agentAccess.findUnique({
          where: { userId_agentId: { userId, agentId: agent.id } },
        }));

    if (!hasAccess) {
      const userRunCount = await prisma.agentRun.count({
        where: { agentId: agent.id, userId },
      });

      if (userRunCount >= FREE_LIMIT) {
        const state = await getAgentState(agentSlug, userId);
        return NextResponse.json(
          { error: "Limit darmowych użyć wyczerpany.", ...state, isAuthenticated: true },
          { status: 403 }
        );
      }
    }

    let result: string;
    try {
      result = await runAgent({
        agentName: agent.name,
        agentDescription: agent.description,
        userInput,
      });
    } catch (openaiError) {
      console.error("POST /api/run-agent — OpenAI error:", openaiError);
      return NextResponse.json({ error: "Nie udało się uruchomić agenta." }, { status: 500 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.agent.update({
          where: { id: agent.id },
          data: { runsCount: { increment: 1 } },
        });
        await tx.agentRun.create({
          data: { agentId: agent.id, userId, inputJson: userInput, outputText: result },
        });
      });
    } catch (dbError) {
      console.error("POST /api/run-agent — DB transaction error:", dbError);
    }

    const state = await getAgentState(agentSlug, userId);
    return NextResponse.json({ result, ...state, isAuthenticated: true });
  } catch (error) {
    console.error("POST /api/run-agent — unexpected error:", error);
    return NextResponse.json({ error: "Nie udało się uruchomić agenta." }, { status: 500 });
  }
}
