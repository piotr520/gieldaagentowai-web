import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREE_LIMIT = 3;

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const userEmail = session.user.email ?? "-";

  const [runs, agentStats, purchasedAccess] = await Promise.all([
    prisma.agentRun.findMany({
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
    }),
    prisma.agentRun.groupBy({
      by: ["agentId"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.agentAccess.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        agent: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            pricingLabel: true,
            pricingType: true,
          },
        },
      },
    }),
  ]);

  const agentIds = agentStats.map((s) => s.agentId);
  const usedAgents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];

  const agentMap = Object.fromEntries(usedAgents.map((a) => [a.id, a]));
  // Set of agentIds user has full access to
  const accessSet = new Set(purchasedAccess.map((a) => a.agent.id));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Moje konto</h1>
          <p className="mt-1.5 text-sm text-slate-500">{userEmail}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <input type="hidden" name="callbackUrl" value="/" />
          <button
            type="submit"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Wyloguj
          </button>
        </form>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-1">Uruchomień łącznie</p>
          <p className="text-3xl font-extrabold text-indigo-700">{runs.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Używanych agentów</p>
          <p className="text-3xl font-extrabold text-slate-900">{agentStats.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 mb-1">Zakupionych dostępów</p>
          <p className="text-3xl font-extrabold text-violet-700">{purchasedAccess.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 mb-1">Konto aktywne</p>
          <p className="text-3xl font-extrabold text-emerald-600">✓</p>
        </div>
      </div>

      {/* Purchased agents */}
      {purchasedAccess.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-extrabold text-slate-900">Zakupione agenty</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {purchasedAccess.map(({ id, createdAt, agent }) => (
              <div
                key={id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      ✓ Pełny dostęp
                    </span>
                  </div>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="font-bold text-slate-900 hover:text-indigo-700 transition-colors line-clamp-1"
                  >
                    {agent.name}
                  </Link>
                  {agent.tagline && (
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{agent.tagline}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Zakupiono: {createdAt.toLocaleDateString("pl-PL")}
                    {agent.pricingLabel ? ` · ${agent.pricingLabel}` : ""}
                  </p>
                </div>
                <Link
                  href={`/agents/${agent.slug}/run`}
                  className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  Uruchom →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agent usage (free limits) — only for agents without full access */}
      {agentStats.some((s) => !accessSet.has(s.agentId)) && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-extrabold text-slate-900">Darmowe użycia</h2>
          <div className="space-y-3">
            {agentStats
              .filter((s) => !accessSet.has(s.agentId))
              .map((stat) => {
                const agent = agentMap[stat.agentId];
                if (!agent) return null;
                const used = stat._count.id;
                const remaining = Math.max(0, FREE_LIMIT - used);
                const pct = Math.min(100, (used / FREE_LIMIT) * 100);
                return (
                  <div key={stat.agentId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <Link
                        href={`/agents/${agent.slug}`}
                        className="font-bold text-slate-900 hover:text-indigo-700 transition-colors"
                      >
                        {agent.name}
                      </Link>
                      <Link
                        href={`/agents/${agent.slug}/run`}
                        className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Uruchom →
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-1.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        {used}/{FREE_LIMIT} · {remaining} pozostało
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Run history */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-slate-900">Historia uruchomień</h2>

        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-3xl">⚡</div>
            <p className="font-bold text-slate-800 text-lg">Brak uruchomień</p>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">Zacznij od katalogu agentów i uruchom pierwszego agenta.</p>
            <Link
              href="/agents"
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Przeglądaj agentów
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, i) => (
              <article
                key={run.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/agents/${run.agent.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-700 transition-colors"
                    >
                      {run.agent.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {run.createdAt.toLocaleString("pl-PL")} · #{runs.length - i}
                    </p>
                  </div>
                  <Link
                    href={`/agents/${run.agent.slug}/run`}
                    className="shrink-0 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Uruchom znowu
                  </Link>
                </div>
                <div className="mb-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2.5 text-xs text-slate-700 line-clamp-2">
                  {run.inputJson}
                </div>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{run.outputText}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
