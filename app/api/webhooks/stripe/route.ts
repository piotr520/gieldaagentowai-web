import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Next.js App Router: read raw body via req.text() — no bodyParser config needed.
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  // Verify signature
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook: signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  console.log(`Stripe webhook received: ${event.type} [${event.id}]`);

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const agentId = session.metadata?.agentId;

        if (!userId || !agentId) {
          console.error(
            `Stripe webhook: checkout.session.completed missing metadata — session ${session.id}`
          );
          return NextResponse.json({ received: true });
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id ?? null;

        await prisma.agentAccess.upsert({
          where: { userId_agentId: { userId, agentId } },
          create: { userId, agentId, subscriptionId: subscriptionId ?? null },
          update: { subscriptionId: subscriptionId ?? null },
        });

        console.log(
          `Stripe webhook: AgentAccess granted — userId=${userId} agentId=${agentId}` +
            (subscriptionId ? ` subscriptionId=${subscriptionId}` : " (one-time)")
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        const deleted = await prisma.agentAccess.deleteMany({
          where: { subscriptionId },
        });

        if (deleted.count > 0) {
          console.log(
            `Stripe webhook: AgentAccess revoked — subscriptionId=${subscriptionId} (${deleted.count} record(s))`
          );
        } else {
          console.warn(
            `Stripe webhook: no AgentAccess found for subscriptionId=${subscriptionId}`
          );
        }
        break;
      }

      default:
        console.log(`Stripe webhook: unhandled event type ${event.type} — ignored`);
    }
  } catch (err) {
    console.error(`Stripe webhook: error handling ${event.type}:`, err);
    return NextResponse.json(
      { error: "Internal error processing webhook." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
