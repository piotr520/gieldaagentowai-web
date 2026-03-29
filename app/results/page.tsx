import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Agent = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  pricingType: string;
  pricingLabel: string;
  pricingAmountPln: number | null;
  pricingAmountPlnPerMonth: number | null;
  runsCount: number;
};

function scoreAgent(agent: Agent, words: string[], branza: string, cel: string): number {
  let score = 0;
  const name = agent.name.toLowerCase();
  const tagline = agent.tagline.toLowerCase();
  const cat = agent.category.toLowerCase();
  const desc = agent.description.toLowerCase();

  for (const w of words) {
    if (name.includes(w)) score += 6;
    if (tagline.includes(w)) score += 4;
    if (cat.includes(w)) score += 3;
    if (desc.includes(w)) score += 1;
  }
  if (branza && cat.includes(branza.toLowerCase())) score += 5;
  if (cel) {
    for (const w of cel.toLowerCase().split(/\s+/).filter((x) => x.length > 1)) {
      if (tagline.includes(w)) score += 2;
      if (desc.includes(w)) score += 1;
    }
  }
  return score;
}

function lowestPrice(agent: Agent): number {
  if (agent.pricingType === "FREE") return 0;
  if (agent.pricingType === "ONE_TIME") return agent.pricingAmountPln ?? 99999;
  return (agent.pricingAmountPlnPerMonth ?? 99999) * 12;
}

function priceLabel(agent: Agent): string {
  if (agent.pricingType === "FREE") return "Darmowy";
  return agent.pricingLabel;
}

