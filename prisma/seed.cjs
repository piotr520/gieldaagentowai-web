const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const seedAgents = [
  {
    slug: "oferta-handlowa-b2b",
    name: "Generator ofert B2B",
    tagline: "Tworzy ofertę handlową na podstawie krótkich danych wejściowych.",
    category: "Biznes",
    pricingType: "ONE_TIME",
    pricingLabel: "Jednorazowo",
    pricingAmountPln: 49,
    pricingAmountPlnPerMonth: null,
    description: "Agent przygotowuje ofertę B2B: wstęp, zakres, korzyści, harmonogram, warunki, CTA. Zwraca gotowy tekst do PDF/Word.",
    limitations: [
      "Nie gwarantuje zgodności prawnej – tekst jest szablonem.",
      "Wymaga podania branży, zakresu i ceny, aby wynik miał sens."
    ],
    examples: [
      { input: "Branża: ogrodzenia. Usługa: montaż 120m paneli 3D. Cena: 18 500 zł. Termin: 2 tygodnie.", output: "Oferta: Montaż ogrodzenia panelowego 3D (120 m) – zakres prac, materiały, harmonogram 2 tyg., cena 18 500 zł, warunki płatności, gwarancja, CTA." }
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
      update: {},
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
        lastUpdated: "2026-03-25",
        creatorId: creator.id
      }
    });
  }

  console.log("Seed OK");
  console.log("ADMIN:", adminEmail, "pass: Admin123!");
  console.log("CREATOR:", creatorEmail, "pass: Creator123!");
  console.log("USER:", userEmail, "pass: User123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
