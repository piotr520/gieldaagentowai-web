import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (typeof body.email === "string" ? body.email : "").toLowerCase().trim();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email i hasło są wymagane." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Hasło musi mieć minimum 8 znaków." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Konto z tym adresem email już istnieje." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, passwordHash, role: "USER" } });

  return NextResponse.json({ ok: true });
}
