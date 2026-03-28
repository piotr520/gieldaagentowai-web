import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Input, Textarea, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

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

async function updateAgentAction(formData: FormData) {
  "use server";

  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "CREATOR") redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/dashboard");

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
    const agent = await prisma.agent.findFirst({ where: { id, creatorId: user.id }, select: { slug: true } });
    if (agent) redirect(`/dashboard/${agent.slug}/edit?error=missing`);
    redirect("/dashboard");
  }

  const limitations = limitationsRaw
    ? limitationsRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const examples =
    exampleInput && exampleOutput
      ? [{ input: exampleInput, output: exampleOutput }]
      : [];

  const today = new Date().toISOString().slice(0, 10);

  await prisma.agent.updateMany({
    where: {
      id,
      creatorId: user.id,
      status: { in: ["DRAFT", "REJECTED"] },
    },
    data: {
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
      lastUpdated: today,
    },
  });

  redirect("/dashboard");
}

export default async function EditAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const { slug } = await params;
  const sp = await searchParams;
  const hasError = sp.error === "missing";

  const agent = await prisma.agent.findFirst({
    where: { slug, creatorId: user.id },
    select: {
      id: true,
      name: true,
      tagline: true,
      category: true,
      description: true,
      pricingType: true,
      pricingLabel: true,
      pricingAmountPln: true,
      pricingAmountPlnPerMonth: true,
      limitationsJson: true,
      examplesJson: true,
      status: true,
    },
  });

  if (!agent) notFound();

  // Tylko DRAFT i REJECTED można edytować
  if (agent.status !== "DRAFT" && agent.status !== "REJECTED") {
    redirect("/dashboard");
  }

  const limitations: string[] = JSON.parse(agent.limitationsJson || "[]");
  const examples: { input: string; output: string }[] = JSON.parse(agent.examplesJson || "[]");
  const firstExample = examples[0] ?? { input: "", output: "" };

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
        <h1 className="text-3xl font-extrabold text-slate-900">Edytuj agenta</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Możesz edytować agentów ze statusem{" "}
          <span className="font-medium text-slate-700">Szkic</span> lub{" "}
          <span className="font-medium text-red-600">Odrzucony</span>.
        </p>
      </div>

      {hasError && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="text-red-500">⚠</span>
          Wypełnij wszystkie wymagane pola.
        </div>
      )}

      {agent.status === "REJECTED" && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span>⚠</span>
          Agent został odrzucony przez administratora. Popraw go i wyślij ponownie z dashboardu.
        </div>
      )}

      <form action={updateAgentAction} className="space-y-6">
        <input type="hidden" name="id" value={agent.id} />

        {/* Basic info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Podstawowe informacje</h2>
          <Input
            label="Nazwa agenta"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={agent.name}
            placeholder="np. Asystent HR do rekrutacji"
          />
          <Input
            label="Tagline (krótki opis)"
            name="tagline"
            type="text"
            required
            maxLength={200}
            defaultValue={agent.tagline}
            placeholder="Jedno zdanie opisujące agenta"
          />
          <Select label="Kategoria" name="category" required defaultValue={agent.category}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Textarea
            label="Opis agenta"
            name="description"
            required
            rows={5}
            defaultValue={agent.description}
            placeholder="Szczegółowy opis tego, co agent robi, jak działa i dla kogo jest przeznaczony..."
          />
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Model cenowy</h2>
          <Select label="Typ ceny" name="pricingType" defaultValue={agent.pricingType}>
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
            defaultValue={agent.pricingLabel}
            placeholder='np. "Darmowy", "99 zł", "49 zł/mies."'
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kwota jednorazowa (PLN)"
              name="pricingAmountPln"
              type="number"
              min={0}
              defaultValue={agent.pricingAmountPln ?? ""}
              placeholder="np. 99"
              hint="Tylko dla modelu jednorazowego"
            />
            <Input
              label="Kwota miesięczna (PLN)"
              name="pricingAmountPlnPerMonth"
              type="number"
              min={0}
              defaultValue={agent.pricingAmountPlnPerMonth ?? ""}
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
            defaultValue={limitations.join("\n")}
            placeholder="Każde ograniczenie w nowej linii..."
            hint="Opcjonalne — jeden punkt per linia"
          />
          <Input
            label="Przykład — dane wejściowe"
            name="exampleInput"
            type="text"
            defaultValue={firstExample.input}
            placeholder="Przykładowe zapytanie użytkownika"
            hint="Opcjonalne"
          />
          <Textarea
            label="Przykład — wynik"
            name="exampleOutput"
            rows={3}
            defaultValue={firstExample.output}
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
            Zapisz zmiany
          </button>
        </div>
      </form>
    </main>
  );
}
