import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

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

type ScoredAgent = Agent & {
  score: number;
  matchTags: string[];
  reasonParts: string[];
};

// --- scoring ---

function lowestPrice(agent: Agent): number {
  if (agent.pricingType === "FREE") return 0;
  if (agent.pricingType === "ONE_TIME") return agent.pricingAmountPln ?? 99999;
  return (agent.pricingAmountPlnPerMonth ?? 99999) * 12;
}

function priceLabel(agent: Agent): string {
  if (agent.pricingType === "FREE") return "Darmowy";
  return agent.pricingLabel;
}

function scoreAgent(
  agent: Agent,
  words: string[],
  phrase: string,
  branza: string,
  cel: string,
  budzet: number | null,
): ScoredAgent {
  let score = 0;
  const matchTags: string[] = [];
  const reasonParts: string[] = [];

  const name = agent.name.toLowerCase();
  const tagline = agent.tagline.toLowerCase();
  const cat = agent.category.toLowerCase();
  const desc = agent.description.toLowerCase();

  // exact phrase bonus
  if (phrase.length > 3) {
    if (name.includes(phrase)) { score += 10; }
    else if (tagline.includes(phrase)) { score += 7; }
    else if (desc.includes(phrase)) { score += 3; }
  }

  // per-word scoring
  for (const w of words) {
    if (name.includes(w)) { score += 6; matchTags.push(w); }
    else if (tagline.includes(w)) { score += 4; matchTags.push(w); }
    else if (cat.includes(w)) { score += 3; matchTags.push(w); }
    else if (desc.includes(w)) { score += 1; }
  }

  // branza
  if (branza && cat.includes(branza.toLowerCase())) {
    score += 5;
    reasonParts.push(`kategoria pasuje do branży "${branza}"`);
  }

  // cel keywords
  if (cel) {
    for (const w of cel.toLowerCase().split(/\s+/).filter((x) => x.length > 1)) {
      if (tagline.includes(w)) score += 2;
      if (desc.includes(w)) score += 1;
    }
  }

  // popularity bonus (log scale, max ~4 pts at 1000 runs)
  // only boost agents that already have keyword/branza relevance
  if (agent.runsCount > 0 && score > 0) {
    const pop = Math.min(4, Math.floor(Math.log10(agent.runsCount + 1) * 2));
    score += pop;
    if (agent.runsCount >= 100) reasonParts.push(`${agent.runsCount.toLocaleString("pl-PL")} uruchomień`);
  }

  // budget penalty
  if (budzet !== null) {
    const price = lowestPrice(agent);
    if (price > budzet * 1.2) {
      score -= 3;
    } else if (price <= budzet) {
      score += 2;
      if (agent.pricingType !== "FREE") reasonParts.push(`cena mieści się w budżecie ${budzet} zł`);
    }
  }

  // free bonus if query contains "darmow" or "bezpłatn"
  const queryHintFree = words.some((w) => w.startsWith("darmow") || w.startsWith("bezpłatn"));
  if (queryHintFree && agent.pricingType === "FREE") {
    score += 4;
    reasonParts.push("darmowy dostęp");
  }

  // deduplicate match tags
  const uniqueTags = [...new Set(matchTags)].slice(0, 5);

  return { ...agent, score, matchTags: uniqueTags, reasonParts };
}

// --- heading ---

function buildHeading(branza: string, budzet: number | null, query: string): string {
  if (branza && budzet !== null) return `Najlepszy agent ${branza} w budżecie do ${budzet} zł`;
  if (branza) return `Najlepszy agent dla branży ${branza}`;
  if (budzet !== null) return `Najlepszy agent w budżecie do ${budzet} zł`;
  if (query) {
    const short = query.length > 40 ? query.slice(0, 40) + "…" : query;
    return `Najlepsze dopasowanie dla: "${short}"`;
  }
  return "Najlepsze dopasowanie";
}

// --- reason sentence ---

