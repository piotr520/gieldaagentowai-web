import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PricingBadge } from "@/components/ui/Badge";

const CATEGORY_ICONS: Record<string, string> = {
  Biznes: "💼", Marketing: "📢", HR: "👥", "E-commerce": "🛒",
  Prawo: "⚖️", IT: "💻", Edukacja: "📚", Budownictwo: "🏗️",
  Finanse: "💰", Zdrowie: "🏥",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await prisma.agent.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, tagline: true, category: true },
  });
  if (!agent) return { title: "Agent nie znaleziony" };

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://gieldaagentowai.pl";
  const description = agent.tagline ?? `Agent AI w kategorii ${agent.category}`;

  return {
    title: `${agent.name} — Giełda Agentów AI`,
    description,
    openGraph: {
      title: agent.name,
      description,
      url: `${baseUrl}/agents/${slug}`,
      siteName: "Giełda Agentów AI",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: agent.name,
      description,
    },
  };
}

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
  const icon = CATEGORY_ICONS[agent.category] ?? "🤖";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Katalog agentów
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Left: main content ────────────────────────────────── */}
        <div className="min-w-0">
          {/* Agent hero */}
          <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-3xl shadow-sm">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{agent.category}</div>
                <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">{agent.name}</h1>
                {agent.tagline && (
                  <p className="mt-1.5 text-base text-slate-600 leading-snug">{agent.tagline}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <PricingBadge type={agent.pricingType} label={agent.pricingLabel ?? "Darmowy"} />
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="text-indigo-400">⚡</span>
                    {agent.runsCount.toLocaleString("pl-PL")} uruchomień
                  </span>
                  {agent.pricingType !== "FREE" && (
                    <span className="text-xs text-slate-400">· 3 darmowe uruchomienia gratis</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Co robi ten agent</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {agent.description}
              </p>
            </div>
          </section>

          {/* Limitations */}
          {limitations.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Ograniczenia</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ul className="space-y-2.5">
                  {limitations.map((l, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-500 text-[10px]">!</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Przykłady użycia</h2>
              <div className="space-y-4">
                {examples.map((ex, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Przykład {i + 1}</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Zapytanie</p>
                        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-slate-700">
                          {ex.input}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Wynik</p>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-700 whitespace-pre-line">
                          {ex.output}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Creator info */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</span>
            Twórca: {agent.creator.email}
          </div>
        </div>

        {/* ── Right: sticky sidebar ─────────────────────────────── */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            {/* Price */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Model cenowy</p>
              <div className="flex items-baseline gap-1.5">
                {agent.pricingAmountPln ? (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{agent.pricingAmountPln} zł</span>
                    <span className="text-sm text-slate-500">jednorazowo</span>
                  </>
                ) : agent.pricingAmountPlnPerMonth ? (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{agent.pricingAmountPlnPerMonth} zł</span>
                    <span className="text-sm text-slate-500">/miesiąc</span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-emerald-600">Darmowy</span>
                )}
              </div>
              {agent.pricingType !== "FREE" && (
                <p className="mt-1.5 text-xs text-indigo-600 font-medium">✦ Pierwsze 3 uruchomienia gratis</p>
              )}
            </div>

            <Link
              href={`/agents/${agent.slug}/run`}
              className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Uruchom agenta →
            </Link>

            {/* Trust indicators */}
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              {[
                { icon: "✅", text: "Gotowy do użycia — bez konfiguracji" },
                { icon: "⚡", text: `${agent.runsCount.toLocaleString("pl-PL")} uruchomień` },
                { icon: "🔒", text: "Bezpieczne i szyfrowane połączenie" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 text-xs text-slate-500">
                  <span className="text-sm">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
