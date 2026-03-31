"use client";

import { useRef } from "react";
import Link from "next/link";

export function SearchForm() {
  const formRef = useRef<HTMLFormElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.submit();
    }
  }

  return (
    <form ref={formRef} action="/results" method="GET" className="mb-8">
      <div className="relative">
        <textarea
          name="q"
          rows={3}
          onKeyDown={handleKeyDown}
          placeholder="Opisz czego potrzebujesz (np. agent do ofert B2B, obsługi klienta, analizy danych...)"
          className="w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white/15 focus:ring-2 focus:ring-indigo-400/30 transition-all backdrop-blur"
        />
      </div>
      {/* Optional fields */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <input
          type="text"
          name="budzet"
          placeholder="Budżet (opcjonalnie)"
          className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur"
        />
        <input
          type="text"
          name="branza"
          placeholder="Branża (opcjonalnie)"
          className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur"
        />
        <input
          type="text"
          name="cel"
          placeholder="Cel (opcjonalnie)"
          className="col-span-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white/12 transition-all backdrop-blur sm:col-span-1"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-indigo-500 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all hover:bg-indigo-400 hover:-translate-y-0.5"
        >
          Znajdź lub stwórz agenta →
        </button>
        <Link
          href="/agents"
          className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
        >
          lub przeglądaj katalog →
        </Link>
      </div>
    </form>
  );
}