function buildReason(agent: ScoredAgent, words: string[], branza: string): string {
  const parts: string[] = [];

  if (agent.matchTags.length > 0) {
    parts.push(`Słowa kluczowe pasują do nazwy lub opisu agenta`);
  }
  if (branza && agent.category.toLowerCase().includes(branza.toLowerCase())) {
    parts.push(`specjalizuje się w branży ${branza}`);
  }
  if (agent.pricingType === "FREE") {
    parts.push("dostępny bezpłatnie");
  }
  if (agent.runsCount >= 50) {
    parts.push(`sprawdzony przez ${agent.runsCount.toLocaleString("pl-PL")} użytkowników`);
  }
  if (agent.reasonParts.length > 0) {
    for (const r of agent.reasonParts) {
      if (!parts.includes(r)) parts.push(r);
    }
  }

  if (parts.length === 0) return `Pasuje do kategorii ${agent.category}.`;
  return parts.join(" · ") + ".";
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
  const budzet = sp.budzet ? Number(sp.budzet) : null;
  const budzet2 = budzet !== null && !isNaN(budzet) ? budzet : null;

  if (!query && !branza && !cel) redirect("/agents");

  // role-aware CTA
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? null;

  const allAgents = await prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, slug: true, name: true, tagline: true, category: true,
      description: true, pricingType: true, pricingLabel: true,
      pricingAmountPln: true, pricingAmountPlnPerMonth: true, runsCount: true,
    },
  });

  const phrase = query.toLowerCase();
  const words = phrase.split(/\s+/).filter((w) => w.length > 1);

  const scored = allAgents
    .map((a) => scoreAgent(a, words, phrase, branza, cel, budzet2))
    .sort((a, b) => b.score !== a.score ? b.score - a.score : b.runsCount - a.runsCount);

  const hasMatches = scored.some((a) => a.score > 0);
  const results = hasMatches ? scored.filter((a) => a.score > 0) : [];
  const GOOD_MATCH_THRESHOLD = 4;
  const hasGoodMatch = results.length > 0 && results[0].score >= GOOD_MATCH_THRESHOLD;

  // badge indices
  const cheapestIdx = results.reduce(
    (best, a, i) => (lowestPrice(a) < lowestPrice(results[best]) ? i : best),
    0
  );
  const freeIdx = results.findIndex((a) => a.pricingType === "FREE");

  // comparison: show top 2–3 if scores are close (gap < 4)
  const showComparison =
    hasGoodMatch &&
    results.length >= 2 &&
    results[0].score - results[1].score < 4;
  const compareAgents = showComparison ? results.slice(0, Math.min(3, results.length)) : [];

  // prefill params for /dashboard/new
  const prefillParams = new URLSearchParams();
  if (query) prefillParams.set("prefill_desc", query);
  if (branza) prefillParams.set("prefill_branza", branza);
  if (cel) prefillParams.set("prefill_cel", cel);
  const newAgentHref = `/dashboard/new?${prefillParams.toString()}`;

  // similar agents by category (shown only when score === 0 for all)
  const noScoreAtAll = scored.every((a) => a.score === 0);
  const BRANZA_TO_CATEGORY: Record<string, string> = {
    hr: "HR", marketing: "Marketing", prawo: "Prawo", finanse: "Finanse",
    it: "IT", edukacja: "Edukacja", budownictwo: "Budownictwo",
    "e-commerce": "E-commerce", ecommerce: "E-commerce", zdrowie: "Zdrowie",
    biznes: "Biznes",
  };
  const similarCategory = branza ? (BRANZA_TO_CATEGORY[branza.toLowerCase()] ?? "") : "";
  const similarAgents = noScoreAtAll && similarCategory
    ? allAgents
        .filter((a) => a.category === similarCategory)
        .sort((a, b) => b.runsCount - a.runsCount)
        .slice(0, 4)
    : [];
  const categoryCount = similarCategory
    ? allAgents.filter((a) => a.category === similarCategory).length
    : 0;

  // contextual CTA label
  const ctaLabel = branza
    ? `Stwórz agenta dla branży ${branza} →`
    : budzet2 !== null && budzet2 === 0
    ? "Stwórz darmowego agenta →"
    : "Zaprojektuj nowego agenta →";

  // refinement suggestions (max 3)
  const refinements: { label: string; href: string }[] = [];
  if (budzet2 !== null) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (branza) p.set("branza", branza);
    if (cel) p.set("cel", cel);
    refinements.push({ label: "Usuń filtr budżetu", href: `/results?${p.toString()}` });
  }
  if (branza) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (cel) p.set("cel", cel);
    if (budzet2 !== null) p.set("budzet", String(budzet2));
    refinements.push({ label: `Szukaj bez filtru branży "${branza}"`, href: `/results?${p.toString()}` });
  }
  if (query && !words.some((w) => w.startsWith("darmow"))) {
    const p = new URLSearchParams();
    p.set("q", `${query} darmowy`);
    if (branza) p.set("branza", branza);
    if (cel) p.set("cel", cel);
    refinements.push({ label: "Szukaj tylko darmowych agentów", href: `/results?${p.toString()}` });
  }

  const best = results[0];
  const sectionHeading = buildHeading(branza, budzet2, query);
  const budzetStr = sp.budzet ?? "";

  // role-aware design CTA
  const isCreator = role === "CREATOR" || role === "ADMIN";
  const isUser = role === "USER";
  const becomeCreatorHref = `/become-creator?redirect=${encodeURIComponent(newAgentHref)}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(becomeCreatorHref)}`;
  const designCtaLabel = isCreator
    ? "Zaprojektuj nowego agenta →"
    : isUser
    ? "Zostań twórcą i stwórz agenta →"
    : "Zaloguj się i stwórz agenta →";
  const designCtaHref = isCreator ? newAgentHref : isUser ? becomeCreatorHref : loginHref;

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
          {budzetStr && <input type="hidden" name="budzet" value={budzetStr} />}
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
          {budzet2 !== null && <> · budżet: <span className="font-medium text-slate-700">do {budzet2} zł</span></>}
        </p>
      </form>

      {/* Section 1: best match */}
      {hasGoodMatch && best && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">
            {sectionHeading}
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

                  {/* match tags */}
                  {best.matchTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {best.matchTags.map((tag) => (
                        <span key={tag}
                          className="inline-flex rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* reason */}
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-600">Dlaczego rekomendujemy: </span>
                    {buildReason(best, words, branza)}
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

      {/* Section 2: comparison table (top 2–3, only when scores are close) */}
      {showComparison && compareAgents.length >= 2 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Porównanie najlepszych dopasowań
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Agent</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Kategoria</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Cena</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Uruchomień</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Dopasowanie</th>
                </tr>
              </thead>
              <tbody>
                {compareAgents.map((agent, i) => {
                  const maxScore = compareAgents[0].score;
                  const pct = maxScore > 0 ? Math.round((agent.score / maxScore) * 100) : 0;
                  return (
                    <tr key={agent.id} className={`border-b border-slate-50 last:border-0 ${i === 0 ? "bg-indigo-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/agents/${agent.slug}`}
                          className="font-semibold text-slate-900 hover:text-indigo-700 transition-colors">
                          {agent.name}
                        </Link>
                        {i === 0 && (
                          <span className="ml-2 inline-flex rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            #1
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {CATEGORY_ICONS[agent.category] ?? "🤖"} {agent.category}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${agent.pricingType === "FREE" ? "text-emerald-600" : "text-slate-700"}`}>
                        {priceLabel(agent)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        ⚡ {agent.runsCount.toLocaleString("pl-PL")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${i === 0 ? "bg-indigo-500" : "bg-slate-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 3: ranked list (others) */}
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
              if (i === freeIdx && freeIdx !== 0) badges.push({ label: "Darmowy", color: "bg-amber-500 text-white" });
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

                        {/* match tags for secondary results */}
                        {agent.matchTags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {agent.matchTags.map((tag) => (
                              <span key={tag}
                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

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

      {/* Section 4: fallback */}
      {!hasGoodMatch && (
        <section className="mb-8 space-y-4">
          {/* Main fallback card */}
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-3xl">
                🔍
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-slate-800">
                  Nie znaleziono idealnego agenta
                </h3>
                {/* counter */}
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {categoryCount > 0
                    ? `Na platformie mamy ${categoryCount} agent${categoryCount === 1 ? "a" : "ów"} w kategorii ${similarCategory} — żaden nie pasuje dokładnie do Twojego opisu.`
                    : query
                    ? `Żaden z dostępnych agentów nie pasuje dokładnie do zapytania "${query}".`
                    : "Żaden agent nie pasuje do podanych kryteriów."}
                  {" "}Możesz zaprojektować własnego.
                </p>

                {/* refinement suggestions */}
                {refinements.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400 self-center">Spróbuj:</span>
                    {refinements.map((r) => (
                      <Link key={r.href} href={r.href}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                        {r.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar agents by category */}
          {similarAgents.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                Agenci podobni tematycznie · {similarCategory}
              </h2>
              <div className="space-y-2">
                {similarAgents.map((agent) => (
                  <div key={agent.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-base">
                        {CATEGORY_ICONS[agent.category] ?? "🤖"}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/agents/${agent.slug}`}
                          className="font-semibold text-slate-900 hover:text-indigo-700 transition-colors text-sm">
                          {agent.name}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1">{agent.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold ${agent.pricingType === "FREE" ? "text-emerald-600" : "text-slate-600"}`}>
                        {priceLabel(agent)}
                      </span>
                      <Link href={`/agents/${agent.slug}/run`}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors">
                        Uruchom →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini prefill form → /dashboard/new (CREATOR) or role-aware CTA */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
            <p className="mb-4 text-sm font-bold text-indigo-800">
              {isCreator
                ? `${ctaLabel.replace(" →", "")} — uzupełnij pola i przejdź do projektowania`
                : isUser
                ? "Zostań twórcą — jeden krok i możesz opublikować własnego agenta na giełdzie"
                : "Zaloguj się lub zarejestruj — opublikuj własnego agenta na giełdzie"}
            </p>
            {!isCreator ? (
              <div className="flex flex-wrap gap-3">
                <Link href={designCtaHref}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
                  {designCtaLabel}
                </Link>
                <Link href="/agents"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors self-center">
                  Przeglądaj katalog
                </Link>
              </div>
            ) : (
            <form action="/dashboard/new" method="GET" className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Opis agenta</label>
                <textarea
                  name="prefill_desc"
                  rows={2}
                  defaultValue={query}
                  placeholder="Co ma robić Twój agent?"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Branża</label>
                  <input
                    type="text"
                    name="prefill_branza"
                    defaultValue={branza}
                    placeholder="np. HR, Marketing"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Cel</label>
                  <input
                    type="text"
                    name="prefill_cel"
                    defaultValue={cel}
                    placeholder="np. automatyzacja, analiza"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
                  Kontynuuj projektowanie →
                </button>
                <Link href="/agents"
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  Przeglądaj katalog
                </Link>
              </div>
            </form>
            )}
          </div>
        </section>
      )}

      {/* Always show design CTA if there are results */}
      {hasGoodMatch && results.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Nie widzisz agenta spełniającego Twoje potrzeby?
          </p>
          <Link href={designCtaHref}
            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shrink-0">
            {designCtaLabel}
          </Link>
        </div>
      )}

      <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-between">
        <Link href="/agents" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          ← Cały katalog
        </Link>
        <p className="text-xs text-slate-400">Ranking wg trafności · popularności · budżetu</p>
      </div>
    </main>
  );
}
