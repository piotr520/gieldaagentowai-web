import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const u = session.user as any;
  const role = u.role as string;
  if (role === "ADMIN") redirect("/admin");

  const userId = u.id as string;

  const agents = await prisma.agent.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, status: true, createdAt: true, updatedAt: true }
  });

  return (
    <main>
      <h1>Dashboard twórcy</h1>
      <p>Zalogowany: {session.user.email}</p>
      <SignOutButton />

      <h2>Twoi agenci</h2>

      {agents.length === 0 ? (
        <p>Brak agentów.</p>
      ) : (
        <ul>
          {agents.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong> — {a.status} —{" "}
              <Link href={`/agents/${a.slug}`}>Podgląd</Link>
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