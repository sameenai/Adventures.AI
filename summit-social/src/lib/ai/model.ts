/**
 * Single source of truth for the chat model id. Imported by the chat
 * service, the enhance-description route, and the eval harness's surface
 * hash — so the model can never silently diverge between production and
 * what the evals certify.
 */
export const CHAT_MODEL = "gpt-4o";
