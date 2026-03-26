import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREE_LIMIT = 3;

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const userEmail = session.user.email ?? "-";

  // Historia uruchomień użytkownika (ostatnie 20)
  const runs = await prisma.agentRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      inputJson: true,
      outputText: true,
      createdAt: true,
      agent: { select: { name: true, slug: true } },
    },
  });

  // Per-agent statystyki
  const agentStats = await prisma.agentRun.groupBy({
    by: ["agentId"],
    where: { userId },
    _count: { id: true },
  });

  const agentIds = agentStats.map((s) => s.agentId);
  const agents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Moje konto</h1>
      <p className="mb-6 text-sm text-neutral-500">{userEmail}</p>

      <div className="mb-6 flex gap-3">
        <SignOutButton />
      </div>

      {/* Statystyki per agent */}
      {agentStats.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Użyte agenty</h2>
          <div className="space-y-2">
            {agentStats.map((stat) => {
              const agent = agentMap[stat.agentId];
              if (!agent) return null;
              const used = stat._count.id;
              const remaining = Math.max(0, FREE_LIMIT - used);
              return (
                <div
                  key={stat.agentId}
                  className="flex items-center justify-between rounded border border-neutral-200 px-4 py-3"
                >
                  <div>
                    <Link href={`/agents/${agent.slug}`} className="font-medium hover:underline">
                      {agent.name}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      Uruchomień: {used} / {FREE_LIMIT} — pozostało darmowych: {remaining}
                    </p>
                  </div>
                  <Link
                    href={`/agents/${agent.slug}/run`}
                    className="text-sm font-medium underline"
                  >
                    Uruchom →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Historia uruchomień */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Historia uruchomień</h2>

        {runs.length === 0 ? (
          <div className="rounded border border-neutral-200 p-6 text-center">
            <p className="text-sm text-neutral-500">Brak uruchomień. Zacznij od katalogu agentów.</p>
            <Link href="/agents" className="mt-3 inline-block text-sm font-medium underline">
              Przeglądaj agentów →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, i) => (
              <article key={run.id} className="rounded border border-neutral-200 p-4">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/agents/${run.agent.slug}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {run.agent.name}
                    </Link>
                    <p className="text-xs text-neutral-400">
                      {run.createdAt.toLocaleString("pl-PL")} · #{runs.length - i}
                    </p>
                  </div>
                  <Link
                    href={`/agents/${run.agent.slug}/run`}
                    className="shrink-0 text-xs font-medium underline"
                  >
                    Uruchom znowu
                  </Link>
                </div>
                <p className="mb-2 rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700 line-clamp-2">
                  Zapytanie: {run.inputJson}
                </p>
                <p className="text-xs text-neutral-600 line-clamp-3">
                  {run.outputText}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Strona główna
        </Link>
      </p>
    </main>
  );
}
