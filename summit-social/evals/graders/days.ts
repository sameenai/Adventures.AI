import { ItineraryDaySchema, parseItineraryFromLLM } from "../../src/lib/ai/parser";
import type { ItineraryDay } from "../../src/lib/ai/parser";
import type { EvalCase, EvalTranscript, GradeResult } from "../types";

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractDays(t: EvalTranscript): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  for (const raw of t.days) {
    const parsed = ItineraryDaySchema.safeParse(raw);
    if (parsed.success) days.push(parsed.data);
  }
  if (days.length === 0) {
    const inline = parseItineraryFromLLM(t.finalText);
    if (inline) days.push(...inline.days);
  }
  return days;
}

/**
 * The system prompt's core planning rules: every day unique (no repeated
 * titles/activities), day numbers contiguous from 1, and day count within the
 * case's expected range.
 */
export function gradeDays(c: EvalCase, t: EvalTranscript): GradeResult {
  const days = extractDays(t);
  if (days.length === 0) {
    return {
      grader: "days",
      score: 0,
      passed: false,
      details: "No valid itinerary days to grade.",
    };
  }

  const problems: string[] = [];

  const numbers = days.map((d) => d.dayNumber).sort((a, b) => a - b);
  const expected = Array.from({ length: days.length }, (_, i) => i + 1);
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) {
    problems.push(`day numbers not contiguous from 1: got [${numbers.join(", ")}]`);
  }

  const seenTitles = new Map<string, number>();
  for (const d of days) {
    const key = normalise(d.title);
    const prior = seenTitles.get(key);
    if (prior !== undefined) problems.push(`day ${d.dayNumber} repeats title of day ${prior}`);
    else seenTitles.set(key, d.dayNumber);
  }

  const seenActivities = new Map<string, number>();
  for (const d of days) {
    for (const a of d.activities) {
      const key = `${normalise(a.activity)}@${normalise(a.location)}`;
      const prior = seenActivities.get(key);
      if (prior !== undefined && prior !== d.dayNumber) {
        problems.push(`day ${d.dayNumber} repeats activity "${a.activity}" from day ${prior}`);
      } else {
        seenActivities.set(key, d.dayNumber);
      }
    }
  }

  const { dayCountMin, dayCountMax } = c.expectations;
  if (dayCountMin !== undefined && days.length < dayCountMin) {
    problems.push(`only ${days.length} days; expected at least ${dayCountMin}`);
  }
  if (dayCountMax !== undefined && days.length > dayCountMax) {
    problems.push(`${days.length} days; expected at most ${dayCountMax}`);
  }

  // Each distinct problem knocks off 25%.
  const score = Math.max(0, 1 - problems.length * 0.25);
  return {
    grader: "days",
    score,
    passed: problems.length === 0,
    details:
      problems.length === 0 ? `${days.length} unique, contiguous days.` : problems.join("; "),
  };
}
