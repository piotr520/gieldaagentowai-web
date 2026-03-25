import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function runAgent({
  agentName,
  agentDescription,
  userInput,
}: {
  agentName: string;
  agentDescription: string;
  userInput: string;
}): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Jesteś agentem AI o nazwie "${agentName}".\n\n${agentDescription}`,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
  });

  return completion.choices[0].message.content ?? "";
}
