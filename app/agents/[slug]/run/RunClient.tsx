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
  agentDescription: string;
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

type Message = {
  role: "user" | "agent";
  content: string;
  time?: string;
};

export default function RunClient({ slug, agentName, agentTagline }: Props) {
  const { status: authStatus } = useSession();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const inFlight = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchState() {
    try {
      setLoadingState(true);
      const res = await fetch(`/api/run-agent?agentSlug=${encodeURIComponent(slug)}`, { cache: "no-store" });
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleRun() {
    if (inFlight.current || loading || loadingState) return;
    if (!input.trim()) { setError("Wpisz zapytanie."); return; }
    if (state && state.remainingFreeRuns <= 0 && !state.hasAccess) return;

    const userMsg = input.trim();
    const now = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", content: userMsg, time: now }]);
    setInput("");
    inFlight.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: slug, input: userMsg }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Wystąpił błąd.");
        if (data?.usedFreeRuns !== undefined) setState((prev) => prev ? { ...prev, ...data } : prev);
        return;
      }

      setMessages((prev) => [...prev, { role: "agent", content: data.result ?? "", time: now }]);
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
      if (!res.ok) { setError(data?.error ?? "Błąd zakupu."); return; }
      await fetchState();
    } catch {
      setError("Nie udało się przetworzyć zakupu.");
    } finally {
      setPurchasing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRun();
    }
  }

  const limitExhausted = state ? !state.hasAccess && state.remainingFreeRuns <= 0 : false;
  const isPaid = state && state.pricingType !== "FREE";

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:flex">
        <div className="border-b border-slate-200 p-5">
          <Link href={`/agents/${slug}`} className="mb-3 block text-xs text-slate-500 hover:text-slate-700">
            ← Powrót do karty agenta
          </Link>
          <h1 className="text-sm font-semibold text-slate-900">{agentName}</h1>
          {agentTagline && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{agentTagline}</p>}
        </div>

        <div className="border-b border-slate-200 p-5">
          {loadingState ? (
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          ) : state ? (
            state.hasAccess ? (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-green-700">Pełny dostęp</span>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Darmowe uruchomienia</span>
                  <span className="font-semibold">{state.usedFreeRuns}/{state.freeLimit}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${state.remainingFreeRuns === 0 ? "bg-red-500" : "bg-indigo-500"}`}
                    style={{ width: `${(state.usedFreeRuns / state.freeLimit) * 100}%` }}
                  />
                </div>
                {limitExhausted && isPaid && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-slate-700">Limit wyczerpany. Kup dostęp:</p>
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {purchasing ? "Przetwarzanie..." : `Kup – ${state.pricingLabel}`}
                    </button>
                    <p className="mt-1.5 text-center text-xs text-slate-400">Symulacja (Stripe wkrótce)</p>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Historia</p>
          {loadingState ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200" />)}
            </div>
          ) : !state || state.latestRuns.length === 0 ? (
            <p className="text-xs text-slate-400">Brak poprzednich uruchomień.</p>
          ) : (
            <div className="space-y-2">
              {state.latestRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => setMessages([
                    { role: "user", content: run.input, time: run.createdAt },
                    { role: "agent", content: run.output, time: run.createdAt },
                  ])}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-xs hover:border-indigo-300 transition-colors"
                >
                  <p className="line-clamp-1 font-medium text-slate-700">{run.input}</p>
                  <p className="mt-0.5 text-slate-400">{run.createdAt}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Link href={`/agents/${slug}`} className="text-xs text-slate-500">← Powrót</Link>
          <span className="text-sm font-semibold">{agentName}</span>
          <div className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-4 py-6">
          {authStatus === "unauthenticated" ? (
            <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl">🔐</div>
              <p className="font-semibold text-slate-900">Zaloguj się aby uruchomić agenta</p>
              <p className="mt-1 text-sm text-slate-500">Każdy użytkownik ma 3 darmowe uruchomienia</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href={`/login?callbackUrl=/agents/${slug}/run`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                  Zaloguj się
                </Link>
                <Link href="/register" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Zarejestruj się
                </Link>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">🤖</div>
              <p className="font-medium text-slate-700">{agentName}</p>
              <p className="mt-1 text-sm text-slate-400">Wpisz zapytanie aby rozpocząć</p>
              {limitExhausted && <p className="mt-3 text-xs font-medium text-red-600">Limit darmowych uruchomień wyczerpany</p>}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "agent" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">AI</div>
                  )}
                  <div className={`max-w-xl rounded-2xl px-4 py-3 ${msg.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.time && <p className={`mt-1.5 text-xs ${msg.role === "user" ? "text-indigo-200" : "text-slate-400"}`}>{msg.time}</p>}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">Ty</div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">AI</div>
                  <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-sm text-red-600">{error}</div>
        )}

        {authStatus !== "unauthenticated" && !limitExhausted && (
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mx-auto flex max-w-3xl items-end gap-3">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  rows={2}
                  placeholder="Opisz zadanie dla agenta... (Ctrl+Enter aby wysłać)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || loadingState}
                />
              </div>
              <button
                onClick={handleRun}
                disabled={loading || loadingState || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {authStatus !== "unauthenticated" && limitExhausted && isPaid && (
          <div className="border-t border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-medium text-amber-800">Limit darmowych uruchomień wyczerpany</p>
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="mt-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {purchasing ? "Przetwarzanie..." : `Kup dostęp – ${state?.pricingLabel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
