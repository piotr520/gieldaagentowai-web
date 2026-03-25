import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const agent = await prisma.agent.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      name: true,
      tagline: true,
      description: true,
      category: true,
      pricingType: true,
      pricingLabel: true,
      pricingAmountPln: true,
      pricingAmountPlnPerMonth: true,
      limitationsJson: true,
      examplesJson: true,
      runsCount: true,
      creator: { select: { email: true } },
    },
  });

  if (!agent) notFound();

  const limitations: string[] = JSON.parse(agent.limitationsJson || "[]");
  const examples: { input: string; output: string }[] = JSON.parse(agent.examplesJson || "[]");

  const isFree = agent.pricingType === "FREE";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4">
        <Link href="/agents" className="text-sm text-neutral-500 hover:underline">
          ← Katalog agentów
        </Link>
      </div>

      {/* Nagłówek */}
      <div className="mb-6 rounded-xl border border-neutral-200 p-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
          {agent.category}
        </div>
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <p className="mt-2 text-neutral-600">{agent.tagline}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="rounded border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-medium">
            {isFree ? "Darmowy" : agent.pricingLabel}
            {agent.pricingAmountPln ? ` – ${agent.pricingAmountPln} zł` : ""}
            {agent.pricingAmountPlnPerMonth ? ` – ${agent.pricingAmountPlnPerMonth} zł/mies.` : ""}
          </span>
          <span className="text-xs text-neutral-400">
            {agent.runsCount} uruchomień
          </span>
          {!isFree && (
            <span className="text-xs text-neutral-500">
              3 darmowe uruchomienia dla nowych użytkowników
            </span>
          )}
        </div>

        <div className="mt-5">
          <Link
            href={`/agents/${agent.slug}/run`}
            className="inline-block rounded bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Uruchom agenta →
          </Link>
        </div>
      </div>

      {/* Opis */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Opis</h2>
        <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
          {agent.description}
        </p>
      </section>

      {/* Ograniczenia */}
      {limitations.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Ograniczenia</h2>
          <ul className="space-y-1">
            {limitations.map((l, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="text-neutral-400">–</span> {l}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Przykłady */}
      {examples.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Przykłady użycia</h2>
          <div className="space-y-4">
            {examples.map((ex, i) => (
              <div key={i} className="rounded border border-neutral-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Wejście
                </p>
                <p className="mb-3 text-sm text-neutral-700">{ex.input}</p>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Wyjście
                </p>
                <p className="text-sm text-neutral-700">{ex.output}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Twórca */}
      <p className="text-xs text-neutral-400">
        Twórca: {agent.creator.email}
      </p>
    </main>
  );
}
