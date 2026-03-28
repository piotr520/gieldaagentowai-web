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
      runsCount: true,
    },
  });
}

export default async function HomePage() {
  const featured = await getFeaturedAgents();

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-neutral-200 bg-neutral-50 px-6 py-20 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight">
          Marketplace agentów AI
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          Przeglądaj, uruchamiaj i kupuj agentów AI stworzonych przez ekspertów.
          Każdy agent gotowy do użycia — bez konfiguracji.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/agents"
            className="rounded bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Przeglądaj agentów
          </Link>
          <Link
            href="/register"
            className="rounded border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Zarejestruj się za darmo
          </Link>
        </div>
      </section>

      {/* Wyróżnieni agenci */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="mb-6 text-2xl font-bold">Najpopularniejsze agenty</h2>

        {featured.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Brak opublikowanych agentów. Sprawdź wkrótce.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((agent) => (
              <article
                key={agent.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-200 p-5 hover:border-neutral-400"
              >
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    {agent.category}
                  </div>
                  <h3 className="text-base font-semibold">{agent.name}</h3>
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                    {agent.tagline}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {agent.runsCount} użyć
                  </span>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="text-sm font-medium underline"
                  >
                    Zobacz →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/agents" className="text-sm font-medium underline">
            Zobacz wszystkich agentów →
          </Link>
        </div>
      </section>

      {/* Jak to działa */}
      <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-center">Jak to działa?</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 text-2xl font-bold text-neutral-300">01</div>
              <h3 className="mb-2 font-semibold">Wybierz agenta</h3>
              <p className="text-sm text-neutral-600">
                Przejrzyj katalog agentów AI. Filtruj po kategorii, cenie lub popularności.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 text-2xl font-bold text-neutral-300">02</div>
              <h3 className="mb-2 font-semibold">Wpisz zapytanie</h3>
              <p className="text-sm text-neutral-600">
                Opisz zadanie dla agenta. Każdy agent ma 3 darmowe uruchomienia.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 text-2xl font-bold text-neutral-300">03</div>
              <h3 className="mb-2 font-semibold">Dostaj wyniki</h3>
              <p className="text-sm text-neutral-600">
                Agent AI generuje wynik w kilka sekund. Historia uruchomień zawsze dostępna.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sekcja dla twórców */}
      <section className="border-t border-neutral-200 px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold">Jesteś twórcą AI?</h2>
          <p className="mb-6 text-neutral-600">
            Dodaj swojego agenta na giełdę i zarabiaj. Twoi agenci trafią do tysięcy
            użytkowników po akceptacji administratora.
          </p>
          <Link
            href="/register"
            className="inline-block rounded bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Zacznij sprzedawać →
          </Link>
        </div>
      </section>
    </main>
  );
}
