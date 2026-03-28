import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/Badge";

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

  await prisma.agent.updateMany({
    where: { id, creatorId: user.id, status: { in: ["DRAFT", "REJECTED"] } },
    data: { status: "PENDING" },
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
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      category: true,
      runsCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalRuns = agents.reduce((acc, a) => acc + a.runsCount, 0);
  const published = agents.filter((a) => a.status === "PUBLISHED").length;
  const pending = agents.filter((a) => a.status === "PENDING").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard twórcy</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email ?? "-"}</p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          + Nowy agent
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-medium text-indigo-600">Łączne uruchomienia</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{totalRuns.toLocaleString("pl-PL")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Wszyscy agenci</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{agents.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Opublikowanych</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{published}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Oczekuje</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p>
        </div>
      </div>

      {/* Agents list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Twoi agenci</h2>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl">🤖</div>
            <p className="font-semibold text-slate-800">Brak agentów</p>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">Stwórz pierwszego agenta i wyślij go do akceptacji.</p>
            <Link
              href="/dashboard/new"
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              + Nowy agent
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border bg-white p-5 ${
                  a.status === "REJECTED" ? "border-red-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{a.name}</h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.category} · ⚡ {a.runsCount.toLocaleString("pl-PL")} uruchomień ·{" "}
                      {new Date(a.updatedAt).toLocaleDateString("pl-PL")}
                    </p>
                    {a.status === "REJECTED" && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Agent odrzucony przez administratora. Popraw go i wyślij ponownie.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/agents/${a.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Podgląd
                    </Link>
                    {(a.status === "DRAFT" || a.status === "REJECTED") && (
                      <form action={submitForApprovalAction} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                          {a.status === "REJECTED" ? "Wyślij ponownie" : "Wyślij do akceptacji"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
