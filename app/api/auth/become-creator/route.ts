import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Zaloguj się, aby kontynuować." }, { status: 401 });
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Nie znaleziono użytkownika." }, { status: 404 });
  }

  if (user.role === "CREATOR" || user.role === "ADMIN") {
    return NextResponse.json({ ok: true, alreadyCreator: true });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "CREATOR" },
  });

  return NextResponse.json({ ok: true });
}
