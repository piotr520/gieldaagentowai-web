import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

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
    select: {
      id: true,
      name: true,
      tagline: true,
      pricingType: true,
      pricingAmountPln: true,
      pricingAmountPlnPerMonth: true,
      status: true,
    },
  });

  if (!agent || agent.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Nie znaleziono agenta." }, { status: 404 });
  }

  if (agent.pricingType === "FREE") {
    return NextResponse.json({ error: "Ten agent jest darmowy." }, { status: 400 });
  }

  if (agent.pricingType === "PAY_PER_USE") {
    return NextResponse.json(
      { error: "Zakup dodatkowych użyć jest tymczasowo niedostępny." },
      { status: 503 }
    );
  }

  // Jeśli użytkownik już ma dostęp — nie tworzymy sesji
  const existing = await prisma.agentAccess.findUnique({
    where: { userId_agentId: { userId: session.user.id, agentId: agent.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Masz już dostęp do tego agenta." }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const unitAmount =
    agent.pricingType === "ONE_TIME"
      ? (agent.pricingAmountPln ?? 0) * 100
      : (agent.pricingAmountPlnPerMonth ?? 0) * 100;

  if (unitAmount <= 0) {
    return NextResponse.json({ error: "Nieprawidłowa kwota." }, { status: 400 });
  }

  const stripe = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: agent.pricingType === "SUBSCRIPTION" ? "subscription" : "payment",
    payment_method_types: ["card", "blik", "p24"],
    line_items: [
      {
        price_data: {
          currency: "pln",
          unit_amount: unitAmount,
          ...(agent.pricingType === "SUBSCRIPTION"
            ? { recurring: { interval: "month" } }
            : {}),
          product_data: {
            name: agent.name,
            description: agent.tagline ?? undefined,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      agentId: agent.id,
      agentSlug,
      agentName: agent.name,
    },
    success_url: `${baseUrl}/agents/${agentSlug}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/agents/${agentSlug}/run`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
