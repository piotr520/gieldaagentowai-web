"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OfferHistoryItem = {
  id: string;
  createdAt: string;
  branza: string;
  usluga: string;
  cena: string;
  termin: string;
  wynik: string;
};

const FREE_LIMIT = 3;
const AGENT_SLUG = "oferta-handlowa-b2b";

export default function RunAgent() {
  const [branza, setBranza] = useState("");
  const [usluga, setUsluga] = useState("");
  const [cena, setCena] = useState("");
  const [termin, setTermin] = useState("");

  const [wynik, setWynik] = useState("");
  const [blad, setBlad] = useState("");
  const [ladowanie, setLadowanie] = useState(false);
  const [ladowanieStanu, setLadowanieStanu] = useState(true);

  const [wykorzystanoGratis, setWykorzystanoGratis] = useState(0);
  const [historiaOfert, setHistoriaOfert] = useState<OfferHistoryItem[]>([]);

  const requestInFlightRef = useRef(false);

  const pozostaloGratis = useMemo(() => {
    return Math.max(0, FREE_LIMIT - wykorzystanoGratis);
  }, [wykorzystanoGratis]);

  const limitWykorzystany = wykorzystanoGratis >= FREE_LIMIT;

  async function pobierzStan() {
    try {
      setLadowanieStanu(true);
      setBlad("");

      const res = await fetch(
        `/api/run-agent?agentSlug=${encodeURIComponent(AGENT_SLUG)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setBlad(data?.error || "Nie udało się pobrać stanu agenta.");
        return;
      }

      setWykorzystanoGratis(
        typeof data?.usedFreeRuns === "number" ? data.usedFreeRuns : 0
      );
      setHistoriaOfert(Array.isArray(data?.latestOffers) ? data.latestOffers : []);
      setWynik(typeof data?.latestResult === "string" ? data.latestResult : "");
    } catch {
      setBlad("Nie udało się pobrać danych startowych.");
    } finally {
      setLadowanieStanu(false);
    }
  }

  useEffect(() => {
    pobierzStan();
  }, []);

  async function generuj() {
    if (requestInFlightRef.current || ladowanie || ladowanieStanu || limitWykorzystany) {
      return;
    }

    setBlad("");

    if (!branza.trim() || !usluga.trim() || !cena.trim() || !termin.trim()) {
      setBlad("Uzupełnij wszystkie pola.");
      return;
    }

    requestInFlightRef.current = true;
    setLadowanie(true);

    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          agentSlug: AGENT_SLUG,
          branza: branza.trim(),
          usluga: usluga.trim(),
          cena: cena.trim(),
          termin: termin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBlad(data?.error || "Wystąpił błąd podczas generowania oferty.");

        setWykorzystanoGratis(
          typeof data?.usedFreeRuns === "number" ? data.usedFreeRuns : 0
        );

        setHistoriaOfert(Array.isArray(data?.latestOffers) ? data.latestOffers : []);

        setWynik(typeof data?.latestResult === "string" ? data.latestResult : "");

        return;
      }

      setWynik(typeof data?.result === "string" ? data.result : "");
      setWykorzystanoGratis(
        typeof data?.usedFreeRuns === "number" ? data.usedFreeRuns : 0
      );
      setHistoriaOfert(Array.isArray(data?.latestOffers) ? data.latestOffers : []);
    } catch {
      setBlad("Nie udało się połączyć z API.");
    } finally {
      requestInFlightRef.current = false;
      setLadowanie(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Uruchom: Generator ofert B2B</h1>

      <div className="rounded border border-neutral-300 bg-neutral-50 p-4">
        <div className="text-sm font-medium">
          Wykorzystano gratis: {wykorzystanoGratis} / {FREE_LIMIT}
        </div>
        <div className="mt-1 text-sm text-neutral-600">
          Pozostało darmowych użyć: {pozostaloGratis}
        </div>

        {limitWykorzystany ? (
          <div className="mt-2 text-sm font-medium text-red-600">
            Limit darmowy został wykorzystany.
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Branża"
          value={branza}
          onChange={(e) => setBranza(e.target.value)}
          disabled={ladowanie || ladowanieStanu}
        />

        <textarea
          className="w-full rounded border p-2"
          placeholder="Usługa / zakres"
          value={usluga}
          onChange={(e) => setUsluga(e.target.value)}
          disabled={ladowanie || ladowanieStanu}
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Cena"
          value={cena}
          onChange={(e) => setCena(e.target.value)}
          disabled={ladowanie || ladowanieStanu}
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Termin"
          value={termin}
          onChange={(e) => setTermin(e.target.value)}
          disabled={ladowanie || ladowanieStanu}
        />

        <button
          onClick={generuj}
          disabled={ladowanie || ladowanieStanu || limitWykorzystany}
          className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ladowanie ? "Generowanie..." : "Generuj ofertę"}
        </button>
      </div>

      {blad ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {blad}
        </div>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ostatnia wygenerowana oferta</h2>
        <div className="whitespace-pre-wrap rounded border p-4">
          {ladowanieStanu
            ? "Ładowanie..."
            : wynik || "Tutaj pojawi się wygenerowana oferta."}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3 ostatnie wygenerowane oferty</h2>

        {ladowanieStanu ? (
          <div className="rounded border p-4 text-sm text-neutral-600">
            Ładowanie historii ofert...
          </div>
        ) : historiaOfert.length === 0 ? (
          <div className="rounded border p-4 text-sm text-neutral-600">
            Nie ma jeszcze zapisanych ofert.
          </div>
        ) : (
          <div className="space-y-3">
            {historiaOfert.map((oferta, index) => (
              <article key={oferta.id} className="rounded border p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">
                    Oferta #{historiaOfert.length - index}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {oferta.createdAt}
                  </div>
                </div>

                <div className="mb-3 space-y-1 text-sm text-neutral-700">
                  <div>
                    <span className="font-medium">Branża:</span> {oferta.branza}
                  </div>
                  <div>
                    <span className="font-medium">Usługa:</span> {oferta.usluga}
                  </div>
                  <div>
                    <span className="font-medium">Cena:</span> {oferta.cena}
                  </div>
                  <div>
                    <span className="font-medium">Termin:</span> {oferta.termin}
                  </div>
                </div>

                <div className="whitespace-pre-wrap rounded bg-neutral-50 p-3 text-sm">
                  {oferta.wynik}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}