# Giełda Agentów AI

Marketplace agentów AI dla polskich firm i freelancerów. Użytkownicy mogą przeglądać, uruchamiać i kupować dostęp do gotowych agentów opartych na GPT-4o mini. Twórcy mogą publikować własnych agentów z modelem FREE / ONE_TIME / SUBSCRIPTION / PAY_PER_USE.

## Wymagania

- Node.js 20+
- npm 10+
- PostgreSQL (lokalnie lub Neon / Supabase)

## Instalacja

### A) Masz już projekt lokalnie

```powershell
cd C:\Dev\gieldaagentowai
npm install
```

### B) Świeży klon repo

Sklonuj repozytorium i przejdź do katalogu projektu, następnie:

```powershell
npm install
```

## Konfiguracja środowiska

Skopiuj plik przykładowy i uzupełnij wartości:

```powershell
Copy-Item .env.example .env.local
```

Szczegóły każdej zmiennej są opisane w `.env.example`.

**Wymagane do uruchomienia:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

**Wymagane do uruchamiania agentów:** `OPENAI_API_KEY`

**Wymagane do płatności:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Opcjonalne (email):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Baza danych

```powershell
# Zastosuj migracje
npx prisma migrate deploy

# Wygeneruj klienta Prisma
npx prisma generate

# Załaduj dane testowe (51 agentów + 3 konta)
npx prisma db seed
```

## Uruchomienie lokalnie

```powershell
npm run dev
```

Aplikacja działa na [http://localhost:3000](http://localhost:3000).

## Konta testowe (po seedzie)

| Rola    | Email              | Hasło       |
|---------|--------------------|-------------|
| ADMIN   | admin@gaai.local   | Admin123!   |
| CREATOR | creator@gaai.local | Creator123! |
| USER    | user@gaai.local    | User123!    |

## Co nie działa bez poszczególnych serwisów

| Funkcja                             | Wymaga                  |
|-------------------------------------|-------------------------|
| Uruchamianie agentów                | `OPENAI_API_KEY`        |
| Checkout (ONE_TIME / SUBSCRIPTION)  | `STRIPE_SECRET_KEY`     |
| Webhook Stripe (potwierdzenia)      | `STRIPE_WEBHOOK_SECRET` |
| Reset hasła, emaile do admina       | `SMTP_HOST` + SMTP_*    |

> **PAY_PER_USE** jest w trybie SAFE MODE — zakup kredytów jest zablokowany, darmowe uruchomienia działają bez Stripe.
