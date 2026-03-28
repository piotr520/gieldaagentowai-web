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
    data: { status: "PENDING" }
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/");
}

const CATEGORY_ICONS: Record<string, string> = {
  Biznes: "💼", Marketing: "📢", HR: "👥", "E-commerce": "🛒",
  Prawo: "⚖️", IT: "💻", Edukacja: "📚", Budownictwo: "🏗️",
  Finanse: "💰", Zdrowie: "🏥",
};

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
      createdAt: true,
      updatedAt: true,
      runsCount: true,
    }
  });

  const totalRuns = agents.reduce((sum, a) => sum + a.runsCount, 0);
  const published = agents.filter((a) => a.status === "PUBLISHED").length;
  const pending = agents.filter((a) => a.status === "PENDING").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Dashboard twórcy</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email ?? "-"}</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nowy agent
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-1">Łączne uruchomienia</p>
          <p className="text-3xl font-extrabold text-indigo-700">{totalRuns.toLocaleString("pl-PL")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Wszyscy agenci</p>
          <p className="text-3xl font-extrabold text-slate-900">{agents.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 mb-1">Opublikowanych</p>
          <p className="text-3xl font-extrabold text-emerald-700">{published}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">Oczekuje</p>
          <p className="text-3xl font-extrabold text-amber-700">{pending}</p>
        </div>
      </div>

      {/* Agent list */}
      <div>
        <h2 className="mb-4 text-xl font-extrabold text-slate-900">Twoi agenci</h2>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-3xl">🤖</div>
            <p className="font-bold text-slate-800 text-lg">Brak agentów</p>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">Stwórz swojego pierwszego agenta i zacznij zarabiać.</p>
            <Link
              href="/dashboard/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              + Nowy agent
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const icon = CATEGORY_ICONS[agent.category] ?? "🤖";
              const isRejected = agent.status === "REJECTED";
              return (
                <div
                  key={agent.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                    isRejected ? "border-red-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-lg">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{agent.name}</span>
                          <StatusBadge status={agent.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {agent.category} · Zaktualizowano: {agent.updatedAt.toLocaleDateString("pl-PL")}
                        </p>
                        {isRejected && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600">
                            Agent odrzucony — popraw i wyślij ponownie
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 mr-2">
                        ⚡ {agent.runsCount.toLocaleString("pl-PL")}
                      </span>
                      <Link
                        href={`/agents/${agent.slug}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Podgląd
                      </Link>
                      {(agent.status === "DRAFT" || agent.status === "REJECTED") && (
                        <>
                          <Link
                            href={`/dashboard/${agent.slug}/edit`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Edytuj
                          </Link>
                          <form action={submitForApprovalAction}>
                          <input type="hidden" name="id" value={agent.id} />
                          <button
                            type="submit"
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                              isRejected
                                ? "bg-red-600 hover:bg-red-500"
                                : "bg-indigo-600 hover:bg-indigo-500"
                            }`}
                          >
                            {isRejected ? "Wyślij ponownie →" : "Wyślij do akceptacji →"}
                          </button>
                          </form>
                        </>
                      )}
                    </div>
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
