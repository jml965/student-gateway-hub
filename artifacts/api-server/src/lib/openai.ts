
const BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_URL = `${BASE_URL}/chat/completions`;

export function getApiKey(): string {
  return process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
}

export const CHAT_FALLBACK_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
];

export const ANALYSIS_FALLBACK_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
];

export const CLASSIFY_FALLBACK_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-3.5-turbo",
];

function buildFallbackChain(primaryModel: string, fallbacks: string[]): string[] {
  const chain = [primaryModel];
  for (const m of fallbacks) {
    if (!chain.includes(m)) chain.push(m);
  }
  return chain;
}

export async function callOpenAI(
  apiKey: string,
  primaryModel: string,
  fallbacks: string[],
  body: Record<string, unknown>,
): Promise<{ data: Record<string, unknown>; modelUsed: string }> {
  const key = apiKey || getApiKey();
  const chain = buildFallbackChain(primaryModel, fallbacks);
  let lastStatus = 0;
  for (const model of chain) {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model }),
    });
    lastStatus = res.status;
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      return { data, modelUsed: model };
    }
    if (res.status !== 429) {
      const text = await res.text();
      throw new Error(`OpenAI ${res.status}: ${text}`);
    }
  }
  throw Object.assign(new Error("rate_limit"), { status: 429, lastStatus });
}

export async function callOpenAIStream(
  apiKey: string,
  primaryModel: string,
  fallbacks: string[],
  body: Record<string, unknown>,
): Promise<{ response: Response; modelUsed: string }> {
  const key = apiKey || getApiKey();
  const chain = buildFallbackChain(primaryModel, fallbacks);
  for (const model of chain) {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model, stream: true }),
    });
    if (res.ok && res.body) return { response: res, modelUsed: model };
    if (res.status !== 429) {
      const text = await res.text();
      throw new Error(`OpenAI ${res.status}: ${text}`);
    }
  }
  throw Object.assign(new Error("rate_limit"), { status: 429 });
}
