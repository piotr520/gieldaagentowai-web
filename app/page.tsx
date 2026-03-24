import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getTopAgents() {
  return prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: {
      id: true,
      slug: true,
      name: true,
      runsCount: true,
    },
  });
}

export default async function HomePage() {
  const topAgents = await getTopAgents();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">Giełda Agentów AI</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">
          🔥 Najpopularniejsze agenty
        </h2>

        {topAgents.length === 0 ? (
          <p className="text-sm text-neutral-600">Brak danych.</p>
        ) : (
          <div className="grid gap-3">
            {topAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded border border-neutral-300 p-4"
              >
                <div>
                  <div className="text-sm text-neutral-500">#{index + 1}</div>
                  <div className="font-medium">{agent.name}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-neutral-500">
                    Użycia: {agent.runsCount}
                  </div>

                  <Link
                    href={`/agents/${agent.slug}`}
                    className="text-sm underline"
                  >
                    Otwórz →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/agents" className="underline">
        Zobacz wszystkie agenty →
      </Link>
    </main>
  );
}