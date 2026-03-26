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
  await prisma.agent.updateMany({
    where: { id, creatorId: user.id, status: "DRAFT" },
    data: { status: "PENDING" },
  });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/");
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-green-50 text-green-700",
  HIDDEN: "bg-red-50 text-red-600",
  REJECTED: "bg-red-50 text-red-600",
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
    select: { id: true, name: true, slug: true, status: true, runsCount: true, createdAt: true },
  });

  const totalRuns = agents.reduce((sum, a) => sum + a.runsCount, 0);
  const published = agents.filter((a) => a.status === "PUBLISHED").length;
  const pending = agents.filter((a) => a.status === "PENDING").length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel twórcy</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + Nowy agent
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Agenty łącznie</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{agents.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Opublikowane</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{published}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Uruchomień łącznie</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{totalRuns}</p>
        </div>
      </div>

      {pending > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏳ Masz {pending} {pending === 1 ? "agenta" : "agentów"} oczekujących na akceptację.
        </div>
      )}

      {/* Agents list */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Twoi agenci</h2>

        {agents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">🤖</div>
            <p className="font-medium text-slate-700">Brak agentów</p>
            <p className="mt-1 text-sm text-slate-500">Stwórz pierwszego agenta i wyślij go do akceptacji</p>
            <Link href="/dashboard/new" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              + Nowy agent
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{a.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    ⚡ {a.runsCount} uruchomień · {new Date(a.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === "DRAFT" && (
                    <form action={submitForApprovalAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Wyślij do akceptacji
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/agents/${a.slug}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Podgląd
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
