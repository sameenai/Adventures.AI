import { createHash } from "node:crypto";
import {
  GEAR_SYSTEM_PROMPT,
  ITINERARY_SYSTEM_PROMPT,
  buildEnhanceDescriptionPrompt,
} from "../src/lib/ai/prompts";
import { chatTools } from "../src/lib/ai/tools";

// Single-sourced with production (src/lib/ai/model.ts) so the certified
// surface can never diverge from what api/chat actually calls.
export { CHAT_MODEL } from "../src/lib/ai/model";
import { CHAT_MODEL } from "../src/lib/ai/model";

/**
 * Fixed reference input for the enhance-description prompt builder. Only the
 * TEMPLATE matters to the surface hash — this input never changes, so the
 * hash moves exactly when someone edits the template itself.
 */
const ENHANCE_REFERENCE_INPUT = {
  title: "Tour du Mont Blanc",
  description: "A classic hut-to-hut circuit of the Mont Blanc massif.",
  location: "Chamonix, France",
  category: "TREKKING",
  difficulty: "CHALLENGING",
  highlights: ["Col du Bonhomme", "Grand Col Ferret"],
};

/**
 * Hash of the complete AI surface: system prompts, tool definitions, the
 * enhance-description prompt template (rendered against a fixed reference
 * input) and model. When this changes, replayed transcripts no longer reflect
 * what production would produce, so the replay gate demands a fresh live run
 * before the baseline can be trusted again.
 */
export function computePromptSnapshotHash(): string {
  const surface = JSON.stringify({
    model: CHAT_MODEL,
    itinerarySystemPrompt: ITINERARY_SYSTEM_PROMPT,
    gearSystemPrompt: GEAR_SYSTEM_PROMPT,
    enhanceDescriptionPrompt: buildEnhanceDescriptionPrompt(ENHANCE_REFERENCE_INPUT),
    tools: chatTools,
  });
  return createHash("sha256").update(surface).digest("hex");
}
