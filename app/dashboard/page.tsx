import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Role = "USER" | "CREATOR" | "ADMIN";
type SessionUser = { id: string; email: string | null; role: Role };

function readSessionUser(session: unknown): SessionUser | null {
  if (!session || typeof session !== "object") return null;
  const s = session as { user?: unknown };
  const u = s.user;
  if (!u || typeof u !== "object") return null;
  const uu = u as { id?: unknown; email?: unknown; role?: unknown };

  if (typeof uu.id !== "string") return null;

  const role = uu.role;
  if (role !== "USER" && role !== "CREATOR" && role !== "ADMIN") return null;

  const email = typeof uu.email === "string" ? uu.email : null;
  return { id: uu.id, email, role };
}

async function submitForApprovalAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "CREATOR") return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  // tylko właściciel + tylko DRAFT -> PENDING
  await prisma.agent.updateMany({
    where: { id, creatorId: user.id, status: "DRAFT" },
    data: { status: "PENDING" }
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/");
}

export default async function DashboardPage() {
  const session = await getSession();
  const user = readSessionUser(session);

  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "USER") redirect("/");

  const agents = await prisma.agent.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, status: true, createdAt: true, updatedAt: true }
  });

  return (
    <main>
      <h1>Dashboard twórcy</h1>
      <p>Zalogowany: {user.email ?? "-"}</p>
      <SignOutButton />

      <p>
        <Link href="/dashboard/new">+ Nowy agent</Link>
      </p>

      <h2>Twoi agenci</h2>

      {agents.length === 0 ? (
        <p>Brak agentów.</p>
      ) : (
        <ul>
          {agents.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{a.name}</strong> — {a.status} — <Link href={`/agents/${a.slug}`}>Podgląd</Link>
              </div>

              {a.status === "DRAFT" ? (
                <form action={submitForApprovalAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit">Wyślij do akceptacji → PENDING</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link href="/">Powrót do katalogu</Link>
      </p>
    </main>
  );
}