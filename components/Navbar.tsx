"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Giełda Agentów AI
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/agents" className="text-neutral-600 hover:text-neutral-900">
            Agenci
          </Link>

          {!session ? (
            <>
              <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                Zaloguj
              </Link>
              <Link
                href="/register"
                className="rounded bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
              >
                Zarejestruj się
              </Link>
            </>
          ) : (
            <>
              {role === "ADMIN" && (
                <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
                  Panel admina
                </Link>
              )}
              {role === "CREATOR" && (
                <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
                  Dashboard
                </Link>
              )}
              <span className="text-neutral-400">{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Wyloguj
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
