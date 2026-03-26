"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (!res || res.error) {
      setError("Nieprawidłowy email lub hasło.");
      setLoading(false);
      return;
    }

    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;

    if (role === "ADMIN") router.push("/admin");
    else if (role === "CREATOR") router.push("/dashboard");
    else router.push("/");

    router.refresh();
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
        <div>
          <blockquote className="text-slate-300">
            <p className="text-lg leading-relaxed">
              &ldquo;Dzięki Giełdzie Agentów AI skróciłem czas tworzenia ofert handlowych o 80%.
              Polecam każdemu, kto chce automatyzować swoje procesy.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-slate-500">
              — Jan Kowalski, Dyrektor Sprzedaży
            </footer>
          </blockquote>
        </div>
        <p className="text-xs text-slate-600">© 2026 Giełda Agentów AI</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Witaj z powrotem</h1>
            <p className="mt-1 text-sm text-slate-500">Zaloguj się do swojego konta</p>
          </div>

          {registered && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ Konto zostało utworzone. Możesz się zalogować.
            </div>
          )}

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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Nie masz konta?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Zarejestruj się za darmo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
