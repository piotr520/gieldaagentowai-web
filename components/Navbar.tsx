"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        pathname === href
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-indigo-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" fill="white" opacity="0.9" />
              <path d="M12 6L18 9.5V16.5L12 20L6 16.5V9.5L12 6Z" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 hidden sm:block">Giełda Agentów AI</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navLink("/agents", "Marketplace")}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!session ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors md:block"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500 transition-all"
              >
                Zarejestruj się
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-1">
              {role === "ADMIN" && (
                <span className="hidden md:block">{navLink("/admin", "Admin")}</span>
              )}
              {role === "CREATOR" && (
                <span className="hidden md:block">{navLink("/dashboard", "Dashboard")}</span>
              )}
              {role === "USER" && (
                <span className="hidden md:block">{navLink("/become-creator", "Zostań twórcą")}</span>
              )}
              <span className="hidden md:block">{navLink("/account", "Konto")}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm md:block"
              >
                Wyloguj
              </button>
            </div>
          )}

          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Otwórz menu"
          >
            {open ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
                <path d="M0 1h15M0 6h15M0 11h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <Link href="/agents" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Marketplace
            </Link>
            {!session ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">Zaloguj się</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="mt-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-center font-semibold text-white">Zarejestruj się</Link>
              </>
            ) : (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">Konto</Link>
                {role === "CREATOR" && <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">Dashboard</Link>}
                {role === "USER" && <Link href="/become-creator" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">Zostań twórcą</Link>}
                {role === "ADMIN" && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">Admin</Link>}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-xl px-3 py-2.5 text-left font-medium text-slate-700 hover:bg-slate-50 transition-colors">Wyloguj</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
