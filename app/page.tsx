import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agents/AgentCard";
import { SearchForm } from "@/components/ui/SearchForm";

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

const QUICK_USE = [
  {
    icon: "✉️",
    title: "Odpowiedź na maila",
    desc: "Wklej trudnego maila → gotowa profesjonalna odpowiedź",
    slug: "odpowiedz-na-reklamacje",
  },
  {
    icon: "🔍",
    title: "Analiza konkurencji",
    desc: "Wklej link do konkurenta → analiza, słabości, szanse",
    slug: "monitoring-konkurencji",
  },
  {
    icon: "📄",
    title: "Streszczenie artykułu",
    desc: "Wklej URL lub tekst → kluczowe punkty w 30 sekund",
    slug: "streszczenie-artykulu",
  },
  {
    icon: "💼",
    title: "Oferta handlowa",
    desc: "Opisz usługę → gotowa oferta B2B do wysłania",
    slug: "oferta-handlowa",
  },
  {
    icon: "🧾",
    title: "Wycena usługi",
    desc: "Podaj dane → profesjonalna kalkulacja w sekundy",
    slug: "kalkulator-kosztow-koparka",
  },
  {
    icon: "📢",
    title: "Post na social media",
    desc: "Opisz temat → gotowy post na LinkedIn lub FB",
    slug: "post-linkedin",
  },
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
      {/* ═══════════════════════════════════════════════════════════════
          DARK ZONE — hero → preview → carousel
          Płynny gradient: deep navy → indigo → rozjaśnienie
      ════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-[#0B0B1F] via-[#12123A] to-slate-900">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-20 pt-24 text-white">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              AI Marketplace
            </div>

            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              Zrób ofertę, maila albo<br />
              <span className="gradient-text">analizę w 30 sekund</span>
            </h1>
            <p className="mb-10 text-base leading-relaxed text-slate-300 md:text-lg">
              Opisz co chcesz zrobić — AI przygotuje gotowy wynik,<br className="hidden sm:block" />
              który możesz od razu wysłać.
            </p>

            <SearchForm />
          </div>
        </section>

        {/* ── "Zobacz co dostaniesz" ─────────────────────────────────── */}
        <section className="px-6 py-24 text-white">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-400">Przykładowy wynik</p>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">Zobacz co dostaniesz</h2>
              <p className="mt-3 text-base text-slate-400">Gotowy dokument — w kilka sekund, bez pisania od zera</p>
            </div>

            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl ring-1 ring-purple-500/20 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wygenerowany wynik</p>
                  <h3 className="mt-1 text-xl font-extrabold text-white">Oferta B2B – usługi koparką</h3>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400">
                  Gotowe ✓
                </span>
              </div>

              <div className="space-y-5 rounded-xl border border-white/8 bg-white/5 p-5 text-sm">
                <div>
                  <p className="mb-2 font-semibold text-white">✔ Zakres usług:</p>
                  <ul className="ml-4 space-y-1.5 text-slate-300">
                    <li>– wykopy pod fundamenty</li>
                    <li>– instalacje wod-kan</li>
                    <li>– niwelacja terenu</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white">
                    ✔ Cena:{" "}
                    <span className="text-indigo-400">160 zł/h</span>
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-400">✔ Gotowe do wysłania</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-white/30 hover:bg-white/12 hover:text-white active:scale-[1.02]">
                  ⎘ Kopiuj
                </button>
                <button className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/50 transition-all hover:bg-indigo-500 hover:shadow-indigo-700/50 active:scale-[1.03]">
                  ✉ Wyślij
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Najczęściej używane — horizontal scroll ────────────────── */}
        <section className="py-24 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-400">Zacznij teraz</p>
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">Najczęściej używane</h2>
              <p className="mt-3 text-base text-slate-400">Kliknij i wklej swoje dane — wynik w kilka sekund</p>
            </div>
          </div>

          {/* Carousel — extends past container on both sides */}
          <div className="px-6">
            <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {QUICK_USE.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/agents/${tile.slug}/run`}
                  className="group snap-start shrink-0 w-72 md:w-80 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/8 hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-2xl">
                    {tile.icon}
                  </div>
                  <h3 className="mb-2 text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                    {tile.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-slate-400">{tile.desc}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-all group-hover:border-indigo-400/60 group-hover:bg-indigo-500/20">
                    Wypróbuj →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
      {/* ═══════════════════════════════════════════════════════════════
          LIGHT ZONE — od tego momentu jasne sekcje
      ════════════════════════════════════════════════════════════════ */}

      {/* ── Dlaczego to działa ────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500">Jak to działa</p>
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">Dlaczego to działa</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Gotowe w 30 sekund",
                desc: "Opisujesz zadanie w jednym zdaniu. Agent generuje pełny wynik natychmiast — bez czekania, bez konfiguracji.",
                accent: "bg-indigo-50 border-indigo-100",
                iconBg: "bg-indigo-100 text-indigo-700",
              },
              {
                icon: "✍️",
                title: "Nie piszesz od zera",
                desc: "Dostajesz gotowy szkielet — ofertę, maila, analizę. Edytujesz tylko to, co chcesz zmienić.",
                accent: "bg-emerald-50 border-emerald-100",
                iconBg: "bg-emerald-100 text-emerald-700",
              },
              {
                icon: "📤",
                title: "Kopiujesz i wysyłasz",
                desc: "Wynik jest sformatowany i gotowy do użycia. Kopia do schowka lub bezpośrednio do klienta mailem.",
                accent: "bg-amber-50 border-amber-100",
                iconBg: "bg-amber-100 text-amber-700",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border ${item.accent} p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.iconBg}`}>
                  {item.icon}
                </div>
                <h3 className="mb-3 text-lg font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof ─────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {[
              { value: "200+", label: "wygenerowanych wyników" },
              { value: "8", label: "kategorii agentów" },
              { value: "3", label: "darmowe uruchomienia na start" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-3">
                {i > 0 && <div className="hidden h-6 w-px bg-slate-200 sm:block" />}
                <span className="text-2xl font-extrabold text-slate-900">{stat.value}</span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Najpopularniejsze agenty ──────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">Najpopularniejsze agenty</h2>
              <p className="mt-2 text-sm text-slate-500">Najchętniej uruchamiane przez użytkowników</p>
            </div>
            <Link
              href="/agents"
              className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors sm:flex items-center gap-1"
            >
              Zobacz wszystkich →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <div className="mb-4 text-4xl">🤖</div>
              <p className="font-bold text-slate-800">Brak opublikowanych agentów</p>
              <p className="mt-1.5 text-sm text-slate-500">Sprawdź wkrótce — twórcy właśnie dodają swoje agenty.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* First row: 1 large featured + 2 stacked */}
              <div className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
                {featured.slice(0, 3).map((agent, i) => (
                  <div
                    key={agent.id}
                    className={
                      i === 0
                        ? "ring-2 ring-indigo-500/20 rounded-2xl shadow-lg shadow-indigo-500/5"
                        : ""
                    }
                  >
                    <AgentCard
                      slug={agent.slug}
                      name={agent.name}
                      tagline={agent.tagline}
                      category={agent.category}
                      pricingType={agent.pricingType}
                      pricingLabel={agent.pricingLabel}
                      runsCount={agent.runsCount}
                      featured={i === 0}
                      isNew={false}
                    />
                  </div>
                ))}
              </div>
              {/* Second row: remaining agents */}
              {featured.length > 3 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.slice(3).map((agent, i) => (
                    <AgentCard
                      key={agent.id}
                      slug={agent.slug}
                      name={agent.name}
                      tagline={agent.tagline}
                      category={agent.category}
                      pricingType={agent.pricingType}
                      pricingLabel={agent.pricingLabel}
                      runsCount={agent.runsCount}
                      featured={false}
                      isNew={i === 0}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/agents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Zobacz wszystkich agentów →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Kategorie agentów</h2>
            <p className="mt-2 text-sm text-slate-500">Znajdź agenta idealnego dla swojej branży</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/agents?category=${encodeURIComponent(cat.name)}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-md"
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

      {/* ── Creator CTA ──────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
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
              <ul className="mt-6 space-y-3">
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
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-[1.02]"
              >
                Zacznij sprzedawać →
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl">
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

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-extrabold leading-tight md:text-5xl">Gotowy do działania?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-indigo-100 leading-relaxed">
            Dołącz do społeczności użytkowników i twórców agentów AI.
            Pierwsze uruchomienia zawsze darmowe.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/agents"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-xl transition-all hover:bg-indigo-50 hover:-translate-y-0.5 active:scale-[1.02]"
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
