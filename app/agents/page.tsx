import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AgentListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  pricingLabel: string | null;
  pricingType: string;
  updatedAt: Date;
  runsCount: number;
};

async function getPublishedAgents(): Promise<AgentListItem[]> {
  return prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      tagline: true,
      pricingLabel: true,
      pricingType: true,
      updatedAt: true,
      runsCount: true,
    },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
  });
}

export default async function AgentsPage() {
  const agents = await getPublishedAgents();

  const categories = Array.from(new Set(agents.map((a) => a.category))).sort();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Marketplace agentów</h1>
        <p className="mt-2 text-slate-500">
          {agents.length} {agents.length === 1 ? "agent" : "agentów"} gotowych do użycia
        </p>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🤖
          </div>
          <p className="font-medium text-slate-700">Brak opublikowanych agentów</p>
          <p className="mt-1 text-sm text-slate-500">
            Gdy agent otrzyma status PUBLISHED, pojawi się tutaj.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, index) => (
            <article
              key={agent.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
            >
              {index === 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  🔥 Popularny
                </span>
              )}

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {agent.category}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900">{agent.name}</h2>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                  {agent.tagline ?? "Brak opisu."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className={`text-xs font-semibold ${
                    agent.pricingType === "FREE" ? "text-green-700" : "text-indigo-700"
                  }`}>
                    {agent.pricingLabel ?? "—"}
                  </span>
                  <span className="text-xs text-slate-400">⚡ {agent.runsCount} uruchomień</span>
                </div>
                <Link
                  href={`/agents/${agent.slug}`}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-indigo-600"
                >
                  Zobacz →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