const CATEGORY_ICONS: Record<string, string> = {
  Biznes: "💼", Marketing: "📢", HR: "👥", "E-commerce": "🛒",
  Prawo: "⚖️", IT: "💻", Edukacja: "📚", Budownictwo: "🏗️",
  Finanse: "💰", Zdrowie: "🏥",
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branza?: string; cel?: string; budzet?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const branza = (sp.branza ?? "").trim();
  const cel = (sp.cel ?? "").trim();
  const budzet = (sp.budzet ?? "").trim();

  if (!query && !branza && !cel) redirect("/agents");

  const allAgents = await prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, slug: true, name: true, tagline: true, category: true,
      description: true, pricingType: true, pricingLabel: true,
      pricingAmountPln: true, pricingAmountPlnPerMonth: true, runsCount: true,
    },
  });

  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);

  const scored = allAgents
    .map((a) => ({ ...a, score: scoreAgent(a, words, branza, cel) }))
    .sort((a, b) => b.score !== a.score ? b.score - a.score : b.runsCount - a.runsCount);

  const hasMatches = scored.some((a) => a.score > 0);
  const results = hasMatches ? scored.filter((a) => a.score > 0) : [];
  const GOOD_MATCH_THRESHOLD = 4;
  const hasGoodMatch = results.length > 0 && results[0].score >= GOOD_MATCH_THRESHOLD;

  // badge indices
  const bestIdx = 0;
  const cheapestIdx = results.reduce(
    (best, a, i) => (lowestPrice(a) < lowestPrice(results[best]) ? i : best),
    0
  );
  const freeIdx = results.findIndex((a) => a.pricingType === "FREE");

  // build prefill params for /dashboard/new
  const prefillParams = new URLSearchParams();
  if (query) prefillParams.set("prefill_desc", query);
  if (branza) prefillParams.set("prefill_branza", branza);
  if (cel) prefillParams.set("prefill_cel", cel);
  const newAgentHref = `/dashboard/new?${prefillParams.toString()}`;

  const best = results[0];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Search bar */}
      <form action="/results" method="GET" className="mb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.197 15.803a7.5 7.5 0 0 0 10.606 0z" />
            </svg>
            <input type="text" name="q" defaultValue={query} autoComplete="off"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Opisz czego potrzebujesz..." />
          </div>
          {branza && <input type="hidden" name="branza" value={branza} />}
          {cel && <input type="hidden" name="cel" value={cel} />}
          {budzet && <input type="hidden" name="budzet" value={budzet} />}
          <button type="submit"
            className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shrink-0">
            Szukaj
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {results.length === 0
            ? `Brak dopasowań dla zapytania`
            : `${results.length} agent${results.length === 1 ? "" : "ów"} dopasowanych`}
          {query && <> · zapytanie: <span className="font-medium text-slate-700">{query}</span></>}
          {branza && <> · branża: <span className="font-medium text-slate-700">{branza}</span></>}
        </p>
      </form>

      {/* Section 1: AI recommendation */}
      {hasGoodMatch && best && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">
            Najlepsze dopasowanie
          </h2>
          <div className="rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm ring-1 ring-indigo-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-indigo-200 text-3xl shadow-sm">
                  {CATEGORY_ICONS[best.category] ?? "🤖"}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Najlepszy wybór
                  </div>
                  <Link href={`/agents/${best.slug}`}
                    className="block text-xl font-extrabold text-slate-900 hover:text-indigo-700 transition-colors">
                    {best.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{best.tagline}</p>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Pasuje do Twojego zapytania — specjalizuje się w kategorii{" "}
                    <span className="font-semibold text-slate-700">{best.category}</span>
                    {best.runsCount > 0 && (
                      <> i ma <span className="font-semibold text-slate-700">{best.runsCount.toLocaleString("pl-PL")} uruchomień</span></>
                    )}.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Link href={`/agents/${best.slug}/run`}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all hover:-translate-y-0.5 shadow-sm">
                  Uruchom →
                </Link>
                <span className={`text-sm font-bold ${best.pricingType === "FREE" ? "text-emerald-600" : "text-slate-700"}`}>
                  {priceLabel(best)}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: ranking */}
      {results.length > 0 && (
        <section className="mb-8">
          {hasGoodMatch && results.length > 1 && (
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Inne dopasowania
            </h2>
          )}
          <div className="space-y-3">
            {results.slice(hasGoodMatch ? 1 : 0).map((agent, idx) => {
              const i = hasGoodMatch ? idx + 1 : idx;
              const badges: { label: string; color: string }[] = [];
              if (i === cheapestIdx) badges.push({ label: "Najtańszy", color: "bg-emerald-600 text-white" });
              if (i === freeIdx && freeIdx !== bestIdx) badges.push({ label: "Najszybszy", color: "bg-amber-500 text-white" });
              const icon = CATEGORY_ICONS[agent.category] ?? "🤖";

              return (
                <div key={agent.id}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white shadow">
                    {i + 1}
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-lg">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        {badges.length > 0 && (
                          <div className="mb-1.5 flex flex-wrap gap-1">
                            {badges.map((b) => (
                              <span key={b.label}
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${b.color}`}>
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link href={`/agents/${agent.slug}`}
                          className="font-bold text-slate-900 hover:text-indigo-700 transition-colors">
                          {agent.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{agent.tagline}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{agent.category}</span>
                          <span>⚡ {agent.runsCount.toLocaleString("pl-PL")}</span>
                          <span className={`font-bold ${agent.pricingType === "FREE" ? "text-emerald-600" : "text-blue-600"}`}>
                            {priceLabel(agent)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/agents/${agent.slug}/run`}
                      className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                      Uruchom →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3: fallback */}
      {!hasGoodMatch && (
        <section className="mb-8">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-3xl">
              🔍
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">
              Nie znaleziono idealnego agenta
            </h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {query
                ? `Żaden z dostępnych agentów nie pasuje dokładnie do zapytania "${query}".`
                : "Żaden agent nie pasuje do podanych kryteriów."}
              {" "}Możesz zaprojektować własnego agenta.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href={newAgentHref}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
                Zaprojektuj nowego agenta →
              </Link>
              <Link href="/agents"
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Przeglądaj katalog
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Always show design CTA if there are results too */}
      {hasGoodMatch && results.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Nie widzisz agenta spełniającego Twoje potrzeby?
          </p>
          <Link href={newAgentHref}
            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shrink-0">
            Zaprojektuj nowego agenta →
          </Link>
        </div>
      )}

      <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-between">
        <Link href="/agents" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          ← Cały katalog
        </Link>
        <p className="text-xs text-slate-400">Ranking wg trafności · runsCount</p>
      </div>
    </main>
  );
}
