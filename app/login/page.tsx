"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (!res || res.error) {
      setError("Nieprawidłowy email lub hasło.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main>
      <h1>Logowanie</h1>

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

        {error ? <p>{error}</p> : null}
      </form>

      <p>
        <Link href="/">Powrót do katalogu</Link>
      </p>
    </main>
  );
}