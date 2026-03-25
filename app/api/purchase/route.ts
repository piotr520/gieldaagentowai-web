import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TODO: Etap 6 – podłączyć Stripe przed produkcją.
// Na razie endpoint symuluje zakup (tworzy AgentAccess bez bramki płatności).

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Zaloguj się, aby kupić dostęp." }, { status: 401 });
  }

  const body = await req.json();
  const agentSlug = typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";

  if (!agentSlug) {
    return NextResponse.json({ error: "Brak agentSlug." }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { slug: agentSlug },
    select: { id: true, name: true, pricingType: true, status: true },
  });

  if (!agent || agent.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
  }

  if (agent.pricingType === "FREE") {
    return NextResponse.json({ error: "Ten agent jest darmowy." }, { status: 400 });
  }

  // Upsert – jeśli użytkownik już ma dostęp, nie duplikujemy
  await prisma.agentAccess.upsert({
    where: { userId_agentId: { userId: session.user.id, agentId: agent.id } },
    update: {},
    create: { userId: session.user.id, agentId: agent.id },
  });

  return NextResponse.json({ ok: true, agentName: agent.name });
}
