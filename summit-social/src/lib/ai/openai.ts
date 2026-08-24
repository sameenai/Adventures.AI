import OpenAI from "openai";

const clients = new Map<string, OpenAI>();

/**
 * OpenAI client factory. Pass a BYOK key for per-user clients; omit for the
 * platform key. Instances are cached per key.
 */
export function getOpenAI(apiKey?: string): OpenAI {
  const key = apiKey ?? process.env.OPENAI_API_KEY ?? "";
  let client = clients.get(key);
  if (!client) {
    client = new OpenAI({ apiKey: key });
    clients.set(key, client);
  }
  return client;
}
