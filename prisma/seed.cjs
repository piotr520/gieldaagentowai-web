const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TODAY = "2026-03-29";

const seedAgents = [
  {
    slug: "asystent-hr-rekrutacji",
    name: "Asystent HR rekrutacji",
    tagline: "Tworzy pytania rekrutacyjne, ocenia CV i przygotowuje raporty z rozmów kwalifikacyjnych.",
    category: "HR",
    pricingType: "FREE",
    pricingLabel: "Darmowy",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: null,
    runsCount: 340,
    description: "Agent wspiera rekruterów na każdym etapie procesu zatrudnienia. Generuje zestawy pytań dopasowanych do stanowiska, analizuje CV pod kątem wymagań, przygotowuje notatki po rozmowie i rekomenduje kolejne kroki. Idealny dla działów HR, agencji rekrutacyjnych i managerów prowadzących rozmowy kwalifikacyjne.",
    limitations: [
      "Nie weryfikuje danych osobowych kandydatów",
      "Wymaga podania stanowiska i wymagań jako danych wejściowych"
    ],
    examples: [
      {
        input: "Stanowisko: Junior Frontend Developer. Wymagania: React, TypeScript, 1 rok doświadczenia.",
        output: "10 pytań rekrutacyjnych: 3 techniczne (React hooks, TypeScript generics, optymalizacja), 3 behawioralne, 2 sytuacyjne, 2 motywacyjne. Sugerowany czas rozmowy: 45 min."
      }
    ]
  },
  {
    slug: "generator-tresci-marketingowych",
    name: "Generator treści marketingowych",
    tagline: "Tworzy posty, reklamy i kampanie dopasowane do Twojej marki i grupy docelowej.",
    category: "Marketing",
    pricingType: "SUBSCRIPTION",
    pricingLabel: "79 zł / mies.",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: 79,
    runsCount: 890,
    description: "Agent generuje pełne zestawy treści marketingowych: posty na LinkedIn, Facebook i Instagram, teksty reklam Google Ads i Meta Ads, newslettery, opisy produktów i slogany. Dostosowuje ton i styl do branży oraz grupy docelowej. Obsługuje kampanie sezonowe, launche produktów i content evergreen.",
    limitations: [
      "Nie publikuje treści bezpośrednio w mediach społecznościowych",
      "Wymaga podania briefu: marka, cel, grupa docelowa, kanał"
    ],
    examples: [
      {
        input: "Marka: SaaS do fakturowania dla freelancerów. Cel: pozyskanie trial. Kanał: LinkedIn.",
        output: "Post LinkedIn (240 znaków): hook + problem + rozwiązanie + CTA. Alternatywna wersja karuzelowa (5 slajdów). Hashtagi: #freelancer #fakturowanie #saas."
      }
    ]
  },
  {
    slug: "analizator-umow-prawnych",
    name: "Analizator umów prawnych",
    tagline: "Sprawdza klauzule umów, wykrywa ryzyka i tłumaczy prawniczy język na prosty polski.",
    category: "Prawo",
    pricingType: "ONE_TIME",
    pricingLabel: "99 zł",
    pricingAmountPln: 99,
    pricingAmountPlnPerMonth: null,
    runsCount: 120,
    description: "Agent analizuje treść umów cywilnoprawnych (B2B, zlecenia, NDA, najmu, sprzedaży), wskazuje potencjalnie niekorzystne klauzule, wyjaśnia skomplikowane zapisy prawne w prostym języku i sugeruje pytania do zadania prawnikowi. Nie zastępuje doradztwa prawnego, ale pomaga zrozumieć co podpisujesz.",
    limitations: [
      "Nie zastępuje porady radcy prawnego ani adwokata",
      "Działa wyłącznie na tekstach umów w języku polskim",
      "Maksymalna długość dokumentu: ok. 10 000 znaków"
    ],
    examples: [
      {
        input: "Klauzula: 'Zleceniobiorca nie będzie prowadzić działalności konkurencyjnej przez 2 lata po zakończeniu współpracy na terenie całej Polski.'",
        output: "Ocena: klauzula zakazu konkurencji — potencjalnie szeroka. Ryzyka: brak odszkodowania, szeroki zakres terytorialny. Pytania do negocjacji: zakres geograficzny, definicja konkurencji, odszkodowanie."
      }
    ]
  },
  {
    slug: "generator-faktur-i-raportow",
    name: "Generator faktur i raportów finansowych",
    tagline: "Tworzy wzory faktur, zestawienia kosztów i raporty finansowe dla małych firm.",
    category: "Finanse",
    pricingType: "FREE",
    pricingLabel: "Darmowy",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: null,
    runsCount: 45,
    description: "Agent pomaga w codziennej rachunkowości małych firm i freelancerów: generuje wzory faktur VAT i proforma, przygotowuje miesięczne zestawienia przychodów i kosztów, tworzy raporty do księdze przychodów i rozchodów oraz analizuje rentowność projektów. Obsługuje różne stawki VAT i formy rozliczenia.",
    limitations: [
      "Nie integruje się bezpośrednio z systemami księgowymi",
      "Nie zastępuje biura rachunkowego w kwestiach podatkowych"
    ],
    examples: [
      {
        input: "Faktura dla: Firma ABC sp. z o.o. Za: projektowanie UI/UX (40h × 150 zł). VAT: 23%.",
        output: "Faktura VAT: numer, data, dane sprzedawcy/nabywcy, pozycje: 40h × 150 zł = 6000 zł netto, VAT 23% = 1380 zł, brutto: 7380 zł. Termin płatności: 14 dni."
      }
    ]
  },
  {
    slug: "asystent-programisty",
    name: "Asystent programisty",
    tagline: "Przegląda kod, wyjaśnia błędy, sugeruje refactoring i pisze testy jednostkowe.",
    category: "IT",
    pricingType: "SUBSCRIPTION",
    pricingLabel: "49 zł / mies.",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: 49,
    runsCount: 560,
    description: "Agent wspiera deweloperów w codziennej pracy: wykonuje code review z komentarzami, wyjaśnia błędy i wyjątki, sugeruje optymalizacje i refactoring, generuje testy jednostkowe i integracyjne, pomaga pisać dokumentację techniczną oraz tłumaczy skomplikowane fragmenty kodu na zrozumiały opis. Obsługuje JavaScript, TypeScript, Python, Go i inne popularne języki.",
    limitations: [
      "Nie wykonuje kodu — tylko analizuje i sugeruje",
      "Dla bardzo długich plików (>500 linii) zaleca podanie konkretnego fragmentu"
    ],
    examples: [
      {
        input: "function getUserById(id) { return db.query('SELECT * FROM users WHERE id = ' + id); }",
        output: "Krytyczny błąd: SQL injection — konkatenacja parametru bezpośrednio do zapytania. Poprawka: użyj parametryzowanych zapytań. Przykład: db.query('SELECT * FROM users WHERE id = $1', [id])."
      }
    ]
  },
  {
    slug: "kreator-opisow-produktow",
    name: "Kreator opisów produktów e-commerce",
    tagline: "Pisze przekonujące opisy produktów zoptymalizowane pod SEO i konwersję.",
    category: "E-commerce",
    pricingType: "ONE_TIME",
    pricingLabel: "29 zł",
    pricingAmountPln: 29,
    pricingAmountPlnPerMonth: null,
    runsCount: 215,
    description: "Agent generuje opisy produktów dla sklepów internetowych: krótki opis marketingowy, rozbudowany opis z korzyściami, listę cech technicznych, frazy SEO oraz pytania i odpowiedzi FAQ. Dostosowuje styl do kategorii produktu (elektronika, moda, dom, uroda) i grupy docelowej. Obsługuje eksport do formatów stosowanych w WooCommerce, Shopify i Allegro.",
    limitations: [
      "Nie tworzy zdjęć produktów",
      "Wymaga podania podstawowych parametrów: nazwa, kategoria, cechy, cena docelowa"
    ],
    examples: [
      {
        input: "Produkt: słuchawki bezprzewodowe NoiseX Pro. Cena: 349 zł. Cechy: ANC, 30h baterii, USB-C.",
        output: "Opis marketingowy (80 słów) + lista 6 korzyści + specyfikacja techniczna + 3 frazy SEO + 2 pytania FAQ."
      }
    ]
  },
  {
    slug: "generator-quizow-edukacyjnych",
    name: "Generator quizów edukacyjnych",
    tagline: "Tworzy quizy, testy i fiszki do nauki z dowolnego materiału tekstowego.",
    category: "Edukacja",
    pricingType: "FREE",
    pricingLabel: "Darmowy",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: null,
    runsCount: 78,
    description: "Agent przetwarza materiały edukacyjne (notatki, artykuły, rozdziały podręczników) i generuje z nich quizy wielokrotnego wyboru, pytania otwarte, fiszki do powtórki oraz testy sprawdzające. Obsługuje różne poziomy trudności, może tworzyć klucze odpowiedzi i wskazówki do nauki. Idealny dla nauczycieli, studentów i firm szkoleniowych.",
    limitations: [
      "Jakość quizu zależy od jakości dostarczonego materiału",
      "Maksymalna długość materiału wejściowego: ok. 5000 znaków"
    ],
    examples: [
      {
        input: "Materiał: fragment rozdziału o fotosytezie. Poziom: liceum. Format: 5 pytań wielokrotnego wyboru.",
        output: "5 pytań z 4 odpowiedziami każde, oznaczone poprawne odpowiedzi, krótkie wyjaśnienia dla każdego pytania."
      }
    ]
  },
  {
    slug: "planner-budzetu-domowego",
    name: "Planner budżetu domowego",
    tagline: "Analizuje wydatki, planuje budżet miesięczny i sugeruje oszczędności.",
    category: "Finanse",
    pricingType: "FREE",
    pricingLabel: "Darmowy",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: null,
    runsCount: 15,
    description: "Agent pomaga zarządzać finansami osobistymi: analizuje listę wydatków, kategoryzuje je (mieszkanie, jedzenie, transport, rozrywka), tworzy miesięczny plan budżetu, identyfikuje obszary gdzie można zaoszczędzić i generuje prognozę finansową na kolejne miesiące. Obsługuje również planowanie dużych wydatków i funduszy awaryjnych.",
    limitations: [
      "Nie ma dostępu do danych bankowych — wymaga ręcznego wklejenia wydatków",
      "Sugestie oszczędności mają charakter ogólny, nie uwzględniają sytuacji życiowej"
    ],
    examples: [
      {
        input: "Dochód: 6500 zł. Wydatki: czynsz 1800, jedzenie 1200, transport 400, subskrypcje 150, inne 800.",
        output: "Budżet: stałe koszty 4350 zł (67%), pozostaje 2150 zł. Propozycja: 1000 zł oszczędności, 700 zł fundusz awaryjny, 450 zł wolne. Obszar do optymalizacji: subskrypcje (lista do przejrzenia)."
      }
    ]
  },
  {
    slug: "asystent-linkedin-content",
    name: "Asystent LinkedIn Content",
    tagline: "Pisze posty na LinkedIn które budują zasięg, wiarygodność i pozyskują klientów B2B.",
    category: "Marketing",
    pricingType: "FREE",
    pricingLabel: "Darmowy",
    pricingAmountPln: null,
    pricingAmountPlnPerMonth: null,
    runsCount: 430,
    description: "Agent specjalizuje się w tworzeniu treści na LinkedIn dla przedsiębiorców, ekspertów i team liderów. Generuje posty narracyjne (storytelling), posty z listami porad, komentarze eksperckie, opisy doświadczeń zawodowych i artykuły. Optymalizuje treść pod algorytm LinkedIn: długość, emotikony, hashtagi, pytania angażujące.",
    limitations: [
      "Nie publikuje postów bezpośrednio na LinkedIn",
      "Najlepsze wyniki przy podaniu konkretnej historii lub doświadczenia do opisania"
    ],
    examples: [
      {
        input: "Temat: jak straciłem pierwszego klienta i czego się nauczyłem. Branża: agencja software. Ton: szczery, refleksyjny.",
        output: "Post 1200 znaków: hook (pytanie retoryczne) → historia (błąd komunikacji) → lekcja → rada praktyczna → CTA (komentarz). 5 hashtagów. Wersja krótsza 400 znaków."
      }
    ]
  },
  {
    slug: "oferta-handlowa-b2b",
    name: "Generator ofert B2B",
    tagline: "Tworzy ofertę handlową na podstawie krótkich danych wejściowych.",
    category: "Biznes",
    pricingType: "ONE_TIME",
    pricingLabel: "49 zł",
    pricingAmountPln: 49,
    pricingAmountPlnPerMonth: null,
    runsCount: 180,
    description: "Agent przygotowuje profesjonalne oferty handlowe B2B: wstęp, zakres usług, korzyści dla klienta, harmonogram realizacji, warunki cenowe, warunki płatności i CTA. Dostosowuje ton do branży (produkcja, usługi, IT, budownictwo). Zwraca gotowy tekst do skopiowania do PDF lub Word.",
    limitations: [
      "Nie gwarantuje zgodności prawnej — tekst jest szablonem do uzupełnienia",
      "Wymaga podania branży, zakresu i ceny, aby wynik miał sens"
    ],
    examples: [
      {
        input: "Branża: ogrodzenia. Usługa: montaż 120m paneli 3D. Cena: 18 500 zł. Termin: 2 tygodnie.",
        output: "Oferta: Montaż ogrodzenia panelowego 3D (120 m) — zakres prac, materiały, harmonogram 2 tyg., cena 18 500 zł, warunki płatności, gwarancja, CTA."
      }
    ]
  }
];

