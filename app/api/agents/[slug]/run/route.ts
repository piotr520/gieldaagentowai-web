import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const agent = await prisma.agent.findUnique({
    where: { slug },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await req.json();
  const outputText = `Oferta dla: ${body.input}`;

  const run = await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      inputJson: body.input,
      outputText,
    },
  });

  return NextResponse.json({
    output: outputText,
    runId: run.id,
  });
}
