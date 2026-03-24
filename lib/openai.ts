import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateOffer(input: {
  agentName: string;
  branza: string;
  usluga: string;
  cena: string;
  termin: string;
}) {
  const prompt = `
Jesteś ekspertem sprzedaży B2B.

Na podstawie danych wygeneruj profesjonalną ofertę handlową.

Sekcje:
1. Wprowadzenie
2. Zakres prac
3. Harmonogram
4. Cena
5. Warunki współpracy
6. Call to Action

Agent: ${input.agentName}

Branża: ${input.branza}
Usługa: ${input.usluga}
Cena: ${input.cena}
Termin: ${input.termin}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Jesteś ekspertem sprzedaży B2B." },
      { role: "user", content: prompt }
    ],
  });

  return completion.choices[0].message.content ?? "";
}