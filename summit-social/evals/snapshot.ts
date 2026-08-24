import { createHash } from "node:crypto";
import { GEAR_SYSTEM_PROMPT, ITINERARY_SYSTEM_PROMPT } from "../src/lib/ai/prompts";
import { chatTools } from "../src/lib/ai/tools";

/** Model id used by api/chat — keep in sync with src/app/api/chat/route.ts. */
export const CHAT_MODEL = "gpt-4o";

/**
 * Hash of the complete AI surface: system prompts, tool definitions and model.
 * When this changes, replayed transcripts no longer reflect what production
 * would produce, so the replay gate demands a fresh live run before the
 * baseline can be trusted again.
 */
export function computePromptSnapshotHash(): string {
  const surface = JSON.stringify({
    model: CHAT_MODEL,
    itinerarySystemPrompt: ITINERARY_SYSTEM_PROMPT,
    gearSystemPrompt: GEAR_SYSTEM_PROMPT,
    tools: chatTools,
  });
  return createHash("sha256").update(surface).digest("hex");
}
