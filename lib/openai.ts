import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function runAgent({
  agentName,
  agentDescription,
  userInput,
  sourceUrl,
}: {
  agentName: string;
  agentDescription: string;
  userInput: string;
  sourceUrl?: string | null;
}): Promise<string> {
  const userMessage = sourceUrl
    ? `Źródło (URL): ${sourceUrl}\n\nTreść strony:\n${userInput}`
    : userInput;

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Jesteś agentem AI o nazwie "${agentName}".\n\n${agentDescription}`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return completion.choices[0].message.content ?? "";
}
