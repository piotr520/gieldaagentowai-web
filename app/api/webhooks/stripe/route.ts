import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Brak podpisu lub sekretu webhooka." }, { status: 400 });
  }

  let event;
  try {
    const rawBody = await req.text();
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Nieprawidłowy podpis webhooka." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, agentId } = session.metadata ?? {};

    if (!userId || !agentId) {
      console.error("Stripe webhook: brak metadata", session.metadata);
      return NextResponse.json({ error: "Brak metadata." }, { status: 400 });
    }

    const paymentStatus = session.payment_status;
    if (paymentStatus === "paid") {
      console.log(
        `Stripe webhook: payment_status=paid — aktywuję dostęp userId=${userId} agentId=${agentId} session=${session.id}`
      );
    } else if (paymentStatus === "unpaid") {
      console.warn(
        `Stripe webhook: payment_status=unpaid — pomijam AgentAccess userId=${userId} agentId=${agentId} session=${session.id}`
      );
      return NextResponse.json({ received: true });
    } else if (paymentStatus === "no_payment_required") {
      console.log(
        `Stripe webhook: payment_status=no_payment_required — aktywuję dostęp userId=${userId} agentId=${agentId} session=${session.id}`
      );
    } else {
      console.error(
        `Stripe webhook: nieoczekiwany payment_status="${paymentStatus}" — pomijam AgentAccess userId=${userId} agentId=${agentId} session=${session.id}`
      );
      return NextResponse.json({ received: true });
    }

    try {
      await prisma.agentAccess.upsert({
        where: { userId_agentId: { userId, agentId } },
        update: {},
        create: { userId, agentId },
      });
    } catch (err) {
      console.error("Stripe webhook: błąd zapisu AgentAccess:", err);
      return NextResponse.json({ error: "Błąd zapisu." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
