import { NextRequest, NextResponse } from "next/server";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  HR: ["hr", "rekrutacja", "pracownik", "zatrudnienie", "kadry", "onboarding", "rozmowa kwalifikacyjna", "cv"],
  Marketing: ["marketing", "reklama", "kampania", "social media", "seo", "content", "branding", "copywriting"],
  Prawo: ["prawo", "prawny", "umowa", "kontrakt", "regulamin", "gdpr", "rodo", "przepisy", "prawnik"],
  Finanse: ["finanse", "budżet", "podatek", "faktura", "rachunkowość", "koszty", "przychody", "księgowość"],
  IT: ["it", "programowanie", "kod", "software", "api", "baza danych", "devops", "tech", "developer", "aplikacja"],
  Edukacja: ["edukacja", "nauka", "szkolenie", "kurs", "lekcja", "student", "nauczyciel", "quiz", "egzamin"],
  "E-commerce": ["sklep", "e-commerce", "sprzedaż", "produkt", "zamówienie", "klient", "oferta", "cennik"],
  Budownictwo: ["budownictwo", "budowa", "projekt", "nieruchomość", "architektura", "kosztorys", "inwestycja"],
  Zdrowie: ["zdrowie", "medycyna", "lekarz", "pacjent", "diagnoza", "terapia", "lek", "dieta", "fitness"],
  Biznes: ["biznes", "firma", "przedsiębiorstwo", "strategia", "zarządzanie", "projekt", "raport", "analiza"],
};

const BRANZA_TO_CATEGORY: Record<string, string> = {
  hr: "HR", marketing: "Marketing", prawo: "Prawo", finanse: "Finanse",
  it: "IT", edukacja: "Edukacja", budownictwo: "Budownictwo",
  "e-commerce": "E-commerce", ecommerce: "E-commerce", zdrowie: "Zdrowie",
  biznes: "Biznes",
};

function detectCategory(description: string, branza: string): string {
  if (branza) {
    const mapped = BRANZA_TO_CATEGORY[branza.toLowerCase()];
    if (mapped) return mapped;
  }
  const lower = description.toLowerCase();
  let bestCat = "Biznes";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; bestCat = cat; }
  }
  return bestCat;
}

type PricingResult = { type: "FREE" | "ONE_TIME" | "SUBSCRIPTION"; label: string };

function detectPricing(description: string): PricingResult {
  const lower = description.toLowerCase();
  if (lower.includes("subskrypcj") || lower.includes("miesięczn") || lower.includes("abonament")) {
    return { type: "SUBSCRIPTION", label: "Subskrypcja miesięczna" };
  }
  if (lower.includes("jednorazow") || lower.includes("zakup") || lower.includes("płatn") || lower.includes("zł")) {
    return { type: "ONE_TIME", label: "Płatny (jednorazowo)" };
  }
  return { type: "FREE", label: "Darmowy" };
}

function buildTagline(description: string, cel: string): string {
  if (cel && cel.length >= 10 && cel.length <= 120) {
    return cel.charAt(0).toUpperCase() + cel.slice(1);
  }
  const firstSentence = description.split(/[.!?\n]/)[0].trim();
  if (firstSentence.length >= 10 && firstSentence.length <= 120) return firstSentence;
  return description.slice(0, 100).trim() + (description.length > 100 ? "..." : "");
}

function buildName(description: string, branza: string, category: string): string {
  const lower = description.toLowerCase();
  const actions = [
    ["asystent", "Asystent"],
    ["generator", "Generator"],
    ["analizator", "Analizator"],
    ["kreator", "Kreator"],
    ["planner", "Planner"],
    ["validator", "Validator"],
    ["pomocnik", "Pomocnik"],
    ["checker", "Checker"],
  ] as const;
  const found = actions.find(([kw]) => lower.includes(kw));
  const action = found ? found[1] : "Asystent";
  const base = branza
    ? branza.charAt(0).toUpperCase() + branza.slice(1).toLowerCase()
    : category;
  return `${action} ${base}`;
}

function buildLimitations(description: string, category: string): string {
  const lines: string[] = [];
  const lower = description.toLowerCase();
  if (!lower.includes("polsk") && !lower.includes("język")) {
    lines.push("Obsługuje tylko język polski");
  }
  if (lower.includes("tekst") || lower.includes("opis") || lower.includes("treść")) {
    lines.push("Działa wyłącznie na danych tekstowych");
  }
  if (category === "Prawo" || category === "Finanse" || category === "Zdrowie") {
    lines.push("Nie zastępuje porady profesjonalnej");
  }
  if (lines.length === 0) {
    lines.push("Wymaga precyzyjnych danych wejściowych");
  }
  return lines.join("\n");
}

function buildExampleInput(cel: string, category: string): string {
  if (cel && cel.length > 5) return `Pomóż mi z: ${cel}`;
  const examples: Record<string, string> = {
    HR: "Przygotuj pytania rekrutacyjne na stanowisko junior developera",
    Marketing: "Napisz post na LinkedIn promujący nowy produkt SaaS",
    Prawo: "Sprawdź czy ta klauzula umowy jest zgodna z prawem polskim",
    Finanse: "Przygotuj zestawienie kosztów miesięcznych dla małej firmy",
    IT: "Zrób code review tego fragmentu kodu i wskaż błędy",
    Edukacja: "Wygeneruj quiz z 5 pytaniami na temat historii Polski",
    "E-commerce": "Napisz opis produktu dla słuchawek bezprzewodowych",
    Budownictwo: "Oszacuj koszt remontu łazienki 10m2 w Warszawie",
    Zdrowie: "Zaproponuj plan diety dla osoby z nadciśnieniem",
    Biznes: "Przygotuj analizę SWOT dla startupu e-commerce",
  };
  return examples[category] ?? "Opisz swoje zadanie lub pytanie";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const description = String(body.description ?? "").trim();
  const branza = String(body.branza ?? "").trim();
  const cel = String(body.cel ?? "").trim();

  if (!description) {
    return NextResponse.json({ error: "Brak opisu" }, { status: 400 });
  }

  const category = detectCategory(description, branza);
  const pricing = detectPricing(description);
  const tagline = buildTagline(description, cel);
  const name = buildName(description, branza, category);
  const limitations = buildLimitations(description, category);
  const exampleInput = buildExampleInput(cel, category);

  return NextResponse.json({
    name,
    tagline,
    category,
    pricingType: pricing.type,
    pricingLabel: pricing.label,
    limitations,
    exampleInput,
    exampleOutput: "",
  });
}
