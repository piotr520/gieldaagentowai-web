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

// ── Markdown renderer ────────────────────────────────────────────────────────
// Handles: # h1, ## h2, ### h3, #### h4, - lists, 1. numbered, ---, **bold**, blank lines
function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-bold text-slate-900">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (t.startsWith("#### ")) {
      nodes.push(
        <h4 key={i} className="mt-5 mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {t.slice(5)}
        </h4>
      );
    } else if (t.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="mt-7 mb-2 text-sm font-extrabold uppercase tracking-wider text-indigo-600">
          {t.slice(4)}
        </h3>
      );
    } else if (t.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="mt-8 mb-3 border-b border-slate-100 pb-2 text-base font-extrabold text-slate-900">
          {t.slice(3)}
        </h2>
      );
    } else if (t.startsWith("# ")) {
      nodes.push(
        <h1 key={i} className="mb-5 text-xl font-extrabold text-slate-900">
          {t.slice(2)}
        </h1>
      );
    } else if (/^[-*] /.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul${i}`} className="my-3 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span>{inlineBold(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol${i}`} className="my-3 ml-4 list-decimal space-y-2 marker:text-slate-400">
          {items.map((item, j) => (
            <li key={j} className="pl-1 text-sm leading-relaxed text-slate-700">
              {inlineBold(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (/^[-=_]{3,}$/.test(t)) {
      nodes.push(<hr key={i} className="my-6 border-slate-200" />);
    } else if (t === "") {
      nodes.push(<div key={i} className="h-3" />);
    } else {
      nodes.push(
        <p key={i} className="text-sm leading-[1.85] text-slate-700">
          {inlineBold(raw)}
        </p>
      );
    }
    i++;
  }

  return <>{nodes}</>;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RunClient({ slug, agentName, agentTagline }: Props) {
  const { status: authStatus } = useSession();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [copied, setCopied] = useState(false);
  const inFlight = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Błąd zakupu."); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Nie udało się przetworzyć zakupu.");
    } finally {
      setPurchasing(false);
    }
  }

  function isEmailResult(text: string): boolean {
    return /^Temat:/m.test(text) || /^Subject:/m.test(text);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      resultRef.current?.focus?.();
    }
  }

  function handleUse() {
    if (isEmailResult(result)) {
      const subjectMatch = result.match(/^(?:Temat|Subject):\s*(.+)/m);
      const subject = subjectMatch ? subjectMatch[1].trim() : "";
      const body = result.replace(/^(?:Temat|Subject):[^\n]*\n?/m, "").trim();
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else if (resultRef.current && window.getSelection) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(resultRef.current);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  }

  const limitExhausted = state ? !state.hasAccess && state.remainingFreeRuns <= 0 : false;
  const isPaid = state && state.pricingType !== "FREE";
  const wordCount = result ? result.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full min-h-[calc(100vh-64px)] flex-col lg:flex-row">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r lg:overflow-y-auto">
        <div className="p-5">

          {/* Back link */}
          <Link
            href={`/agents/${slug}`}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Karta agenta
          </Link>

          {/* Agent identity */}
          <div className="mb-6 rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-4">
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-sm">
              AI
            </div>
            <h1 className="mt-2 text-sm font-extrabold leading-snug text-slate-900 line-clamp-2">{agentName}</h1>
            {agentTagline && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">{agentTagline}</p>
            )}
          </div>

          {/* Usage status */}
          {authStatus === "authenticated" && state && !loadingState && (
            <div className="mb-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dostęp</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                {state.hasAccess && state.pricingType === "FREE" ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">✓</span>
                    <span className="text-xs font-semibold text-slate-700">Pełny dostęp · darmowy</span>
                  </div>
                ) : state.hasAccess ? (
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">✓</span>
                    <span className="text-xs font-semibold text-slate-700">Pełny dostęp</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Darmowe użycia</span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {state.usedFreeRuns} / {state.freeLimit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (state.usedFreeRuns / state.freeLimit) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Pozostało:{" "}
                      <span className="font-bold text-slate-700">{state.remainingFreeRuns}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Run history */}
          {state && state.latestRuns.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Ostatnie uruchomienia
              </p>
              <div className="space-y-2">
                {state.latestRuns.map((run, i) => (
                  <div
                    key={run.id}
                    className="group cursor-pointer rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                  >
                    <p className="mb-1.5 text-[10px] text-slate-400">
                      #{state.latestRuns.length - i} · {run.createdAt}
                    </p>
                    <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed">
                      {run.input}
                    </p>
                    {run.output && (
                      <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 leading-relaxed border-t border-slate-50 pt-1.5">
                        {run.output.slice(0, 100)}{run.output.length > 100 ? "…" : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-slate-50/70">

        {/* Unauthenticated */}
        {authStatus === "unauthenticated" ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">🔒</div>
              <h2 className="text-xl font-extrabold text-slate-900">Zaloguj się</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
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
            {/* ── Output area ──────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-5 lg:p-8">

              {/* Loading state */}
              {loadingState ? (
                <div className="flex items-center justify-center py-24">
                  <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                    <svg className="h-8 w-8 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Ładowanie...</span>
                  </div>
                </div>

              ) : limitExhausted ? (
                /* Paywall */
                <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">⚠️</div>
                  <h3 className="text-lg font-extrabold text-amber-900">Limit darmowych użyć wyczerpany</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-700">
                    Wykorzystałeś wszystkie {state?.freeLimit} darmowe uruchomienia tego agenta.
                  </p>
                  {isPaid && (
                    <div className="mt-6">
                      <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="rounded-xl bg-amber-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {purchasing ? "Przetwarzanie..." : `Kup dostęp — ${state?.pricingLabel}`}
                      </button>
                      <p className="mt-2 text-xs text-amber-600">Bezpieczna płatność przez Stripe</p>
                    </div>
                  )}
                </div>

              ) : result ? (
                /* ── Result document ─────────────────────────────── */
                <div className="mx-auto max-w-3xl">

                  {/* Document card */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">

                    {/* Document header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-extrabold text-white shadow-sm">
                          AI
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{agentName}</p>
                          <p className="text-[10px] text-slate-400">Wygenerowany wynik</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{wordCount} słów</span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Gotowe ✓
                        </span>
                      </div>
                    </div>

                    {/* Document body — markdown */}
                    <div
                      ref={resultRef}
                      className="px-7 py-6"
                      tabIndex={-1}
                    >
                      {parseMarkdown(result)}
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3.5">
                      <span className="text-xs text-slate-400 hidden sm:block">
                        Ctrl+C aby skopiować · zaznacz fragment, żeby skopiować część
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-0.5"
                        >
                          {copied ? (
                            <><span className="text-emerald-500 font-bold">✓</span> Skopiowano</>
                          ) : (
                            <><span>⎘</span> Kopiuj</>
                          )}
                        </button>
                        <button
                          onClick={handleUse}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
                        >
                          {isEmailResult(result) ? "✉ Wyślij mailem →" : "⌥ Zaznacz tekst"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nudge to run again */}
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Nie satysfakcjonuje? Wpisz inne zapytanie poniżej i uruchom ponownie.
                  </p>
                </div>

              ) : loading ? (
                /* Generating state */
                <div className="mx-auto max-w-3xl">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-extrabold text-white shadow-sm">
                        AI
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{agentName}</p>
                        <p className="text-[10px] text-slate-400">Generowanie wyniku...</p>
                      </div>
                      <svg className="ml-auto h-4 w-4 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                    <div className="px-7 py-8 space-y-3">
                      {[80, 60, 70, 45, 65].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded-full bg-slate-100"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              ) : (
                /* Empty state */
                <div className="flex flex-1 items-center justify-center py-20 text-center">
                  <div className="max-w-xs">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-3xl shadow-sm">
                      ✨
                    </div>
                    <p className="text-base font-extrabold text-slate-700">Gotowy do uruchomienia</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      Wpisz zapytanie lub wklej link do strony.<br />
                      Naciśnij <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">Ctrl+Enter</kbd> aby wysłać.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mx-auto mt-5 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold">⚠</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* ── Input bar ────────────────────────────────────────── */}
            {!limitExhausted && (
              <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-end gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                    <textarea
                      ref={textareaRef}
                      className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-900 placeholder-slate-400 outline-none"
                      rows={2}
                      placeholder="Opisz zadanie lub wklej link (https://...)..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading || loadingState}
                    />
                    <button
                      onClick={handleRun}
                      disabled={loading || loadingState || !input.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm transition-all hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
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
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-[11px] text-slate-400">
                      <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono font-semibold">Ctrl+Enter</kbd>{" "}
                      aby wysłać
                    </span>
                    {state && (
                      <span className="text-[11px] text-slate-400">
                        {state.pricingType === "FREE" ? (
                          <span className="text-emerald-600 font-medium">● Darmowy agent</span>
                        ) : (
                          <>Pozostało darmowych: <strong className="text-slate-600">{state.remainingFreeRuns}</strong></>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
