import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  await prisma.agent.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export default async function AdminPage() {
  const user = await requireAdmin();

  const [pending, allAgents, allUsers] = await Promise.all([
    prisma.agent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, slug: true, category: true,
        tagline: true, createdAt: true, creator: { select: { email: true } },
      },
    }),
    prisma.agent.count(),
    prisma.user.count(),
  ]);

  const published = await prisma.agent.count({ where: { status: "PUBLISHED" } });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel administracyjny</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email ?? "-"}</p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          ← Katalog
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium text-amber-600">Do akceptacji</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Wszyscy agenci</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{allAgents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Opublikowanych</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{published}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Użytkownicy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{allUsers}</p>
        </div>
      </div>

      {/* Pending agents */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Oczekuje na akceptację
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl">✅</div>
            <p className="font-semibold text-slate-800">Wszystko zaktualizowane</p>
            <p className="mt-1.5 text-sm text-slate-500">Brak agentów oczekujących na akceptację.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{a.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{a.category}</span>
                    </div>
                    {a.tagline && (
                      <p className="mt-1 text-sm text-slate-600">{a.tagline}</p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                      Twórca: {a.creator.email} · {new Date(a.createdAt).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                  <Link
                    href={`/agents/${a.slug}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    target="_blank"
                  >
                    Podgląd ↗
                  </Link>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                  <form action={approveAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700"
                    >
                      ✓ Zatwierdź → PUBLISHED
                    </button>
                  </form>
                  <form action={rejectAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-100"
                    >
                      ✗ Odrzuć → REJECTED
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
