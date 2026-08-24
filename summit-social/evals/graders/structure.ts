import { ItineraryDaySchema, parseItineraryFromLLM } from "../../src/lib/ai/parser";
import type { EvalCase, EvalTranscript, GradeResult } from "../types";

/**
 * Every itinerary day the assistant produced must validate against the
 * production schema (ItineraryDaySchema) — the same contract api/chat uses
 * before persisting a day. Days may arrive as create_itinerary_day tool
 * arguments or as an inline ```json block in the final text.
 */
export function gradeStructure(_c: EvalCase, t: EvalTranscript): GradeResult {
  const candidates: unknown[] = [...t.days];

  if (candidates.length === 0) {
    const inline = parseItineraryFromLLM(t.finalText);
    if (inline) candidates.push(...inline.days);
  }

  if (candidates.length === 0) {
    return {
      grader: "structure",
      score: 0,
      passed: false,
      details: "No structured itinerary days produced (no tool calls, no parseable JSON).",
    };
  }

  const invalid: number[] = [];
  candidates.forEach((day, i) => {
    if (!ItineraryDaySchema.safeParse(day).success) invalid.push(i + 1);
  });

  const score = (candidates.length - invalid.length) / candidates.length;
  return {
    grader: "structure",
    score,
    passed: invalid.length === 0,
    details:
      invalid.length === 0
        ? `${candidates.length}/${candidates.length} days validate against ItineraryDaySchema.`
        : `Days failing schema validation: ${invalid.join(", ")} of ${candidates.length}.`,
  };
}
