import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PurchaseSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const { session_id } = await searchParams;

  if (!session_id) redirect(`/agents/${slug}/run`);

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
          ✅
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Płatność zakończona!</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Dziękujemy za zakup. Twój dostęp do agenta został aktywowany.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Jeśli dostęp nie jest widoczny od razu, odśwież stronę za chwilę.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/agents/${slug}/run`}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:from-indigo-500 hover:to-violet-500"
          >
            Uruchom agenta →
          </Link>
          <Link
            href="/agents"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Wróć do katalogu
          </Link>
        </div>
      </div>
    </main>
  );
}
