import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENTS } from "../../../lib/agents";

export default function AgentPage({ params }: { params: { slug: string } }) {
  const agent = AGENTS.find(a => a.slug === params.slug);
  if (!agent) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <Link className="text-sm underline underline-offset-4" href="/">
          ← Wróć do katalogu
        </Link>
      </div>

      <header className="rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-xs opacity-70">{agent.category}</div>
          <div className="text-xs opacity-70">Aktualizacja: {agent.lastUpdated}</div>
        </div>

        <h1 className="text-2xl font-semibold">{agent.name}</h1>
        <p className="mt-2 text-sm opacity-80">{agent.tagline}</p>

        <div className="mt-3 text-sm">
          {agent.pricing.type === "free" && <span>Darmowy</span>}
          {agent.pricing.type === "one_time" && (
            <span>
              {agent.pricing.label}: {agent.pricing.amountPln} zł
            </span>
          )}
          {agent.pricing.type === "subscription" && (
            <span>
              {agent.pricing.label}: {agent.pricing.amountPlnPerMonth} zł
            </span>
          )}
        </div>
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Opis</h2>
        <p className="mt-2 text-sm opacity-80">{agent.description}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Ograniczenia</h2>
        <ul className="mt-2 list-disc pl-6 text-sm opacity-80">
          {agent.limitations.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Przykłady</h2>
        <div className="mt-2 space-y-3">
          {agent.examples.map((ex, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="text-xs opacity-70">Input</div>
              <pre className="mt-1 whitespace-pre-wrap text-sm">{ex.input}</pre>
              <div className="mt-3 text-xs opacity-70">Output</div>
              <pre className="mt-1 whitespace-pre-wrap text-sm">{ex.output}</pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}