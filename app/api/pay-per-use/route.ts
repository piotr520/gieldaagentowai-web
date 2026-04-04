import { NextResponse } from "next/server";

// SAFE MODE: pay-per-use real payment not yet implemented.
// Endpoint is disabled to prevent free credit creation.
export async function POST() {
  return NextResponse.json(
    { error: "Zakup dodatkowych użyć jest tymczasowo niedostępny." },
    { status: 503 }
  );
}
