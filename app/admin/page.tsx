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
  await prisma.agent.update({ where: { id }, data: { status: "PUBLISHED" } });
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
  await prisma.agent.update({ where: { id }, data: { status: "HIDDEN" } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export default async function AdminPage() {
  const user = await requireAdmin();

  const pending = await prisma.agent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, slug: true, category: true, createdAt: true,
      creator: { select: { email: true } },
    },
  });

  const stats = await prisma.agent.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const statsMap = Object.fromEntries(stats.map((s) => [s.status, s._count.id]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel admina</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Opublikowane", key: "PUBLISHED", color: "text-green-600" },
          { label: "Oczekujące", key: "PENDING", color: "text-amber-600" },
          { label: "Szkice", key: "DRAFT", color: "text-slate-600" },
          { label: "Ukryte", key: "HIDDEN", color: "text-red-600" },
        ].map((s) => (
          <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{statsMap[s.key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Pending agents */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Do akceptacji
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl">✅</div>
            <p className="font-medium text-slate-700">Wszystko przejrzane</p>
            <p className="mt-1 text-sm text-slate-500">Brak agentów oczekujących na akceptację.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{a.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{a.category}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Twórca: <span className="font-medium">{a.creator.email}</span>
                      {" · "}
                      {new Date(a.createdAt).toLocaleDateString("pl-PL")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/agents/${a.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Podgląd
                    </Link>
                    <form action={rejectAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Odrzuć
                      </button>
                    </form>
                    <form action={approveAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        Zatwierdź
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">← Strona główna</Link>
      </div>
    </main>
  );
}
