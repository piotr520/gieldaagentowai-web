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

async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

async function approveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "ADMIN") return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.agent.update({
    where: { id },
    data: { status: "PUBLISHED" }
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

async function rejectAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "ADMIN") return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.agent.update({
    where: { id },
    data: { status: "HIDDEN" }
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export default async function AdminPage() {
  const user = await requireAdmin();

  const pending = await prisma.agent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      createdAt: true,
      creator: { select: { email: true } }
    }
  });

  return (
    <main>
      <h1>Panel admina</h1>
      <p>Zalogowany: {user.email ?? "-"}</p>
      <SignOutButton />

      <h2>Do akceptacji (PENDING)</h2>

      {pending.length === 0 ? (
        <p>Brak pozycji do akceptacji.</p>
      ) : (
        <ul>
          {pending.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{a.name}</strong> ({a.slug}) — {a.category} — twórca: {a.creator.email}
              </div>

              <div>
                <form action={approveAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit">Approve → PUBLISHED</button>
                </form>{" "}
                <form action={rejectAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit">Reject → HIDDEN</button>
                </form>{" "}
                <Link href={`/agents/${a.slug}`}>Podgląd</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link href="/dashboard">Dashboard twórcy</Link> | <Link href="/">Katalog</Link>
      </p>
    </main>
  );
}