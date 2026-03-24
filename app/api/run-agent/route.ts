import { NextRequest, NextResponse } from "next/server";
import { generateOffer } from "../../../lib/openai";
import { prisma } from "../../../lib/prisma";

const FREE_LIMIT = 3;
const DEFAULT_AGENT_SLUG = "oferta-handlowa-b2b";

type HistoryItem = {
  id: string;
  createdAt: string;
  branza: string;
  usluga: string;
  cena: string;
  termin: string;
  wynik: string;
};

function parseInputJson(inputJson: string) {
  try {
    const parsed = JSON.parse(inputJson);
    return {
      branza: typeof parsed?.branza === "string" ? parsed.branza : "",
      usluga: typeof parsed?.usluga === "string" ? parsed.usluga : "",
      cena: typeof parsed?.cena === "string" ? parsed.cena : "",
      termin: typeof parsed?.termin === "string" ? parsed.termin : "",
    };
  } catch {
    return {
      branza: "",
      usluga: "",
      cena: "",
      termin: "",
    };
  }
}

async function getAgentState(agentSlug: string) {
  const agent = await prisma.agent.findUnique({
    where: { slug: agentSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      runsCount: true,
    },
  });

  if (!agent) {
    return null;
  }

  const latestRuns = await prisma.agentRun.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      inputJson: true,
      outputText: true,
      createdAt: true,
    },
  });

  const latestOffers: HistoryItem[] = latestRuns.map((run) => {
    const parsed = parseInputJson(run.inputJson);

    return {
      id: run.id,
      createdAt: run.createdAt.toLocaleString("pl-PL"),
      branza: parsed.branza,
      usluga: parsed.usluga,
      cena: parsed.cena,
      termin: parsed.termin,
      wynik: run.outputText,
    };
  });

  return {
    agentId: agent.id,
    agentSlug: agent.slug,
    agentName: agent.name,
    freeLimit: FREE_LIMIT,
    usedFreeRuns: Math.min(agent.runsCount, FREE_LIMIT),
    remainingFreeRuns: Math.max(0, FREE_LIMIT - agent.runsCount),
    latestOffers,
    latestResult: latestOffers.length > 0 ? latestOffers[0].wynik : "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const agentSlug =
      req.nextUrl.searchParams.get("agentSlug")?.trim() || DEFAULT_AGENT_SLUG;

    const state = await getAgentState(agentSlug);

    if (!state) {
      return NextResponse.json(
        { error: "Nie znaleziono agenta." },
        { status: 404 }
      );
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/run-agent error:", error);

    return NextResponse.json(
      { error: "Nie udało się pobrać stanu agenta." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const agentSlug =
      typeof body.agentSlug === "string" && body.agentSlug.trim() !== ""
        ? body.agentSlug.trim()
        : DEFAULT_AGENT_SLUG;

    const branza = typeof body.branza === "string" ? body.branza.trim() : "";
    const usluga = typeof body.usluga === "string" ? body.usluga.trim() : "";
    const cena = typeof body.cena === "string" ? body.cena.trim() : "";
    const termin = typeof body.termin === "string" ? body.termin.trim() : "";

    if (!branza || !usluga || !cena || !termin) {
      return NextResponse.json(
        { error: "Brak wymaganych pól wejściowych." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { slug: agentSlug },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Nie znaleziono agenta." },
        { status: 404 }
      );
    }

    const result = await generateOffer({
      agentName: agent.name,
      branza,
      usluga,
      cena,
      termin,
    });

    const txResult = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.agent.updateMany({
        where: {
          id: agent.id,
          runsCount: {
            lt: FREE_LIMIT,
          },
        },
        data: {
          runsCount: {
            increment: 1,
          },
        },
      });

      if (updateResult.count === 0) {
        return { limited: true as const };
      }

      await tx.agentRun.create({
        data: {
          agentId: agent.id,
          userId: null,
          inputJson: JSON.stringify(
            {
              agentSlug: agent.slug,
              branza,
              usluga,
              cena,
              termin,
            },
            null,
            2
          ),
          outputText: result,
        },
      });

      return { limited: false as const };
    });

    const state = await getAgentState(agentSlug);

    if (!state) {
      return NextResponse.json(
        { error: "Nie znaleziono agenta po zapisaniu stanu." },
        { status: 404 }
      );
    }

    if (txResult.limited) {
      return NextResponse.json(
        {
          error: "Limit darmowy został wykorzystany.",
          ...state,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      result,
      ...state,
    });
  } catch (error) {
    console.error("POST /api/run-agent error:", error);

    return NextResponse.json(
      { error: "Nie udało się uruchomić agenta." },
      { status: 500 }
    );
  }
}