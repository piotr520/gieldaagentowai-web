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

    // Pobierz sesję żeby sprawdzić rolę
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;

    if (role === "ADMIN") router.push("/admin");
    else if (role === "CREATOR") router.push("/dashboard");
    else router.push("/");

    router.refresh();
  }

  return (
    <main>
      <h1>Logowanie</h1>

      {registered ? (
        <p style={{ color: "green" }}>
          Konto zostało utworzone. Możesz się zalogować.
        </p>
      ) : null}

      <form onSubmit={onSubmit}>
        <div>
          <label>
            Email<br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
        </div>

        <div>
          <label>
            Hasło<br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </div>

        {error ? <p style={{ color: "red" }}>{error}</p> : null}
      </form>

      <p>
        Nie masz konta? <Link href="/register">Zarejestruj się</Link>
      </p>
      <p>
        <Link href="/">Powrót do strony głównej</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
