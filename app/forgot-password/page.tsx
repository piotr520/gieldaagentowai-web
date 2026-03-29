"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Podaj adres email."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Wystąpił błąd."); return; }
      setSent(true);
    } catch {
      setError("Nie udało się połączyć z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Reset hasła</h1>
          <p className="mt-2 text-sm text-slate-500">
            Podaj adres email, a wyślemy link do ustawienia nowego hasła.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl">
              ✉️
            </div>
            <p className="font-bold text-emerald-800">Sprawdź skrzynkę!</p>
            <p className="mt-1 text-sm text-emerald-700">
              Jeśli podany email jest zarejestrowany, wysłaliśmy link do resetu hasła.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              ← Wróć do logowania
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Adres email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ty@przykład.pl"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
            </button>

            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                ← Wróć do logowania
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
