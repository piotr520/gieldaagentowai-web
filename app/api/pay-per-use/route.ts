import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession } from "../../../lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json(
      { error: "Zaloguj się, aby dokonać płatności.", requiresAuth: true },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";

  if (!agentId) {
    return NextResponse.json({ error: "Brak wymaganego pola: agentId." }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, pricingType: true, pricePerUse: true, status: true },
  });

  if (!agent || agent.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
  }

  if (agent.pricingType !== "PAY_PER_USE") {
    return NextResponse.json(
      { error: "Ten agent nie obsługuje płatności za użycie." },
      { status: 400 }
    );
  }

  // Create one fake credit (1 FakePayment = 1 purchased run)
  await prisma.fakePayment.create({
    data: { userId, agentId: agent.id },
  });

  const remainingCredits = await prisma.fakePayment.count({
    where: { userId, agentId: agent.id },
  });

  return NextResponse.json({
    success: true,
    pricePerUse: agent.pricePerUse,
    remainingCredits,
  });
}
