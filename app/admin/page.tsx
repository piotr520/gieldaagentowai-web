import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAgentApprovedEmail, sendAgentRejectedEmail } from "@/lib/email";

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
  const agent = await prisma.agent.update({
    where: { id },
    data: { status: "PUBLISHED", rejectionReason: null },
    select: { name: true, slug: true, creator: { select: { email: true } } },
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
  if (agent.creator.email) {
    sendAgentApprovedEmail(agent.creator.email, agent.name, agent.slug).catch(() => {});
  }
}

async function rejectAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const user = readSessionUser(session);
  if (!user || user.role !== "ADMIN") return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const reason = String(formData.get("reason") || "").trim() || null;
  const agent = await prisma.agent.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason },
    select: { name: true, creator: { select: { email: true } } },
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
  if (agent.creator.email) {
    sendAgentRejectedEmail(agent.creator.email, agent.name, reason).catch(() => {});
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  Biznes: "💼", Marketing: "📢", HR: "👥", "E-commerce": "🛒",
  Prawo: "⚖️", IT: "💻", Edukacja: "📚", Budownictwo: "🏗️",
  Finanse: "💰", Zdrowie: "🏥",
};

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
      creator: { select: { email: true } },
    },
  });

  const [allCount, publishedCount, userCount] = await Promise.all([
    prisma.agent.count(),
    prisma.agent.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Panel admina</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email ?? "-"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Dashboard twórcy
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Katalog
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">Do akceptacji</p>
          <p className="text-3xl font-extrabold text-amber-700">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Wszyscy agenci</p>
          <p className="text-3xl font-extrabold text-slate-900">{allCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 mb-1">Opublikowanych</p>
          <p className="text-3xl font-extrabold text-emerald-700">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-1">Użytkownicy</p>
          <p className="text-3xl font-extrabold text-indigo-700">{userCount}</p>
        </div>
      </div>

      {/* Pending list */}
      <div>
        <h2 className="mb-4 text-xl font-extrabold text-slate-900">Do akceptacji (PENDING)</h2>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-3xl">✅</div>
            <p className="font-bold text-slate-800 text-lg">Brak pozycji do akceptacji</p>
            <p className="mt-1.5 text-sm text-slate-500">Wszystkie zgłoszenia zostały rozpatrzone.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((agent) => {
              const icon = CATEGORY_ICONS[agent.category] ?? "🤖";
              return (
                <div key={agent.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-xl">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{agent.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {agent.category} · {agent.slug}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Twórca: <span className="font-medium text-slate-600">{agent.creator.email}</span>
                          {" · "}Zgłoszono: {agent.createdAt.toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/agents/${agent.slug}`}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Podgląd
                    </Link>
                  </div>

                  {/* Reject form with reason */}
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                    <form action={rejectAction} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={agent.id} />
                      <textarea
                        name="reason"
                        rows={2}
                        placeholder="Powód odrzucenia (opcjonalnie) — twórca zobaczy ten komunikat"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          ✗ Odrzuć → REJECTED
                        </button>
                        <form action={approveAction}>
                          <input type="hidden" name="id" value={agent.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                          >
                            ✓ Zatwierdź → PUBLISHED
                          </button>
                        </form>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
