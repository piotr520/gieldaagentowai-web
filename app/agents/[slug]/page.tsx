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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link href="/agents" className="text-sm text-slate-500 hover:text-slate-700">
          ← Marketplace
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {agent.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{agent.name}</h1>
            <p className="mt-2 text-lg text-slate-500">{agent.tagline}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
              <span>⚡ {agent.runsCount} uruchomień</span>
              {!isFree && <span className="text-green-600">✓ 3 darmowe uruchomienia</span>}
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-900">Opis</h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {agent.description}
              </p>
            </div>
          </section>

          {limitations.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Ograniczenia</h2>
              <ul className="space-y-2">
                {limitations.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"></span>
                    {l}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {examples.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-slate-900">Przykłady użycia</h2>
              <div className="space-y-4">
                {examples.map((ex, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wejście</span>
                      <p className="mt-1 text-sm text-slate-700">{ex.input}</p>
                    </div>
                    <div className="bg-white px-5 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wyjście</span>
                      <p className="mt-1 text-sm text-slate-700">{ex.output}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {isFree ? "Darmowy" : agent.pricingLabel}
              </p>
              {agent.pricingAmountPln && (
                <p className="text-sm text-slate-500">{agent.pricingAmountPln} zł jednorazowo</p>
              )}
              {agent.pricingAmountPlnPerMonth && (
                <p className="text-sm text-slate-500">{agent.pricingAmountPlnPerMonth} zł / miesiąc</p>
              )}
              {!isFree && (
                <p className="mt-2 text-xs font-medium text-green-600">
                  ✓ 3 darmowe uruchomienia dla nowych użytkowników
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <Link
                href={`/agents/${agent.slug}/run`}
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Uruchom agenta →
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Twórca</span>
                <span className="font-medium text-slate-700">{agent.creator.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Uruchomienia</span>
                <span className="font-medium text-slate-700">{agent.runsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-medium text-green-600">Aktywny</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
