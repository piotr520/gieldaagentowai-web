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
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moje konto</h1>
          <p className="mt-1 text-sm text-slate-500">{userEmail}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Uruchomień łącznie</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{runs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Używanych agentów</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{agentStats.length}</p>
        </div>
        <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 sm:block">
          <p className="text-xs font-medium text-slate-500">Konto</p>
          <p className="mt-1 text-sm font-semibold text-indigo-600">USER</p>
        </div>
      </div>

      {/* Agent usage */}
      {agentStats.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Używane agenty</h2>
          <div className="space-y-3">
            {agentStats.map((stat) => {
              const agent = agentMap[stat.agentId];
              if (!agent) return null;
              const used = stat._count.id;
              const pct = Math.min((used / FREE_LIMIT) * 100, 100);
              const remaining = Math.max(0, FREE_LIMIT - used);
              return (
                <div key={stat.agentId} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/agents/${agent.slug}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                        {agent.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {used} / {FREE_LIMIT} uruchomień — pozostało darmowych: {remaining}
                      </p>
                    </div>
                    <Link
                      href={`/agents/${agent.slug}/run`}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 transition-colors"
                    >
                      Uruchom →
                    </Link>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${used >= FREE_LIMIT ? "bg-red-500" : "bg-indigo-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Run history */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Historia uruchomień</h2>

        {runs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">⚡</div>
            <p className="font-medium text-slate-700">Brak uruchomień</p>
            <p className="mt-1 text-sm text-slate-500">Zacznij od katalogu agentów</p>
            <Link href="/agents" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              Przeglądaj agentów →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, i) => (
              <article key={run.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/agents/${run.agent.slug}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                      {run.agent.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {run.createdAt.toLocaleString("pl-PL")} · #{runs.length - i}
                    </p>
                  </div>
                  <Link href={`/agents/${run.agent.slug}/run`} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Uruchom znowu
                  </Link>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 line-clamp-1">
                  <span className="font-medium text-slate-400">Zapytanie: </span>{run.inputJson}
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{run.outputText}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
