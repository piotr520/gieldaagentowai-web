"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Błąd rejestracji.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="grid min-h-[calc(100vh-57px)] lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden flex-col justify-between bg-slate-900 p-12 lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Giełda Agentów AI</span>
          </div>
        </div>
        <div className="space-y-6">
          {[
            { icon: "⚡", text: "3 darmowe uruchomienia każdego agenta" },
            { icon: "🤖", text: "Dostęp do dziesiątek agentów AI" },
            { icon: "💾", text: "Historia uruchomień zapisana na koncie" },
            { icon: "🚀", text: "Brak konfiguracji — gotowe od razu" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-slate-300">{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600">© 2026 Giełda Agentów AI</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Utwórz konto</h1>
            <p className="mt-1 text-sm text-slate-500">Dołącz do tysięcy użytkowników</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="jan@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Hasło <span className="text-slate-400">(min. 8 znaków)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Powtórz hasło</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Tworzenie konta..." : "Zarejestruj się za darmo"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
