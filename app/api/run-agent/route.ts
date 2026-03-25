import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "../../../lib/openai";
import { prisma } from "../../../lib/prisma";

const FREE_LIMIT = 3;

type RunItem = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
};

async function getAgentState(agentSlug: string) {
  const agent = await prisma.agent.findUnique({
    where: { slug: agentSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      runsCount: true,
    },
  });

  if (!agent) return null;

  const latestRuns = await prisma.agentRun.findMany({
    where: { agentId: agent.id },
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
    usedFreeRuns: Math.min(agent.runsCount, FREE_LIMIT),
    remainingFreeRuns: Math.max(0, FREE_LIMIT - agent.runsCount),
    latestRuns: runs,
  };
}

export async function GET(req: NextRequest) {
  const agentSlug = req.nextUrl.searchParams.get("agentSlug")?.trim();

  if (!agentSlug) {
    return NextResponse.json({ error: "Brak parametru agentSlug." }, { status: 400 });
  }

  const state = await getAgentState(agentSlug);

  if (!state) {
    return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const agentSlug = typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";
    const userInput = typeof body.input === "string" ? body.input.trim() : "";

    if (!agentSlug || !userInput) {
      return NextResponse.json({ error: "Brak wymaganych pól: agentSlug, input." }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
      select: { id: true, name: true, description: true, runsCount: true, status: true },
    });

    if (!agent || agent.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
    }

    if (agent.runsCount >= FREE_LIMIT) {
      const state = await getAgentState(agentSlug);
      return NextResponse.json(
        { error: "Limit darmowych użyć został wyczerpany.", ...state },
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
        data: {
          agentId: agent.id,
          userId: null,
          inputJson: userInput,
          outputText: result,
        },
      });
    });

    const state = await getAgentState(agentSlug);

    return NextResponse.json({ result, ...state });
  } catch (error) {
    console.error("POST /api/run-agent error:", error);
    return NextResponse.json({ error: "Nie udało się uruchomić agenta." }, { status: 500 });
  }
}
