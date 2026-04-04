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

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : null;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : null;
    const invoiceId = invoice.id;
    const invoiceStatus = invoice.status ?? "unknown";
    // billing_reason is available on the Invoice object (e.g. "subscription_cycle", "manual")
    const billingReason = (invoice as { billing_reason?: string }).billing_reason ?? "unknown";

    console.error(
      `Stripe webhook: invoice.payment_failed — invoiceId=${invoiceId} customerId=${customerId ?? "unknown"} subscriptionId=${subscriptionId ?? "none"} status=${invoiceStatus} billing_reason=${billingReason}`
    );

    // AgentAccess is intentionally NOT revoked here.
    // Stripe retries failed payments (Smart Retries / Dunning) during the
    // grace period. Revoking access on first failure would break subscriptions
    // that recover on retry. The definitive revocation happens when Stripe
    // sends customer.subscription.deleted after all retries are exhausted.
    console.log(
      `Stripe webhook: invoice.payment_failed — AgentAccess NOT revoked (awaiting customer.subscription.deleted if retries fail) subscriptionId=${subscriptionId ?? "none"}`
    );
  }

  return NextResponse.json({ received: true });
}
