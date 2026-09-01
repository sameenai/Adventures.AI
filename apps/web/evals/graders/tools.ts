import { z } from "zod";
import { chatTools } from "../../src/lib/ai/tools";
import type { EvalCase, EvalTranscript, GradeResult } from "../types";

const KNOWN_TOOLS = new Set(chatTools.map((t) => t.function.name));

const searchFlightsArgs = z.object({
  origin: z.string().regex(/^[A-Z]{3}$/, "IATA code"),
  destination: z.string().regex(/^[A-Z]{3}$/, "IATA code"),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.number().optional(),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
});

const searchAdventuresArgs = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  continent: z.string().optional(),
  difficulty: z.string().optional(),
  maxDuration: z.number().optional(),
});

/**
 * Tool discipline: every required tool for the intent was called, every call
 * targets a tool that actually exists in production, and arguments are
 * well-formed (valid IATA codes and ISO dates for flights, non-empty query
 * for adventure search).
 */
export function gradeToolUse(c: EvalCase, t: EvalTranscript): GradeResult {
  const problems: string[] = [];
  const called = new Set(t.toolCalls.map((tc) => tc.name));

  for (const required of c.expectations.requiredTools ?? []) {
    if (!called.has(required)) problems.push(`required tool not called: ${required}`);
  }

  for (const tc of t.toolCalls) {
    if (!KNOWN_TOOLS.has(tc.name)) {
      problems.push(`hallucinated tool: ${tc.name}`);
      continue;
    }
    if (tc.name === "search_flights") {
      const parsed = searchFlightsArgs.safeParse(tc.arguments);
      if (!parsed.success) {
        problems.push(`search_flights bad args: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      }
    }
    if (tc.name === "search_adventures") {
      const parsed = searchAdventuresArgs.safeParse(tc.arguments);
      if (!parsed.success) {
        problems.push("search_adventures bad args: query missing or empty");
      }
    }
  }

  const score = Math.max(0, 1 - problems.length * 0.34);
  return {
    grader: "toolUse",
    score,
    passed: problems.length === 0,
    details:
      problems.length === 0
        ? `${t.toolCalls.length} tool calls, all known tools with valid arguments.`
        : problems.join("; "),
  };
}
