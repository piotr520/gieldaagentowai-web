"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type RunItem = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
};

type AgentState = {
  agentId: string;
  agentName: string;
  freeLimit: number;
  usedFreeRuns: number;
  remainingFreeRuns: number;
  isAuthenticated: boolean;
  latestRuns: RunItem[];
};

type Props = {
  slug: string;
  agentName: string;
  agentTagline: string;
};

export default function RunClient({ slug, agentName, agentTagline }: Props) {
  const { status: authStatus } = useSession();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const inFlight = useRef(false);

  async function fetchState() {
    try {
      setLoadingState(true);
      const res = await fetch(`/api/run-agent?agentSlug=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setState(data);
    } finally {
      setLoadingState(false);
    }
  }

  useEffect(() => {
    if (authStatus !== "loading") fetchState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, authStatus]);

  async function handleRun() {
    if (inFlight.current || loading || loadingState) return;
    if (!input.trim()) { setError("Wpisz zapytanie."); return; }
    if (state && state.remainingFreeRuns <= 0) return;

    inFlight.current = true;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: slug, input: input.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Wystąpił błąd.");
        if (data?.usedFreeRuns !== undefined) setState((prev) => prev ? { ...prev, ...data } : prev);
        return;
      }

      setResult(data.result ?? "");
      setState(data);
    } catch {
      setError("Nie udało się połączyć z API.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  const limitExhausted = state ? state.remainingFreeRuns <= 0 : false;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link href={`/agents/${slug}`} className="text-sm text-neutral-500 hover:underline">
          ← Powrót do karty agenta
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{agentName}</h1>
        {agentTagline ? (
          <p className="mt-1 text-sm text-neutral-600">{agentTagline}</p>
        ) : null}
      </div>

      {/* Niezalogowany */}
      {authStatus === "unauthenticated" ? (
        <div className="rounded border border-neutral-300 bg-neutral-50 p-6 text-center">
          <p className="mb-4 text-sm font-medium">
            Zaloguj się, aby uruchomić agenta.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/login?callbackUrl=/agents/${slug}/run`}
              className="rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Zarejestruj się za darmo
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Licznik użyć */}
          <div className="rounded border border-neutral-300 bg-neutral-50 p-4">
            {loadingState ? (
              <p className="text-sm text-neutral-500">Ładowanie stanu...</p>
            ) : state ? (
              <>
                <p className="text-sm font-medium">
                  Twoje darmowe użycia: {state.usedFreeRuns} / {state.freeLimit}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Pozostało: {state.remainingFreeRuns}
                </p>
                {limitExhausted ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    Limit darmowych użyć wyczerpany. Wkrótce dostępny zakup dostępu.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-red-500">Nie udało się pobrać stanu agenta.</p>
            )}
          </div>

          {/* Formularz */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Twoje zapytanie</label>
            <textarea
              className="w-full rounded border border-neutral-300 p-3 text-sm"
              rows={5}
              placeholder="Opisz zadanie dla agenta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || loadingState || limitExhausted}
            />
            <button
              onClick={handleRun}
              disabled={loading || loadingState || limitExhausted}
              className="rounded border border-neutral-800 bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uruchamianie..." : "Uruchom agenta"}
            </button>
          </div>

          {error ? (
            <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Wynik */}
          {result ? (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Wynik</h2>
              <div className="whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-4 text-sm">
                {result}
              </div>
            </section>
          ) : null}

          {/* Historia */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Twoja historia uruchomień</h2>
            {loadingState ? (
              <p className="text-sm text-neutral-500">Ładowanie historii...</p>
            ) : !state || state.latestRuns.length === 0 ? (
              <p className="text-sm text-neutral-500">Brak uruchomień.</p>
            ) : (
              <div className="space-y-3">
                {state.latestRuns.map((run, i) => (
                  <article key={run.id} className="rounded border border-neutral-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">
                        #{state.latestRuns.length - i}
                      </span>
                      <span className="text-xs text-neutral-400">{run.createdAt}</span>
                    </div>
                    <p className="mb-2 text-sm font-medium text-neutral-700 line-clamp-2">
                      {run.input}
                    </p>
                    <div className="whitespace-pre-wrap rounded bg-neutral-50 p-3 text-sm text-neutral-800 line-clamp-4">
                      {run.output}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
