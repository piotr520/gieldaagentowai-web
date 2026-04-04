"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            ← Giełda Agentów AI
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Utwórz konto</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Za chwilę możesz przeglądać i uruchamiać agentów AI.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="twoj@email.pl"
            />
            <Input
              label="Hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              hint="Minimum 8 znaków"
            />
            <Input
              label="Powtórz hasło"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="••••••••"
            />

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "Rejestracja..." : "Zarejestruj się za darmo"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Zaloguj się →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
