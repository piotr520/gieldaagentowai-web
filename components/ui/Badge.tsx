import { ReactNode } from "react";

type Variant = "default" | "indigo" | "green" | "amber" | "red" | "violet" | "slate";

const VARIANTS: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-800 text-slate-100 border-slate-700",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PricingBadge({ type, label }: { type: string; label: string }) {
  if (type === "FREE")
    return <Badge variant="green">✦ {label}</Badge>;
  if (type === "SUBSCRIPTION")
    return <Badge variant="violet">♾ {label}</Badge>;
  if (type === "PAY_PER_USE")
    return <Badge variant="amber">⚡ {label}</Badge>;
  return <Badge variant="indigo">◈ {label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    PUBLISHED: { variant: "green", label: "Opublikowany" },
    PENDING: { variant: "amber", label: "Oczekuje" },
    DRAFT: { variant: "default", label: "Szkic" },
    HIDDEN: { variant: "red", label: "Ukryty" },
    REJECTED: { variant: "red", label: "Odrzucony" },
  };
  const { variant, label } = map[status] ?? { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
