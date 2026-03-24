import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  "Biznes",
  "Marketing",
  "HR",
  "E-commerce",
  "Budownictwo",
  "Prawo",
  "IT",
  "Edukacja",
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
    | "FREE"
    | "ONE_TIME"
    | "SUBSCRIPTION";
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

  redirect("/dashboard");
}

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const params = await searchParams;
  const hasError = params.error === "missing";

  return (
    <main>
      <h1>Nowy agent</h1>
      <p>
        <Link href="/dashboard">← Powrót do dashboardu</Link>
      </p>

      {hasError ? (
        <p style={{ color: "red" }}>
          Wypełnij wszystkie wymagane pola.
        </p>
      ) : null}

      <form action={createAgentAction}>
        <div>
          <label>
            Nazwa agenta *
            <br />
            <input type="text" name="name" required maxLength={120} />
          </label>
        </div>

        <div>
          <label>
            Tagline (krótki opis) *
            <br />
            <input type="text" name="tagline" required maxLength={200} />
          </label>
        </div>

        <div>
          <label>
            Kategoria *
            <br />
            <select name="category" required>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Model cenowy *
            <br />
            <select name="pricingType">
              <option value="FREE">Darmowy</option>
              <option value="ONE_TIME">Jednorazowy</option>
              <option value="SUBSCRIPTION">Subskrypcja</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Etykieta ceny * (np. &quot;Darmowy&quot;, &quot;99 zł&quot;, &quot;49 zł/mies.&quot;)
            <br />
            <input type="text" name="pricingLabel" required maxLength={80} />
          </label>
        </div>

        <div>
          <label>
            Kwota jednorazowa (PLN, opcjonalnie)
            <br />
            <input type="number" name="pricingAmountPln" min={0} />
          </label>
        </div>

        <div>
          <label>
            Kwota miesięczna (PLN, opcjonalnie)
            <br />
            <input type="number" name="pricingAmountPlnPerMonth" min={0} />
          </label>
        </div>

        <div>
          <label>
            Opis agenta *
            <br />
            <textarea name="description" required rows={6} cols={60} />
          </label>
        </div>

        <div>
          <label>
            Ograniczenia (każde w nowej linii)
            <br />
            <textarea name="limitations" rows={4} cols={60} />
          </label>
        </div>

        <div>
          <label>
            Przykład — dane wejściowe
            <br />
            <textarea name="exampleInput" rows={3} cols={60} />
          </label>
        </div>

        <div>
          <label>
            Przykład — wynik
            <br />
            <textarea name="exampleOutput" rows={3} cols={60} />
          </label>
        </div>

        <div>
          <button type="submit">Zapisz jako DRAFT</button>
        </div>
      </form>
    </main>
  );
}
