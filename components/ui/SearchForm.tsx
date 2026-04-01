"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

const PLACEHOLDERS = [
  "Napisz ofertę B2B dla firmy budowlanej (usługi koparką)",
  "Odpowiedz klientowi na reklamację opóźnionej dostawy",
  "Przeanalizuj konkurencję w mojej branży",
  "Policz koszt usługi koparką",
];

export function SearchForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.submit();
    }
  }

  return (
    <form ref={formRef} action="/results" method="GET">
      <textarea
        name="q"
        rows={3}
        autoFocus
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDERS[placeholderIdx]}
        className="w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-400/30 transition-all backdrop-blur"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-indigo-500 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-400 hover:-translate-y-0.5"
        >
          Zrób to za mnie →
        </button>
        <Link
          href="/agents"
          className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
        >
          lub przeglądaj katalog →
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
        {[
          "3 darmowe użycia",
          "bez rejestracji",
          "wynik gotowy do wysłania",
        ].map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">✔</span>
            {t}
          </span>
        ))}
      </div>
    </form>
  );
}
