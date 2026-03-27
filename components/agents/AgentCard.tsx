import Link from "next/link";
import { PricingBadge, Badge } from "@/components/ui/Badge";

type AgentCardProps = {
  slug: string;
  name: string;
  tagline: string | null;
  category: string;
  pricingType: string;
  pricingLabel: string | null;
  runsCount: number;
  featured?: boolean;
  isNew?: boolean;
};

const CATEGORY_ICONS: Record<string, string> = {
  Biznes: "💼",
  Marketing: "📢",
  HR: "👥",
  "E-commerce": "🛒",
  Prawo: "⚖️",
  IT: "💻",
  Edukacja: "📚",
  Budownictwo: "🏗️",
  Finanse: "💰",
  Zdrowie: "🏥",
};

export function AgentCard({
  slug,
  name,
  tagline,
  category,
  pricingType,
  pricingLabel,
  runsCount,
  featured = false,
  isNew = false,
}: AgentCardProps) {
  const icon = CATEGORY_ICONS[category] ?? "🤖";

  return (
    <Link href={`/agents/${slug}`} className="group block">
      <article className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1">
        {/* Top badges */}
        {(featured || isNew) && (
          <div className="absolute right-4 top-4 flex gap-1.5">
            {featured && (
              <Badge variant="amber" className="text-[10px]">🔥 Popularny</Badge>
            )}
            {isNew && !featured && (
              <Badge variant="indigo" className="text-[10px]">✨ Nowy</Badge>
            )}
          </div>
        )}

        {/* Category icon badge */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-xl shadow-sm">
            {icon}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1 leading-snug">
            {name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 line-clamp-2">
            {tagline ?? "Agent AI gotowy do użycia."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <PricingBadge type={pricingType} label={pricingLabel ?? "Darmowy"} />
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="text-indigo-400">⚡</span>
            {runsCount.toLocaleString("pl-PL")}
          </span>
        </div>
      </article>
    </Link>
  );
}
