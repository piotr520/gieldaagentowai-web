import Link from "next/link";
import { getPublishedAgents } from "../lib/agentRepo";
import type { AgentCategory } from "../lib/types";

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; cat?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = (sp.q ?? "").trim().toLowerCase();
  const cat = (sp.cat ?? "").trim();

  const agents = await getPublishedAgents();
  const categories = Array.from(new Set(agents.map(a => a.category))).sort();

  const filtered = agents.filter(a => {
    const matchesQ =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.tagline.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q);

    const matchesCat = !cat || a.category === (cat as AgentCategory);
    return matchesQ && matchesCat;
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Giełda Agentów AI</h1>
          <div className="text-sm flex gap-3">
            <Link className="underline underline-offset-4" href="/login">Logowanie</Link>
            <Link className="underline underline-offset-4" href="/dashboard">Panel twórcy</Link>
            <Link className="underline underline-offset-4" href="/admin">Admin</Link>
          </div>
        </div>
        <p className="text-sm opacity-80">
          Sprint 2: konta + twórcy + statusy pending/published + admin approve.
        </p>
      </header>

      <form method="get" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-sm opacity-80" htmlFor="q">Szukaj</label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="np. oferta, CV, SEO..."
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="sm:w-64">
          <label className="text-sm opacity-80" htmlFor="cat">Branża</label>
          <select
            id="cat"
            name="cat"
            defaultValue={sp.cat ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="">Wszystkie</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button className="rounded-md border px-4 py-2" type="submit">
          Filtruj
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2">
        {filtered.map(a => (
          <article key={a.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs opacity-70">{a.category}</div>
              <div className="text-xs opacity-70">{a.lastUpdated}</div>
            </div>

            <h2 className="text-lg font-medium">
              <Link className="underline underline-offset-4" href={`/agents/${a.slug}`}>
                {a.name}
              </Link>
            </h2>

            <p className="mt-2 text-sm opacity-80">{a.tagline}</p>

            <div className="mt-3 text-sm">
              {a.pricing.type === "free" && <span>Darmowy</span>}
              {a.pricing.type === "one_time" && <span>{a.pricing.label}: {a.pricing.amountPln} zł</span>}
              {a.pricing.type === "subscription" && <span>{a.pricing.label}: {a.pricing.amountPlnPerMonth} zł</span>}
            </div>

            <div className="mt-3">
              <Link className="text-sm underline underline-offset-4" href={`/agents/${a.slug}`}>
                Zobacz kartę agenta →
              </Link>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && (
        <p className="mt-6 text-sm opacity-80">Brak wyników.</p>
      )}
    </main>
  );
}