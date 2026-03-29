"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const BENEFITS = [
  "Prosty formularz tworzenia agenta",
  "Akceptacja przez administratora w ciągu 24h",
  "Automatyczne płatności przez Stripe (karta, BLIK, Przelewy24)",
  "Modele FREE, jednorazowy i subskrypcja",
  "Statystyki uruchomień w panelu twórcy",
];

export default function BecomeCreatorPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = session?.user?.role;
  const alreadyCreator = role === "CREATOR" || role === "ADMIN";

  async function handleActivate() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/become-creator", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Wystąpił błąd.");
        return;
      }

      // Refresh session token so new role is reflected
      await update();
      router.push("/dashboard");
    } catch {
      setError("Nie udało się połączyć z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        {/* Left: benefits */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            Dla twórców AI
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900">
            Zostań twórcą<br />
            <span className="text-indigo-600">i zarabiaj na AI</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Opublikuj swojego agenta AI na Giełdzie i dotrzyj do tysięcy użytkowników.
            Każde uruchomienie to przychód — bez obsługi płatności, bez infrastruktury.
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: CTA panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {alreadyCreator ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">✅</div>
              <h2 className="text-xl font-extrabold text-slate-900">Jesteś już twórcą!</h2>
              <p className="mt-2 text-sm text-slate-500">Przejdź do panelu, aby zarządzać swoimi agentami.</p>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                Przejdź do dashboardu →
              </Link>
            </div>
          ) : status === "unauthenticated" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🔒</div>
              <h2 className="text-xl font-extrabold text-slate-900">Zaloguj się najpierw</h2>
              <p className="mt-2 text-sm text-slate-500">Musisz mieć konto, aby zostać twórcą.</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={() => signIn(undefined, { callbackUrl: "/become-creator" })}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Zaloguj się
                </button>
                <Link
                  href="/register"
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
                >
                  Zarejestruj się za darmo
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">🚀</div>
              <h2 className="text-xl font-extrabold text-slate-900">Aktywuj konto twórcy</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Jeden klik — od razu możesz tworzyć i publikować agentów AI.
              </p>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                onClick={handleActivate}
                disabled={loading || status === "loading"}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? "Aktywowanie..." : "Aktywuj konto twórcy →"}
              </button>

              <p className="mt-4 text-xs text-slate-400">
                Bezpłatne. Możesz wrócić do konta zwykłego użytkownika w ustawieniach.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
