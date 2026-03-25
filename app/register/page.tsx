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
    <main>
      <h1>Rejestracja</h1>

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
            Hasło (min. 8 znaków)<br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
        </div>

        <div>
          <label>
            Powtórz hasło<br />
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
        </div>

        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </button>
        </div>

        {error ? <p style={{ color: "red" }}>{error}</p> : null}
      </form>

      <p>
        Masz już konto? <Link href="/login">Zaloguj się</Link>
      </p>
      <p>
        <Link href="/">Powrót do strony głównej</Link>
      </p>
    </main>
  );
}
