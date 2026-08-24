/**
 * Live eval execution — replays the production chat loop from
 * src/app/api/chat/route.ts as faithfully as possible outside HTTP:
 * same system prompt, same tool definitions, same model, same
 * one-round-of-tools-then-follow-up shape, and the same stub behaviour for
 * tools production does not implement (search_flights, suggest_gear and
 * get_weather_forecast all return empty results in production today —
 * evals must measure the product as it is, not as we wish it were).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { SearchAdventuresArgsSchema } from "../src/lib/ai/parser";
import { ITINERARY_SYSTEM_PROMPT, buildUserContextPrompt } from "../src/lib/ai/prompts";
import { chatTools } from "../src/lib/ai/tools";
import { CHAT_MODEL } from "./snapshot";
import type { EvalCase, EvalTranscript, TranscriptToolCall, TranscriptTurn } from "./types";

const ADVENTURES_DATA_PATH = join(__dirname, "..", "prisma", "data", "adventures.json");

interface CatalogAdventure {
  id: string;
  title: string;
  location: string;
  country: string;
  continent: string;
  category: string;
  difficulty: string;
  durationDays: number;
  description: string;
  voteCount?: number;
}

let catalogCache: CatalogAdventure[] | null = null;

function loadCatalog(): CatalogAdventure[] {
  if (catalogCache) return catalogCache;
  if (!existsSync(ADVENTURES_DATA_PATH)) {
    catalogCache = [];
    return catalogCache;
  }
  const raw = JSON.parse(readFileSync(ADVENTURES_DATA_PATH, "utf8")) as {
    adventures: CatalogAdventure[];
  };
  catalogCache = raw.adventures;
  return catalogCache;
}

/** Mirrors handleSearchAdventures in api/chat — same filters, same top-5 shape. */
function searchAdventures(args: unknown): string {
  const parsed = SearchAdventuresArgsSchema.safeParse(args);
  if (!parsed.success) {
    return JSON.stringify({ success: false, results: [], error: "Invalid arguments" });
  }
  const a = parsed.data;
  const q = a.query?.toLowerCase();
  const results = loadCatalog()
    .filter(
      (adv) =>
        (!a.category || adv.category === a.category) &&
        (!a.continent || adv.continent === a.continent) &&
        (!a.difficulty || adv.difficulty === a.difficulty) &&
        (!a.maxDuration || adv.durationDays <= a.maxDuration) &&
        (!q ||
          adv.title.toLowerCase().includes(q) ||
          adv.description.toLowerCase().includes(q) ||
          adv.location.toLowerCase().includes(q)),
    )
    .sort((x, y) => (y.voteCount ?? 0) - (x.voteCount ?? 0))
    .slice(0, 5)
    .map(({ id, title, location, country, category, difficulty, durationDays, description }) => ({
      id,
      title,
      location,
      country,
      category,
      difficulty,
      durationDays,
      description,
    }));
  return JSON.stringify({ success: true, results });
}

function executeTool(name: string, args: unknown): string {
  if (name === "search_adventures") return searchAdventures(args);
  // Production stubs every other tool with an empty success payload.
  return JSON.stringify({ success: true, results: [] });
}

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

interface DayEntry {
  turn: number;
  args: Record<string, unknown>;
}

/**
 * The itinerary's final state: a later turn re-creating the same dayNumber
 * REPLACES the earlier turn's version (a revision), while duplicates within a
 * single turn are kept so the days grader can still catch them.
 */
function mergeDays(entries: DayEntry[]): unknown[] {
  const merged: DayEntry[] = [];
  for (const entry of entries) {
    const n = entry.args.dayNumber;
    const priorIdx =
      typeof n === "number"
        ? merged.findIndex((m) => m.args.dayNumber === n && m.turn < entry.turn)
        : -1;
    if (priorIdx >= 0) merged[priorIdx] = entry;
    else merged.push(entry);
  }
  return merged.map((m) => m.args);
}

export async function runLiveCase(
  evalCase: EvalCase,
  _options: { judge: boolean },
): Promise<EvalTranscript> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const systemPrompt = ITINERARY_SYSTEM_PROMPT + buildUserContextPrompt(evalCase.preferences ?? {});
  const userTurns = evalCase.messages ?? [evalCase.message];
  const history: ChatCompletionMessageParam[] = [{ role: "system", content: systemPrompt }];

  const toolCalls: TranscriptToolCall[] = [];
  const toolResults: Record<string, unknown> = {};
  const dayEntries: DayEntry[] = [];
  const turns: TranscriptTurn[] = [];
  let finalText = "";
  let totalTokens = 0;
  const startedAt = Date.now();

  for (const [turnIndex, userMessage] of userTurns.entries()) {
    history.push({ role: "user", content: userMessage });

    const first = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: history,
      tools: chatTools,
    });
    totalTokens += first.usage?.total_tokens ?? 0;

    const choice = first.choices[0];
    let turnText = choice.message.content ?? "";
    const turnToolCalls: TranscriptToolCall[] = [];

    const rawToolCalls = (choice.message.tool_calls ?? []).filter(
      (tc): tc is ChatCompletionMessageToolCall & { type: "function" } => tc.type === "function",
    );

    if (choice.finish_reason === "tool_calls" && rawToolCalls.length > 0) {
      const toolMessages: ChatCompletionMessageParam[] = [];
      for (const tc of rawToolCalls) {
        const args = safeParseArgs(tc.function.arguments);
        turnToolCalls.push({ id: tc.id, name: tc.function.name, arguments: args });
        if (tc.function.name === "create_itinerary_day") {
          dayEntries.push({ turn: turnIndex, args });
        }
        const result = executeTool(tc.function.name, args);
        toolResults[tc.id] = safeParseJson(result);
        toolMessages.push({ role: "tool", content: result, tool_call_id: tc.id });
      }

      const assistantMsg: ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: choice.message.content,
        tool_calls: rawToolCalls,
      };
      history.push(assistantMsg, ...toolMessages);
      // Production's follow-up call passes no tools — mirrored here.
      const followUp = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: history,
      });
      totalTokens += followUp.usage?.total_tokens ?? 0;
      const followUpText = followUp.choices[0].message.content ?? "";
      turnText += followUpText;
      history.push({ role: "assistant", content: followUpText });
    } else {
      history.push({ role: "assistant", content: turnText });
    }

    toolCalls.push(...turnToolCalls);
    turns.push({ userMessage, finalText: turnText, toolCalls: turnToolCalls });
    finalText = turnText;
  }

  return {
    caseId: evalCase.id,
    source: "live",
    toolCalls,
    toolResults,
    days: mergeDays(dayEntries),
    finalText,
    ...(userTurns.length > 1 ? { turns } : {}),
    recordedAt: new Date().toISOString(),
    model: CHAT_MODEL,
    totalTokens,
    latencyMs: Date.now() - startedAt,
  };
}
