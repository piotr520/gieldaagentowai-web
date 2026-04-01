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
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI Marketplace
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
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

      {/* ── "Zobacz co dostaniesz" ────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-500">Przykładowy wynik</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Zobacz co dostaniesz</h2>
            <p className="mt-2 text-sm text-slate-500">Gotowy dokument — w kilka sekund, bez pisania od zera</p>
          </div>

          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wygenerowany wynik</p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">Oferta B2B – usługi koparką</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Gotowe ✓
              </span>
            </div>

            <div className="space-y-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
              <div>
                <p className="mb-1.5 font-semibold text-slate-800">✔ Zakres usług:</p>
                <ul className="ml-4 space-y-1 text-slate-600">
                  <li>– wykopy pod fundamenty</li>
                  <li>– instalacje wod-kan</li>
                  <li>– niwelacja terenu</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800">✔ Cena: <span className="text-indigo-700">160 zł/h</span></p>
              </div>
              <div>
                <p className="font-semibold text-emerald-700">✔ Gotowe do wysłania</p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-700">
                ⎘ Kopiuj
              </button>
              <button className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500">
                ✉ Wyślij
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Najczęściej używane ───────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-500">Zacznij teraz</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Najczęściej używane</h2>
            <p className="mt-2 text-sm text-slate-500">Kliknij i wklej swoje dane — wynik w kilka sekund</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "✉️",
                title: "Odpowiedź na maila",
                desc: "Wklej trudnego maila → dostaniesz gotową odpowiedź",
                slug: "odpowiedz-na-reklamacje",
                color: "from-blue-50 to-indigo-50",
                border: "border-blue-100 hover:border-blue-300",
                badge: "bg-blue-50 text-blue-600 border-blue-200",
              },
              {
                icon: "🔍",
                title: "Analiza konkurencji",
                desc: "Wklej link do strony konkurenta → analiza i rekomendacje",
                slug: "monitoring-konkurencji",
                color: "from-violet-50 to-purple-50",
                border: "border-violet-100 hover:border-violet-300",
                badge: "bg-violet-50 text-violet-700 border-violet-200",
              },
              {
                icon: "📄",
                title: "Streszczenie artykułu",
                desc: "Wklej URL lub tekst → kluczowe punkty w 30 sekund",
                slug: "streszczenie-artykulu",
                color: "from-emerald-50 to-teal-50",
                border: "border-emerald-100 hover:border-emerald-300",
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                icon: "💼",
                title: "Oferta handlowa",
                desc: "Opisz usługę → gotowa oferta B2B do wysłania",
                slug: "oferta-handlowa",
                color: "from-amber-50 to-orange-50",
                border: "border-amber-100 hover:border-amber-300",
                badge: "bg-amber-50 text-amber-700 border-amber-200",
              },
              {
                icon: "🧾",
                title: "Faktura / wycena",
                desc: "Podaj dane → profesjonalna wycena w sekundy",
                slug: "kalkulator-kosztow-koparka",
                color: "from-rose-50 to-pink-50",
                border: "border-rose-100 hover:border-rose-300",
                badge: "bg-rose-50 text-rose-700 border-rose-200",
              },
              {
                icon: "📢",
                title: "Post na social media",
                desc: "Opisz temat → gotowy post na LinkedIn lub FB",
                slug: "post-linkedin",
                color: "from-sky-50 to-cyan-50",
                border: "border-sky-100 hover:border-sky-300",
                badge: "bg-sky-50 text-sky-700 border-sky-200",
              },
            ].map((tile) => (
              <Link
                key={tile.slug}
                href={`/agents/${tile.slug}/run`}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${tile.color} ${tile.border} p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-2xl border border-slate-100">
                    {tile.icon}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tile.badge}`}>
                    Wypróbuj →
                  </span>
                </div>
                <h3 className="mb-1.5 text-base font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {tile.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">{tile.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dlaczego to działa ────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-500">Jak to działa</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Dlaczego to działa</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Gotowe w 30 sekund",
                desc: "Opisujesz zadanie w jednym zdaniu. Agent generuje pełny wynik natychmiast — bez czekania, bez konfiguracji.",
                color: "from-indigo-50 to-violet-50",
                border: "border-indigo-100",
              },
              {
                icon: "✍️",
                title: "Nie piszesz od zera",
                desc: "Dostajesz gotowy szkielet — ofertę, maila, analizę. Edytujesz tylko to, co chcesz zmienić.",
                color: "from-emerald-50 to-teal-50",
                border: "border-emerald-100",
              },
              {
                icon: "📤",
                title: "Kopiujesz i wysyłasz",
                desc: "Wynik jest sformatowany i gotowy do użycia. Kopia do schowka lub bezpośrednio do klienta mailem.",
                color: "from-amber-50 to-orange-50",
                border: "border-amber-100",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border bg-gradient-to-br ${item.color} ${item.border} p-6 shadow-sm`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-2xl">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof ────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900">200+</span>
              <span className="text-sm text-slate-500">wygenerowanych wyników</span>
            </div>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900">8</span>
              <span className="text-sm text-slate-500">kategorii agentów</span>
            </div>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900">3</span>
              <span className="text-sm text-slate-500">darmowe uruchomienia na start</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured agents ──────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
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
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white px-6 py-16">
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
