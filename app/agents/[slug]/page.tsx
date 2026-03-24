import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedAgentBySlug } from "../../../lib/agentRepo";

type RunPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    branza?: string;
    usluga?: string;
    cena?: string;
    termin?: string;
  }>;
};

function buildOffer(input: {
  agentName: string;
  branza: string;
  usluga: string;
  cena: string;
  termin: string;
}) {
  return `OFERTA HANDLOWA

Agent: ${input.agentName}

Branża:
${input.branza}

Zakres usługi:
${input.usluga}

Cena:
${input.cena}

Termin realizacji:
${input.termin}

Proponowany opis oferty:
Dziękujemy za zainteresowanie naszą usługą. Przygotowaliśmy ofertę dla branży: ${input.branza}. Zakres prac obejmuje: ${input.usluga}. Realizacja może zostać wykonana w terminie: ${input.termin}, a orientacyjna cena wynosi: ${input.cena}.

Warunki:
- szczegóły zakresu potwierdzane przed startem,
- możliwe doprecyzowanie materiałów i etapów,
- końcowa oferta może zostać rozszerzona o harmonogram i warunki płatności.

CTA:
W razie akceptacji prosimy o kontakt w celu potwierdzenia szczegółów i rozpoczęcia realizacji.`;
}

export default async function AgentRunPage({
  params,
  searchParams,
}: RunPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const agent = await getPublishedAgentBySlug(slug);
  if (!agent) return notFound();

  const branza = (query.branza ?? "").trim();
  const usluga = (query.usluga ?? "").trim();
  const cena = (query.cena ?? "").trim();
  const termin = (query.termin ?? "").trim();

  const isReady = branza && usluga && cena && termin;

  const result = isReady
    ? buildOffer({
        agentName: agent.name,
        branza,
        usluga,
        cena,
        termin,
      })
    : "";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          className="text-sm underline underline-offset-4"
          href={`/agents/${agent.slug}`}
        >
          ← Wróć do karty agenta
        </Link>

        <Link className="text-sm underline underline-offset-4" href="/agents">
          Katalog agentów
        </Link>
      </div>

      <header className="rounded-lg border p-4">
        <div className="text-xs opacity-70">{agent.category}</div>
        <h1 className="mt-2 text-2xl font-semibold">
          Uruchom: {agent.name}
        </h1>
        <p className="mt-2 text-sm opacity-80">{agent.tagline}</p>
      </header>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Dane wejściowe</h2>

        <form className="mt-4 grid gap-4" method="GET">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="branza">
              Branża
            </label>
            <input
              id="branza"
              name="branza"
              defaultValue={branza}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="np. ogrodzenia"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="usluga">
              Usługa / zakres
            </label>
            <textarea
              id="usluga"
              name="usluga"
              defaultValue={usluga}
              className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="np. montaż 120 m ogrodzenia panelowego 3D"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="cena">
              Cena
            </label>
            <input
              id="cena"
              name="cena"
              defaultValue={cena}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="np. 18 500 zł"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="termin">
              Termin
            </label>
            <input
              id="termin"
              name="termin"
              defaultValue={termin}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="np. 2 tygodnie"
            />
          </div>

          <div>
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Generuj ofertę
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Wynik</h2>

        {!isReady ? (
          <p className="mt-3 text-sm opacity-70">
            Uzupełnij branżę, zakres usługi, cenę i termin, a potem kliknij
            „Generuj ofertę”.
          </p>
        ) : (
          <pre className="mt-3 whitespace-pre-wrap text-sm">{result}</pre>
        )}
      </section>
    </main>
  );
}