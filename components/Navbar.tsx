"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">
            Giełda Agentów AI
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/agents" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Marketplace
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!session ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors md:block"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Zarejestruj się
              </Link>
            </>
          ) : (
            <>
              {role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors md:block"
                >
                  Admin
                </Link>
              )}
              {role === "CREATOR" && (
                <Link
                  href="/dashboard"
                  className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors md:block"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/account"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors md:block"
              >
                Moje konto
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Wyloguj
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm text-slate-700">
            <Link href="/agents" onClick={() => setMenuOpen(false)}>Marketplace</Link>
            {!session ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>Zaloguj się</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>Zarejestruj się</Link>
              </>
            ) : (
              <>
                <Link href="/account" onClick={() => setMenuOpen(false)}>Moje konto</Link>
                {role === "CREATOR" && <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
                {role === "ADMIN" && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left">Wyloguj</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
