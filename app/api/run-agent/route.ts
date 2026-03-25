import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "../../../lib/openai";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../../lib/auth";

const FREE_LIMIT = 3;

type RunItem = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
};

async function getAgentState(agentSlug: string, userId: string | null) {
  const agent = await prisma.agent.findUnique({
    where: { slug: agentSlug },
    select: { id: true, slug: true, name: true, description: true, runsCount: true },
  });

  if (!agent) return null;

  // Limit per użytkownik (jeśli zalogowany), globalny tylko jako fallback
  const userRunCount = userId
    ? await prisma.agentRun.count({ where: { agentId: agent.id, userId } })
    : 0;

  const usedFreeRuns = userId ? Math.min(userRunCount, FREE_LIMIT) : 0;
  const remainingFreeRuns = userId ? Math.max(0, FREE_LIMIT - userRunCount) : FREE_LIMIT;

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
    freeLimit: FREE_LIMIT,
    usedFreeRuns,
    remainingFreeRuns,
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

    const body = await req.json();
    const agentSlug = typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";
    const userInput = typeof body.input === "string" ? body.input.trim() : "";

    if (!agentSlug || !userInput) {
      return NextResponse.json({ error: "Brak wymaganych pól: agentSlug, input." }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
      select: { id: true, name: true, description: true, status: true },
    });

    if (!agent || agent.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
    }

    // Sprawdź limit per użytkownik
    const userRunCount = await prisma.agentRun.count({
      where: { agentId: agent.id, userId },
    });

    if (userRunCount >= FREE_LIMIT) {
      const state = await getAgentState(agentSlug, userId);
      return NextResponse.json(
        { error: "Limit darmowych użyć został wyczerpany.", ...state, isAuthenticated: true },
        { status: 403 }
      );
    }

    const result = await runAgent({
      agentName: agent.name,
      agentDescription: agent.description,
      userInput,
    });

    await prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agent.id },
        data: { runsCount: { increment: 1 } },
      });
      await tx.agentRun.create({
        data: { agentId: agent.id, userId, inputJson: userInput, outputText: result },
      });
    });

    const state = await getAgentState(agentSlug, userId);
    return NextResponse.json({ result, ...state, isAuthenticated: true });
  } catch (error) {
    console.error("POST /api/run-agent error:", error);
    return NextResponse.json({ error: "Nie udało się uruchomić agenta." }, { status: 500 });
  }
}
