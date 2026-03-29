import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { AgentDraftFiller } from "@/components/AgentDraftFiller";

const CATEGORIES = [
  "Biznes", "Marketing", "HR", "E-commerce", "Budownictwo",
  "Prawo", "IT", "Edukacja", "Finanse", "Zdrowie",
] as const;

type Role = "ADMIN" | "CREATOR";
type SessionUser = { id: string; email: string | null; role: Role };

function readSessionUser(session: unknown): SessionUser | null {
  if (!session || typeof session !== "object") return null;
  const s = session as { user?: unknown };
  const u = s.user;
  if (!u || typeof u !== "object") return null;
  const uu = u as { id?: unknown; email?: unknown; role?: unknown };
  if (typeof uu.id !== "string") return null;
  const role = uu.role;
  if (role !== "ADMIN" && role !== "CREATOR") return null;
  const email = typeof uu.email === "string" ? uu.email : null;
  return { id: uu.id, email, role };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await prisma.agent.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

async function createAgentAction(formData: FormData) {
  "use server";

  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "CREATOR") redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const pricingType = String(formData.get("pricingType") ?? "FREE").trim() as
    | "FREE" | "ONE_TIME" | "SUBSCRIPTION";
  const pricingLabel = String(formData.get("pricingLabel") ?? "").trim();
  const pricingAmountPlnRaw = formData.get("pricingAmountPln");
  const pricingAmountPlnPerMonthRaw = formData.get("pricingAmountPlnPerMonth");
  const description = String(formData.get("description") ?? "").trim();
  const limitationsRaw = String(formData.get("limitations") ?? "").trim();
  const exampleInput = String(formData.get("exampleInput") ?? "").trim();
  const exampleOutput = String(formData.get("exampleOutput") ?? "").trim();

  if (!name || !tagline || !category || !pricingLabel || !description) {
    redirect("/dashboard/new?error=missing");
  }

  const limitations = limitationsRaw
    ? limitationsRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const examples =
    exampleInput && exampleOutput
      ? [{ input: exampleInput, output: exampleOutput }]
      : [];

  const baseSlug = toSlug(name);
  const slug = await uniqueSlug(baseSlug);
  const today = new Date().toISOString().slice(0, 10);

  await prisma.agent.create({
    data: {
      slug,
      name,
      tagline,
      category,
      pricingType,
      pricingLabel,
      pricingAmountPln:
        pricingType === "ONE_TIME" && pricingAmountPlnRaw
          ? Number(pricingAmountPlnRaw)
          : null,
      pricingAmountPlnPerMonth:
        pricingType === "SUBSCRIPTION" && pricingAmountPlnPerMonthRaw
          ? Number(pricingAmountPlnPerMonthRaw)
          : null,
      description,
      limitationsJson: JSON.stringify(limitations),
      examplesJson: JSON.stringify(examples),
      status: "DRAFT",
      lastUpdated: today,
      creatorId: user.id,
    },
  });

  redirect(`/dashboard?created=${slug}`);
}

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prefill_desc?: string; prefill_branza?: string; prefill_cel?: string }>;
}) {
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const params = await searchParams;
  const hasError = params.error === "missing";
  const prefillDesc = params.prefill_desc ?? "";
  const prefillBranza = params.prefill_branza ?? "";
  const prefillCel = params.prefill_cel ?? "";
  const hasPrefill = !!(prefillDesc || prefillBranza || prefillCel);

  // Build prefilled description
  const prefilledDescription = [
    prefillDesc,
    prefillBranza ? `Branża: ${prefillBranza}` : "",
    prefillCel ? `Cel: ${prefillCel}` : "",
  ].filter(Boolean).join("\n\n");

  // Best matching category from branza
  const BRANZA_TO_CATEGORY: Record<string, string> = {
    hr: "HR", marketing: "Marketing", prawo: "Prawo", finanse: "Finanse",
    it: "IT", edukacja: "Edukacja", budownictwo: "Budownictwo",
    "e-commerce": "E-commerce", ecommerce: "E-commerce", zdrowie: "Zdrowie",
  };
  const suggestedCategory = BRANZA_TO_CATEGORY[prefillBranza.toLowerCase()] ?? "";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900">Nowy agent</h1>
        <p className="mt-1.5 text-sm text-slate-500">Wypełnij formularz i wyślij agenta do akceptacji.</p>
      </div>

      {/* Prefill banner */}
      {hasPrefill && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">✦</span>
          <div>
            <p className="text-sm font-bold text-indigo-800">Tworzysz agenta na podstawie zapytania użytkownika</p>
            <p className="mt-0.5 text-xs text-indigo-600 leading-relaxed">
              Pola zostały wstępnie wypełnione na podstawie Twojego opisu. Możesz je edytować przed zapisem.
            </p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="text-red-500">⚠</span>
          Wypełnij wszystkie wymagane pola.
        </div>
      )}

      <AgentDraftFiller
        action={createAgentAction}
        hasPrefill={hasPrefill}
        prefillDesc={prefillDesc}
        prefillBranza={prefillBranza}
        prefillCel={prefillCel}
        initialCategory={suggestedCategory}
      >
        {/* Basic info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Podstawowe informacje</h2>
          <Input
            label="Nazwa agenta"
            name="name"
            type="text"
            required
            maxLength={120}
            placeholder="np. Asystent HR do rekrutacji"
          />
          <Input
            label="Tagline (krótki opis)"
            name="tagline"
            type="text"
            required
            maxLength={200}
            placeholder="Jedno zdanie opisujące agenta"
          />
          <Select label="Kategoria" name="category" required defaultValue={suggestedCategory}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Textarea
            label="Opis agenta"
            name="description"
            required
            rows={5}
            placeholder="Szczegółowy opis tego, co agent robi, jak działa i dla kogo jest przeznaczony..."
            defaultValue={prefilledDescription}
          />
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Model cenowy</h2>
          <Select label="Typ ceny" name="pricingType">
            <option value="FREE">Darmowy</option>
            <option value="ONE_TIME">Jednorazowy</option>
            <option value="SUBSCRIPTION">Subskrypcja</option>
          </Select>
          <Input
            label="Etykieta ceny"
            name="pricingLabel"
            type="text"
            required
            maxLength={80}
            placeholder='np. "Darmowy", "99 zł", "49 zł/mies."'
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kwota jednorazowa (PLN)"
              name="pricingAmountPln"
              type="number"
              min={0}
              placeholder="np. 99"
              hint="Tylko dla modelu jednorazowego"
            />
            <Input
              label="Kwota miesięczna (PLN)"
              name="pricingAmountPlnPerMonth"
              type="number"
              min={0}
              placeholder="np. 49"
              hint="Tylko dla subskrypcji"
            />
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Szczegóły i przykłady</h2>
          <Textarea
            label="Ograniczenia"
            name="limitations"
            rows={3}
            placeholder="Każde ograniczenie w nowej linii..."
            hint="Opcjonalne — jeden punkt per linia"
          />
          <Input
            label="Przykład — dane wejściowe"
            name="exampleInput"
            type="text"
            placeholder="Przykładowe zapytanie użytkownika"
            hint="Opcjonalne"
          />
          <Textarea
            label="Przykład — wynik"
            name="exampleOutput"
            rows={3}
            placeholder="Oczekiwana odpowiedź agenta..."
            hint="Opcjonalne"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Anuluj
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
          >
            Zapisz jako szkic
          </button>
        </div>
      </AgentDraftFiller>
    </main>
  );
}
