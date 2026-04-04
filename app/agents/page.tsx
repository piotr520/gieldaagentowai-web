import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Biznes", "Marketing", "HR", "E-commerce", "IT", "Prawo", "Finanse", "Edukacja", "Budownictwo", "Zdrowie"];

type AgentListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  pricingType: string;
  pricingLabel: string | null;
  updatedAt: Date;
  runsCount: number;
};

async function getPublishedAgents(category?: string, q?: string): Promise<AgentListItem[]> {
  const search = q?.trim();
  return prisma.agent.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { tagline: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      tagline: true,
      pricingType: true,
      pricingLabel: true,
      updatedAt: true,
      runsCount: true,
    },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
  });
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category;
  const query = params.q?.trim() ?? "";
  const agents = await getPublishedAgents(activeCategory, query);

  function categoryHref(cat: string | undefined) {
    const p = new URLSearchParams();
    if (cat) p.set("category", cat);
    if (query) p.set("q", query);
    return `/agents${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900">Katalog agentów AI</h1>
        <p className="mt-2 text-base text-slate-500">
          {query
            ? `${agents.length} wynik${agents.length === 1 ? "" : "ów"} dla „${query}"`
            : agents.length > 0
            ? `${agents.length} agentów gotowych do użycia`
            : "Przeglądaj agentów i wybierz odpowiedniego dla siebie"}
        </p>
      </div>

      {/* Sticky search bar */}
      <div className="sticky top-16 z-10 mb-6 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <form action="/agents" method="GET" className="flex items-center gap-3 max-w-xl">
          {activeCategory && (
            <input type="hidden" name="category" value={activeCategory} />
          )}
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.197 15.803a7.5 7.5 0 0 0 10.606 0z" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Szukaj agentów po nazwie lub opisie..."
              defaultValue={query}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
          >
            Szukaj
          </button>
          {query && (
            <Link
              href={activeCategory ? `/agents?category=${encodeURIComponent(activeCategory)}` : "/agents"}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            >
              ✕
            </Link>
          )}
        </form>
      </div>

      {/* Category filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={categoryHref(undefined)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            !activeCategory
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
              : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
          }`}
        >
          Wszystkie
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={categoryHref(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {agents.length === 0 ? (
        <EmptyState
          icon="🤖"
          title={query ? `Brak wyników dla „${query}"` : "Brak agentów w tej kategorii"}
          description={
            query
              ? "Spróbuj innej frazy lub wyczyść filtr wyszukiwania."
              : "Sprawdź inne kategorie lub wróć wkrótce — twórcy właśnie dodają nowe agenty."
          }
          action={
            <Link
              href="/agents"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Zobacz wszystkich agentów
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent, i) => (
            <AgentCard
              key={agent.id}
              slug={agent.slug}
              name={agent.name}
              tagline={agent.tagline}
              category={agent.category}
              pricingType={agent.pricingType}
              pricingLabel={agent.pricingLabel}
              runsCount={agent.runsCount}
              featured={i === 0 && !activeCategory && !query}
            />
          ))}
        </div>
      )}
    </main>
  );
}
