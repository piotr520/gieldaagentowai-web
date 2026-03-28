import { NextResponse } from "next/server";

// Deprecated: this endpoint previously simulated purchases.
// All payments now go through /api/checkout → Stripe Checkout.
export async function POST() {
  return NextResponse.json(
    { error: "Użyj endpointu /api/checkout, aby rozpocząć płatność." },
    { status: 410 }
  );
}
