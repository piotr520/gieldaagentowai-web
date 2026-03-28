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
  pricingType: string;
  pricingLabel: string;
  pricingAmountPln: number | null;
  pricingAmountPlnPerMonth: number | null;
  freeLimit: number;
  usedFreeRuns: number;
  remainingFreeRuns: number;
  hasAccess: boolean;
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
  const [purchasing, setPurchasing] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const inFlight = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (state && state.remainingFreeRuns <= 0 && !state.hasAccess) return;

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

  async function handlePurchase() {
    if (purchasing) return;
    setPurchasing(true);
    setError("");

    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Błąd zakupu.");
        return;
      }

      await fetchState();
    } catch {
      setError("Nie udało się przetworzyć zakupu.");
    } finally {
      setPurchasing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  const limitExhausted = state
    ? !state.hasAccess && state.remainingFreeRuns <= 0
    : false;

  const isPaid = state && state.pricingType !== "FREE";

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] flex-col lg:flex-row">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
        <div className="p-5">
          <Link
            href={`/agents/${slug}`}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Karta agenta
          </Link>

          <div className="mb-5">
            <h1 className="font-extrabold text-slate-900 leading-snug line-clamp-2">{agentName}</h1>
            {agentTagline && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{agentTagline}</p>
            )}
          </div>

          {/* Usage status */}
          {authStatus === "authenticated" && state && !loadingState && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {state.hasAccess ? (
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                  <span className="text-xs font-semibold text-slate-700">Pełny dostęp</span>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Darmowe użycia</span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {state.usedFreeRuns}/{state.freeLimit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (state.usedFreeRuns / state.freeLimit) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Pozostało: <span className="font-semibold text-slate-700">{state.remainingFreeRuns}</span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Run history */}
          {state && state.latestRuns.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Historia
              </p>
              <div className="space-y-2">
                {state.latestRuns.map((run, i) => (
                  <div key={run.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                    <p className="text-[10px] text-slate-400 mb-1">
                      #{state.latestRuns.length - i} · {run.createdAt}
                    </p>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{run.input}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {/* Unauthenticated */}
        {authStatus === "unauthenticated" ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                🔒
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Zaloguj się</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Aby uruchomić agenta, musisz być zalogowany.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href={`/login?callbackUrl=/agents/${slug}/run`}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white transition-all hover:from-indigo-500 hover:to-violet-500"
                >
                  Zaloguj się
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Zarejestruj się za darmo
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Result area */}
            <div className="flex-1 overflow-auto p-6">
              {loadingState ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ładowanie stanu agenta...
                  </div>
                </div>
              ) : limitExhausted ? (
                <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                    ⚠️
                  </div>
                  <h3 className="text-lg font-extrabold text-amber-900">Limit darmowych użyć wyczerpany</h3>
                  <p className="mt-2 text-sm text-amber-700 leading-relaxed">
                    Wykorzystałeś wszystkie {state?.freeLimit} darmowe uruchomienia tego agenta.
                  </p>
                  {isPaid && (
                    <div className="mt-6">
                      <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="rounded-xl bg-amber-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {purchasing ? "Przetwarzanie..." : `Kup dostęp — ${state?.pricingLabel}`}
                      </button>
                      <p className="mt-2 text-xs text-amber-600">Symulacja zakupu (Stripe wkrótce)</p>
                    </div>
                  )}
                </div>
              ) : result ? (
                <div className="mx-auto max-w-2xl">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-extrabold text-indigo-700 border border-indigo-200">
                      AI
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{agentName}</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{result}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center py-20 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 text-3xl shadow-sm">
                      ✨
                    </div>
                    <p className="font-extrabold text-slate-700 text-base">Gotowy do uruchomienia</p>
                    <p className="mt-1.5 text-sm text-slate-500">Wpisz zapytanie i naciśnij Wyślij lub Ctrl+Enter</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-auto mt-4 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  {error}
                </div>
              )}
            </div>

            {/* Input area */}
            {!limitExhausted && (
              <div className="border-t border-slate-200 bg-white p-4 shadow-sm">
                <div className="mx-auto max-w-2xl">
                  <div className="flex items-end gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <textarea
                      ref={textareaRef}
                      className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none leading-relaxed"
                      rows={2}
                      placeholder="Opisz zadanie dla agenta..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading || loadingState}
                    />
                    <button
                      onClick={handleRun}
                      disabled={loading || loadingState || !input.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {loading ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-center text-xs text-slate-400">
                    Ctrl+Enter aby wysłać
                    {state ? ` · Pozostało darmowych: ${state.remainingFreeRuns}` : ""}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
