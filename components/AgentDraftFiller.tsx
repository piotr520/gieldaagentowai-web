"use client";

import { useRef, useState } from "react";

type Draft = {
  name: string;
  tagline: string;
  category: string;
  pricingType: string;
  pricingLabel: string;
  limitations: string;
  exampleInput: string;
  exampleOutput: string;
};

type Props = {
  // server action — passed from server component, works in Next.js App Router
  action: (formData: FormData) => Promise<void> | void;
  hasPrefill: boolean;
  prefillDesc: string;
  prefillBranza: string;
  prefillCel: string;
  // initial category value set by server (from branza mapping); "" if none
  initialCategory: string;
  children: React.ReactNode;
};

export function AgentDraftFiller({
  action,
  hasPrefill,
  prefillDesc,
  prefillBranza,
  prefillCel,
  initialCategory,
  children,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateDraft() {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/agent-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: prefillDesc,
          branza: prefillBranza,
          cel: prefillCel,
        }),
      });
      if (!res.ok) throw new Error("api_error");
      const draft: Draft = await res.json();

      const form = formRef.current;
      if (!form) return;

      // Fill text/textarea only if currently empty (not manually edited)
      const fillIfEmpty = (fieldName: string, value: string) => {
        if (!value) return;
        const el = form.elements.namedItem(fieldName) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        if (el && el.value.trim() === "") {
          el.value = value;
        }
      };

      fillIfEmpty("name", draft.name);
      fillIfEmpty("tagline", draft.tagline);
      fillIfEmpty("pricingLabel", draft.pricingLabel);
      fillIfEmpty("limitations", draft.limitations);
      fillIfEmpty("exampleInput", draft.exampleInput);
      fillIfEmpty("exampleOutput", draft.exampleOutput);

      // Category select: fill only when no initial suggestion was provided
      // (initialCategory === ""), meaning the server didn't already suggest one
      if (!initialCategory && draft.category) {
        const catEl = form.elements.namedItem("category") as HTMLSelectElement | null;
        if (catEl) catEl.value = draft.category;
      }

      // pricingType select: fill only if still at default "FREE" and draft
      // detected a different type (user hasn't explicitly changed it yet)
      if (draft.pricingType && draft.pricingType !== "FREE") {
        const ptEl = form.elements.namedItem("pricingType") as HTMLSelectElement | null;
        if (ptEl && ptEl.value === "FREE") {
          ptEl.value = draft.pricingType;
        }
      }

      setSuccess(true);
    } catch {
      setError("Nie udało się wygenerować draftu. Wypełnij formularz ręcznie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {hasPrefill && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Generowanie...
              </>
            ) : (
              "✦ Generuj draft →"
            )}
          </button>

          {success && (
            <p className="text-sm font-medium text-emerald-700">
              Wstępny draft został wygenerowany — sprawdź i popraw przed zapisem.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {children}
    </form>
  );
}
