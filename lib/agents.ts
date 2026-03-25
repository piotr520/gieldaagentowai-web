import type { Agent } from "./types";

export const AGENTS: Agent[] = [
  {
    id: "a1",
    slug: "oferta-handlowa-b2b",
    name: "Generator ofert B2B",
    tagline: "Tworzy ofertę handlową na podstawie krótkich danych wejściowych.",
    category: "Biznes",
    pricing: { type: "one_time", label: "Jednorazowo", amountPln: 49 },
    description:
      "Agent przygotowuje ofertę B2B: wstęp, zakres, korzyści, harmonogram, warunki, CTA. Zwraca gotowy tekst do PDF/Word.",
    limitations: [
      "Nie gwarantuje zgodności prawnej – tekst jest szablonem.",
      "Wymaga podania branży, zakresu i ceny, aby wynik miał sens."
    ],
    examples: [
      {
        input: "Branża: ogrodzenia. Usługa: montaż 120m paneli 3D. Cena: 18 500 zł. Termin: 2 tygodnie.",
        output:
          "Oferta: Montaż ogrodzenia panelowego 3D (120 m) – zakres prac, materiały, harmonogram 2 tyg., cena 18 500 zł, warunki płatności, gwarancja, CTA."
      },
      {
        input: "Usługa: projekt + wykonanie strony wizytówki. Cena: 3 900 zł. Czas: 10 dni.",
        output:
          "Oferta: Strona wizytówka – etapy (brief, makieta, wdrożenie), termin 10 dni, cena 3 900 zł, warunki, CTA."
      },
      {
        input: "Transport: trasa Gubin → Cottbus, 2 palety, termin jutro, cena 450 zł.",
        output:
          "Oferta transportu: parametry ładunku, trasa, termin, cena 450 zł, zasady załadunku/rozładunku, kontakt."
      }
    ],
    lastUpdated: "2026-03-02"
  },
  {
    id: "a2",
    slug: "posty-social-media",
    name: "Copywriter Social",
    tagline: "Generuje posty na FB/IG/TikTok + hashtagi i CTA.",
    category: "Marketing",
    pricing: { type: "subscription", label: "Miesięcznie", amountPlnPerMonth: 39 },
    description:
      "Agent tworzy zestawy postów pod cel (sprzedaż, rekrutacja, wizerunek), dopasowuje ton i długość.",
    limitations: [
      "Nie publikuje automatycznie – tylko generuje treści.",
      "Potrzebuje informacji o firmie i ofercie."
    ],
    examples: [
      { input: "Firma: warsztat. Cel: promocja wymiany opon. Ton: konkretny.", output: "3 propozycje postów + CTA + hashtagi." },
      { input: "Firma: restauracja. Cel: nowe menu. Ton: lekki.", output: "Post zapowiadający menu + story + krótkie video-skróty." },
      { input: "Firma: ogrodzenia. Cel: leady. Ton: profesjonalny.", output: "Post z ofertą + bullet points + CTA do wyceny." }
    ],
    lastUpdated: "2026-03-02"
  },
  {
    id: "a3",
    slug: "cv-i-list-motywacyjny",
    name: "CV + List Motywacyjny",
    tagline: "Dopasowuje CV i list do ogłoszenia (PL/DE/EN).",
    category: "HR",
    pricing: { type: "one_time", label: "Jednorazowo", amountPln: 59 },
    description:
      "Agent analizuje ogłoszenie i układa CV/LM pod wymagania. Zwraca wersje językowe i listę słów kluczowych.",
    limitations: [
      "Nie zastępuje doradcy HR – wynik wymaga weryfikacji.",
      "Wymaga danych o doświadczeniu i stanowisku."
    ],
    examples: [
      { input: "Ogłoszenie: operator koparki. Język: PL. Doświadczenie: 10 lat.", output: "CV w odwróconej chronologii + LM + słowa kluczowe." },
      { input: "Ogłoszenie: kierowca CE. Język: DE.", output: "DE CV + Anschreiben + dopasowanie pod wymagania." },
      { input: "Ogłoszenie: magazyn. Język: EN.", output: "EN resume + cover letter + keywords." }
    ],
    lastUpdated: "2026-03-02"
  },
  {
    id: "a4",
    slug: "opisy-produktow-seo",
    name: "Opisy produktów SEO",
    tagline: "Tworzy opisy do sklepu + meta title/description.",
    category: "E-commerce",
    pricing: { type: "subscription", label: "Miesięcznie", amountPlnPerMonth: 49 },
    description:
      "Agent generuje opisy produktów, parametry, FAQ i meta dane, pod konkretne słowa kluczowe.",
    limitations: [
      "Nie gwarantuje pozycji w Google.",
      "Wymaga danych technicznych produktu."
    ],
    examples: [
      { input: "Produkt: wkręty 5x60, ocynk, 200 szt. Słowo kluczowe: wkręty do drewna.", output: "Opis SEO + meta + FAQ." },
      { input: "Produkt: kurtka robocza. Słowo kluczowe: odzież BHP.", output: "Opis + tabela cech + FAQ." },
      { input: "Produkt: farba elewacyjna 10L.", output: "Opis + zastosowanie + wydajność + meta." }
    ],
    lastUpdated: "2026-03-02"
  },
  {
    id: "a5",
    slug: "prosty-wzor-umowy-uslugi",
    name: "Prosty wzór umowy usługi",
    tagline: "Tworzy szkic umowy na podstawie ustaleń.",
    category: "Prawo",
    pricing: { type: "one_time", label: "Jednorazowo", amountPln: 79 },
    description:
      "Agent przygotowuje szkic umowy: strony, zakres, terminy, wynagrodzenie, odpowiedzialność, odstąpienie.",
    limitations: [
      "To nie jest porada prawna – szkic do konsultacji.",
      "Nie uwzględnia specyficznych branżowych regulacji."
    ],
    examples: [
      { input: "Usługa: montaż ogrodzenia. Cena: 18 500 zł. Termin: 14 dni.", output: "Szkic umowy z zakresem i warunkami." },
      { input: "Usługa: strona internetowa. Cena: 3 900 zł. Termin: 10 dni.", output: "Szkic umowy + etapy i odbiory." },
      { input: "Usługa: transport. Cena: 450 zł. Termin: jutro.", output: "Szkic umowy z warunkami przewozu." }
    ],
    lastUpdated: "2026-03-02"
  },
  {
    id: "a6",
    slug: "brief-strony-www",
    name: "Brief strony WWW",
    tagline: "Zadaje pytania i składa brief do wykonawcy.",
    category: "IT",
    pricing: { type: "free", label: "Darmowy" },
    description:
      "Agent zbiera wymagania: cele, sekcje, styl, treści, CTA, integracje i generuje dokument briefu.",
    limitations: [
      "Nie projektuje grafiki – przygotowuje brief.",
      "Wymaga odpowiedzi na pytania."
    ],
    examples: [
      { input: "Firma: ogrodzenia. Cel: leady. Język: PL.", output: "Brief: sekcje, CTA, wymagania, treści." },
      { input: "Firma: transport. Cel: zapytania o wyceny.", output: "Brief pod landing i formularz." },
      { input: "Firma: restauracja. Cel: rezerwacje.", output: "Brief pod menu i rezerwacje." }
    ],
    lastUpdated: "2026-03-02"
  }
];