async function main() {
  const adminEmail = "admin@gaai.local";
  const creatorEmail = "creator@gaai.local";
  const userEmail = "user@gaai.local";

  const [adminPass, creatorPass, userPass] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Creator123!", 10),
    bcrypt.hash("User123!", 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: adminPass, role: "ADMIN" }
  });

  const creator = await prisma.user.upsert({
    where: { email: creatorEmail },
    update: {},
    create: { email: creatorEmail, passwordHash: creatorPass, role: "CREATOR" }
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail, passwordHash: userPass, role: "USER" }
  });

  for (const a of seedAgents) {
    await prisma.agent.upsert({
      where: { slug: a.slug },
      update: { runsCount: a.runsCount, status: "PUBLISHED" },
      create: {
        slug: a.slug,
        name: a.name,
        tagline: a.tagline,
        category: a.category,
        pricingType: a.pricingType,
        pricingLabel: a.pricingLabel,
        pricingAmountPln: a.pricingAmountPln,
        pricingAmountPlnPerMonth: a.pricingAmountPlnPerMonth,
        description: a.description,
        limitationsJson: JSON.stringify(a.limitations),
        examplesJson: JSON.stringify(a.examples),
        status: "PUBLISHED",
        lastUpdated: TODAY,
        runsCount: a.runsCount,
        creatorId: creator.id
      }
    });
  }

  console.log("Seed OK — " + seedAgents.length + " agentów");
  console.log("ADMIN:   ", adminEmail, "/ Admin123!");
  console.log("CREATOR: ", creatorEmail, "/ Creator123!");
  console.log("USER:    ", userEmail, "/ User123!");
  console.log("\nTestowe zapytania do /results:");
  console.log("  /results?q=rekrutacja&branza=hr");
  console.log("  /results?q=marketing+linkedin");
  console.log("  /results?q=umowa+prawna&budzet=100");
  console.log("  /results?q=faktura+finanse");
  console.log("  /results?q=kod+programowanie&branza=it");

  // Explicitly suppress unused variable warnings
  void admin;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
