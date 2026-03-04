import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SignOutButton from "@/components/SignOutButton";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const u = session.user as any;
  if (u.role !== "ADMIN") redirect("/");
  return session;
}

async function approveAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const u = session?.user as any;
  if (!session?.user || u.role !== "ADMIN") return;

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
  const u = session?.user as any;
  if (!session?.user || u.role !== "ADMIN") return;

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
  const session = await requireAdmin();

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
      <p>Zalogowany: {session.user.email}</p>
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
                </form>

                {" "}

                <form action={rejectAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit">Reject → HIDDEN</button>
                </form>

                {" "}

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