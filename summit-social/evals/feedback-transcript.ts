/**
 * Pure shaping of a MessageFeedback row into a candidate eval transcript.
 *
 * The stored snapshot is the itinerary's chatHistory up to and including the
 * rated assistant reply — OpenAI-shaped messages ({ role, content,
 * tool_calls?, tool_call_id? }). This module reconstructs the harness's
 * EvalTranscript view of that exchange (toolCalls, toolResults keyed by
 * tool_call id, days from create_itinerary_day calls, per-turn detail) without
 * touching a database, so it is unit-testable and reusable.
 */
import type { CandidateTranscript, TranscriptToolCall, TranscriptTurn } from "./types";

export interface FeedbackRowLike {
  id: string;
  itineraryId: string | null;
  messageIndex: number;
  rating: "UP" | "DOWN";
  comment: string | null;
  /** The conversation snapshot persisted with the rating. */
  transcript: unknown;
  createdAt: Date;
}

interface SnapshotToolCall {
  id?: unknown;
  function?: { name?: unknown; arguments?: unknown };
}

interface SnapshotEntry {
  role?: unknown;
  content?: unknown;
  tool_calls?: unknown;
  tool_call_id?: unknown;
}

function parseArguments(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function parseToolResult(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function feedbackToCandidateTranscript(row: FeedbackRowLike): CandidateTranscript {
  const snapshot = Array.isArray(row.transcript) ? (row.transcript as SnapshotEntry[]) : [];

  const toolCalls: TranscriptToolCall[] = [];
  const toolResults: Record<string, unknown> = {};
  const turns: TranscriptTurn[] = [];
  const daysByNumber = new Map<number, unknown>();
  const unnumberedDays: unknown[] = [];
  let currentTurn: TranscriptTurn | null = null;

  for (const entry of snapshot) {
    if (!entry || typeof entry !== "object") continue;

    if (entry.role === "user" && typeof entry.content === "string") {
      currentTurn = { userMessage: entry.content, finalText: "" };
      turns.push(currentTurn);
      continue;
    }

    if (entry.role === "assistant") {
      if (currentTurn === null) {
        // Defensive: a snapshot should open with a user turn, but never lose a
        // reply if it doesn't.
        currentTurn = { userMessage: "", finalText: "" };
        turns.push(currentTurn);
      }
      if (Array.isArray(entry.tool_calls)) {
        for (const rawCall of entry.tool_calls as SnapshotToolCall[]) {
          if (!rawCall || typeof rawCall !== "object") continue;
          const name = rawCall.function?.name;
          if (typeof name !== "string") continue;
          const call: TranscriptToolCall = {
            ...(typeof rawCall.id === "string" ? { id: rawCall.id } : {}),
            name,
            arguments: parseArguments(rawCall.function?.arguments),
          };
          toolCalls.push(call);
          currentTurn.toolCalls = [...(currentTurn.toolCalls ?? []), call];
          if (name === "create_itinerary_day") {
            const dayNumber = call.arguments.dayNumber;
            if (typeof dayNumber === "number") {
              // A later re-creation of the same dayNumber is a revision — the
              // candidate carries the itinerary's final state, like multi-turn
              // goldens do.
              daysByNumber.set(dayNumber, call.arguments);
            } else {
              unnumberedDays.push(call.arguments);
            }
          }
        }
      }
      if (typeof entry.content === "string" && entry.content.length > 0) {
        currentTurn.finalText = entry.content;
      }
      continue;
    }

    if (
      entry.role === "tool" &&
      typeof entry.tool_call_id === "string" &&
      typeof entry.content === "string"
    ) {
      toolResults[entry.tool_call_id] = parseToolResult(entry.content);
    }
  }

  // The snapshot ends at the rated reply, so the last assistant text IS the
  // rated one — finalText mirrors the harness convention (last turn's reply).
  let finalText = "";
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].finalText.length > 0) {
      finalText = turns[i].finalText;
      break;
    }
  }

  const days = [
    ...[...daysByNumber.entries()].sort(([a], [b]) => a - b).map(([, args]) => args),
    ...unnumberedDays,
  ];

  return {
    caseId: `feedback-${row.id}`,
    source: "candidate",
    toolCalls,
    ...(Object.keys(toolResults).length > 0 ? { toolResults } : {}),
    days,
    finalText,
    turns,
    recordedAt: row.createdAt.toISOString(),
    _meta: {
      feedbackId: row.id,
      rating: row.rating,
      comment: row.comment,
      itineraryId: row.itineraryId,
      messageIndex: row.messageIndex,
      ratedAt: row.createdAt.toISOString(),
    },
  };
}
