import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agents/AgentCard";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "Biznes", icon: "💼", desc: "Automatyzacja procesów biznesowych" },
  { name: "Marketing", icon: "📢", desc: "Kampanie, treści, analityka" },
  { name: "HR", icon: "👥", desc: "Rekrutacja i zarządzanie ludźmi" },
  { name: "E-commerce", icon: "🛒", desc: "Sklepy i sprzedaż online" },
  { name: "IT", icon: "💻", desc: "DevOps, kod, dokumentacja" },
  { name: "Prawo", icon: "⚖️", desc: "Umowy, analizy prawne" },
  { name: "Finanse", icon: "💰", desc: "Analizy finansowe i budżety" },
  { name: "Edukacja", icon: "📚", desc: "Materiały i plany nauki" },
];

async function getFeaturedAgents() {
  return prisma.agent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ runsCount: "desc" }, { updatedAt: "desc" }],
    take: 6,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      category: true,
      pricingType: true,
      pricingLabel: true,
      runsCount: true,
    },
  });
}

export default async function HomePage() {
  const featured = await getFeaturedAgents();

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 pb-24 pt-20 text-white">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <div>
              {/* ── Primary search ─────────────────────────────────── */}
              <form action="/results" method="GET" className="mb-8">
                <div className="relative">
                  <textarea
                    name="q"
                    rows={3}
                    placeholder="Opisz czego potrzebujesz (np. agent do ofert B2B, obsługi klienta, analizy danych...)"
                    className="w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-400/30 transition-all backdrop-blur"
                  />
                </div>
                {/* Optional fields */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    name="budzet"
                    placeholder="Budżet (opcjonalnie)"
                    className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur"
                  />
                  <input
                    type="text"
                    name="branza"
                    placeholder="Branża (opcjonalnie)"
                    className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur"
                  />
                  <input
                    type="text"
                    name="cel"
                    placeholder="Cel (opcjonalnie)"
                    className="col-span-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur sm:col-span-1"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-500 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-400 hover:-translate-y-0.5"
                  >
                    Znajdź lub stwórz agenta →
                  </button>
                  <Link
                    href="/agents"
                    className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    lub przeglądaj katalog →
                  </Link>
                </div>
              </form>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI Marketplace
              </div>
              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
                Odkryj agentów AI<br />
                <span className="gradient-text">nowej generacji</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
                Przeglądaj, uruchamiaj i kupuj agentów AI stworzonych przez ekspertów.
                Każdy agent gotowy do użycia — bez konfiguracji, bez kodu.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/agents"
                  className="rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-indigo-900/70"
                >
                  Przeglądaj agentów →
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/20 hover:-translate-y-0.5"
                >
                  Zarejestruj się za darmo
                </Link>
              </div>
              <p className="mt-5 text-xs text-slate-500">
                Już ponad 200 agentów · 3 darmowe uruchomienia dla każdego
              </p>
            </div>

            {/* Right: floating card mockup */}
            <div className="hidden lg:block">
              <div className="relative ml-auto max-w-sm">
                {/* Background card */}
                <div className="absolute -bottom-4 -right-4 w-full rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 text-xl border border-violet-500/20">💰</div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Finanse</p>
                      <p className="text-sm font-bold text-white">Analizator budżetu</p>
                    </div>
                    <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-300">Sub</span>
                  </div>
                </div>
                {/* Middle card */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-64 rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 text-xl border border-emerald-500/20">📢</div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Marketing</p>
                      <p className="text-sm font-bold text-white">Copywriter AI</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">Free</span>
                  </div>
                </div>
                {/* Front card */}
                <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-800/90 p-5 shadow-2xl backdrop-blur ring-1 ring-indigo-500/20">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 text-xl border border-indigo-500/20">💼</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Biznes</p>
                        <p className="text-sm font-bold text-white">Asystent biznesowy</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">🔥 Top</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">Automatyzacja procesów, analizy rynku i raporty dla firm każdej wielkości.</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-3">
                    <span className="text-xs font-semibold text-emerald-400">Darmowy</span>
                    <span className="text-xs text-slate-500">⚡ 1 247 uruchomień</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {[
              { value: "200+", label: "agentów AI" },
              { value: "8", label: "kategorii" },
              { value: "3", label: "darmowe uruchomienia" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-slate-900">{stat.value}</span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured agents ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Najpopularniejsze agenty</h2>
            <p className="mt-1.5 text-sm text-slate-500">Najchętniej uruchamiane przez użytkowników</p>
          </div>
          <Link
            href="/agents"
            className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors sm:flex items-center gap-1"
          >
            Zobacz wszystkich →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="mb-4 text-4xl">🤖</div>
            <p className="font-bold text-slate-800">Brak opublikowanych agentów</p>
            <p className="mt-1.5 text-sm text-slate-500">Sprawdź wkrótce — twórcy właśnie dodają swoje agenty.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((agent, i) => (
              <AgentCard
                key={agent.id}
                slug={agent.slug}
                name={agent.name}
                tagline={agent.tagline}
                category={agent.category}
                pricingType={agent.pricingType}
                pricingLabel={agent.pricingLabel}
                runsCount={agent.runsCount}
                featured={i === 0}
                isNew={i >= 4}
              />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link href="/agents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Zobacz wszystkich agentów →
          </Link>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Kategorie agentów</h2>
            <p className="mt-1.5 text-sm text-slate-500">Znajdź agenta idealnego dla swojej branży</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/agents?category=${encodeURIComponent(cat.name)}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-xl border border-indigo-100">
                  {cat.icon}
                </span>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">{cat.name}</p>
                  <p className="text-xs text-slate-500 leading-snug">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Jak to działa?</h2>
            <p className="mt-1.5 text-sm text-slate-500">Trzy proste kroki do gotowego wyniku</p>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent sm:block" />
            {[
              {
                step: "01",
                title: "Wybierz agenta",
                desc: "Przejrzyj katalog agentów AI. Filtruj po kategorii, cenie lub popularności.",
                icon: "🔍",
              },
              {
                step: "02",
                title: "Wpisz zapytanie",
                desc: "Opisz zadanie dla agenta. Każdy agent ma 3 darmowe uruchomienia dla nowych użytkowników.",
                icon: "✍️",
              },
              {
                step: "03",
                title: "Dostaj wyniki",
                desc: "Agent AI generuje wynik w kilka sekund. Pełna historia uruchomień zawsze dostępna.",
                icon: "⚡",
              },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 text-3xl shadow-sm">
                  {item.icon}
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creator CTA ──────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                Dla twórców AI
              </div>
              <h2 className="text-4xl font-extrabold leading-tight text-white">
                Zarabiaj na swojej<br />
                <span className="gradient-text">ekspertyzie AI</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Opublikuj swojego agenta na Giełdzie i dotrzyj do tysięcy użytkowników.
                Każde uruchomienie to przychód — bez obsługi płatności, bez infrastruktury.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Prosty formularz tworzenia agenta",
                  "Akceptacja w ciągu 24h",
                  "Automatyczne płatności",
                  "Pełna statystyka użycia",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
              >
                Zacznij sprzedawać →
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl">
                {/* Window chrome */}
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-slate-500 font-mono">dashboard.tsx</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Przychód (ten miesiąc)", value: "2 340 zł", accent: true },
                    { label: "Uruchomienia", value: "1 247", accent: false },
                    { label: "Aktywni użytkownicy", value: "83", accent: false },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-xl p-4 ${stat.accent ? "bg-indigo-600/20 border border-indigo-500/30" : "bg-slate-700/50 border border-slate-600/30"}`}
                    >
                      <p className="text-xs text-slate-400 mb-0.5">{stat.label}</p>
                      <p className={`text-xl font-extrabold ${stat.accent ? "text-indigo-300" : "text-white"}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing models ───────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Modele cenowe agentów</h2>
            <p className="mt-1.5 text-sm text-slate-500">Elastyczne opcje dla każdego przypadku użycia</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "🆓",
                title: "Darmowy",
                desc: "Nieograniczony dostęp. Idealny dla narzędzi edukacyjnych i próbek.",
                badge: "FREE",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                icon: "💳",
                title: "Jednorazowy",
                desc: "Płać raz, używaj zawsze. Dla specjalistycznych narzędzi premium.",
                badge: "ONE-TIME",
                badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                icon: "🔄",
                title: "Subskrypcja",
                desc: "Miesięczna opłata za nieograniczony dostęp i aktualizacje agenta.",
                badge: "SUB",
                badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
              },
            ].map((m) => (
              <div key={m.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{m.icon}</span>
                  <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${m.badgeColor}`}>{m.badge}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{m.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Każdy agent — niezależnie od modelu — oferuje 3 darmowe uruchomienia dla nowych użytkowników
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Gotowy do działania?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-indigo-100 leading-relaxed">
            Dołącz do społeczności użytkowników i twórców agentów AI.
            Pierwsze uruchomienia zawsze darmowe.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/agents"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-xl transition-all hover:bg-indigo-50 hover:-translate-y-0.5"
            >
              Przeglądaj agentów
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/30 bg-white/15 px-8 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/25 hover:-translate-y-0.5"
            >
              Zarejestruj się
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-900">Giełda Agentów AI</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/agents" className="hover:text-slate-900 transition-colors">Marketplace</Link>
              <Link href="/register" className="hover:text-slate-900 transition-colors">Zostań twórcą</Link>
              <Link href="/login" className="hover:text-slate-900 transition-colors">Zaloguj się</Link>
            </nav>
            <p className="text-xs text-slate-400">© 2026 Giełda Agentów AI</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
