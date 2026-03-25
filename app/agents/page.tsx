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
  updatedAt: Date;
  runsCount: number;
};

async function getPublishedAgents(): Promise<AgentListItem[]> {
  const rows = await prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      tagline: true,
      pricingLabel: true,
      updatedAt: true,
      runsCount: true,
    },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
  });

  return rows;
}

export default async function AgentsPage() {
  const agents = await getPublishedAgents();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Katalog agentów AI</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Przeglądaj opublikowanych agentów i przechodź do ich kart.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-xl border border-neutral-300 p-6">
          <p className="text-base font-medium">Brak opublikowanych agentów.</p>
          <p className="mt-2 text-sm text-neutral-600">
            Gdy agent otrzyma status PUBLISHED, pojawi się tutaj w katalogu.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent, index) => (
            <article
              key={agent.id}
              className="rounded-xl border border-neutral-300 p-5"
            >
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
                    {agent.category}
                  </div>

                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    {agent.name}
                    {index === 0 ? (
                      <span className="rounded bg-black px-2 py-1 text-xs text-white">
                        🔥 Najpopularniejszy
                      </span>
                    ) : null}
                  </h2>
                </div>

                <div className="shrink-0 text-sm font-medium">
                  {agent.pricingLabel ?? "Cena do ustalenia"}
                </div>
              </div>

              <p className="mb-2 text-sm text-neutral-700">
                {agent.tagline ?? "Brak krótkiego opisu."}
              </p>

              <div className="mb-3 text-xs text-neutral-500">
                Użycia: {agent.runsCount}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-neutral-500">
                  Aktualizacja:{" "}
                  {new Date(agent.updatedAt).toLocaleDateString("pl-PL")}
                </div>

                <Link
                  href={`/agents/${agent.slug}`}
                  className="text-sm font-medium underline"
                >
                  Zobacz agenta
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}