import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getFeaturedAgents() {
  return prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      category: true,
      pricingLabel: true,
      pricingType: true,
      runsCount: true,
    },
  });
}

export default async function HomePage() {
  const featured = await getFeaturedAgents();

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            Marketplace agentów AI
          </span>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-slate-900">
            Agenci AI gotowi
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              do pracy od zaraz
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
            Przeglądaj, uruchamiaj i kupuj agentów AI stworzonych przez ekspertów.
            Każdy agent gotowy do użycia — bez konfiguracji.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/agents"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Przeglądaj agentów →
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              Zarejestruj się za darmo
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 flex flex-wrap justify-center gap-10 text-center">
            {[
              { value: "50+", label: "Agentów AI" },
              { value: "2400+", label: "Uruchomień" },
              { value: "100%", label: "Gotowych do użycia" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured agents */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Najpopularniejsze agenty</h2>
            <p className="mt-1 text-sm text-slate-500">Sprawdzone przez setki użytkowników</p>
          </div>
          <Link href="/agents" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Zobacz wszystkich →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-500">Brak opublikowanych agentów. Sprawdź wkrótce.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((agent) => (
              <article
                key={agent.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {agent.category}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      agent.pricingType === "FREE"
                        ? "bg-green-50 text-green-700"
                        : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {agent.pricingLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{agent.name}</h3>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{agent.tagline}</p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">⚡ {agent.runsCount} uruchomień</span>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-indigo-600"
                  >
                    Uruchom →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Jak to działa?</h2>
            <p className="mt-2 text-sm text-slate-500">Trzy kroki do pierwszego wyniku</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                num: "01",
                icon: "🔍",
                title: "Wybierz agenta",
                desc: "Przejrzyj katalog agentów AI. Każdy agent jest opisany, przetestowany i gotowy do użycia.",
              },
              {
                num: "02",
                icon: "✍️",
                title: "Wpisz zapytanie",
                desc: "Opisz zadanie w języku naturalnym. 3 pierwsze uruchomienia są zawsze darmowe.",
              },
              {
                num: "03",
                icon: "⚡",
                title: "Odbierz wynik",
                desc: "Agent generuje odpowiedź w kilka sekund. Historia uruchomień zawsze dostępna na koncie.",
              },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold text-slate-300">{step.num}</span>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-slate-900 p-12 text-center">
          <h2 className="text-2xl font-bold text-white">Jesteś twórcą AI?</h2>
          <p className="mt-3 text-slate-400">
            Dodaj swojego agenta na giełdę i zarabiaj. Twoi agenci trafią
            do tysięcy użytkowników po akceptacji administratora.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Zacznij sprzedawać →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-xs text-slate-400">
        © 2026 Giełda Agentów AI — Marketplace agentów AI dla profesjonalistów
      </footer>
    </main>
  );
}
