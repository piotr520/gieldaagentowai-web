import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Role = "ADMIN" | "CREATOR";
type SessionUser = { id: string; email: string | null; role: Role };

function readSessionUser(session: unknown): SessionUser | null {
  if (!session || typeof session !== "object") return null;
  const s = session as { user?: unknown };
  const u = s.user;
  if (!u || typeof u !== "object") return null;
  const uu = u as { id?: unknown; email?: unknown; role?: unknown };

  if (typeof uu.id !== "string") return null;

  const role = uu.role;
  if (role !== "ADMIN" && role !== "CREATOR") return null;

  const email = typeof uu.email === "string" ? uu.email : null;
  return { id: uu.id, email, role };
}

export default async function DashboardPage() {
  const session = await getSession();
  const user = readSessionUser(session);

  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const agents = await prisma.agent.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, status: true, createdAt: true, updatedAt: true }
  });

  return (
    <main>
      <h1>Dashboard twórcy</h1>
      <p>Zalogowany: {user.email ?? "-"}</p>
      <SignOutButton />

      <h2>Twoi agenci</h2>

      {agents.length === 0 ? (
        <p>Brak agentów.</p>
      ) : (
        <ul>
          {agents.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong> — {a.status} — <Link href={`/agents/${a.slug}`}>Podgląd</Link>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link href="/">Powrót do katalogu</Link>
      </p>
    </main>
  );
}