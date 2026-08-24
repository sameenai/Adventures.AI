import type { EvalCase, EvalTranscript, GradeResult } from "../types";

/** Extract GBP amounts like "£1,800", "£2400 per person", "GBP 3,000". */
export function extractGbpAmounts(text: string): number[] {
  const amounts: number[] = [];
  const pattern = /(?:£|GBP\s?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
  let match = pattern.exec(text);
  while (match !== null) {
    const value = Number.parseInt(match[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(value)) amounts.push(value);
    match = pattern.exec(text);
  }
  return amounts;
}

const BUDGET_TOLERANCE = 1.15;

/**
 * The system prompt requires cost estimates in GBP and respect for the user's
 * budget. When the case sets a ceiling, the largest quoted trip estimate must
 * stay under ceiling × 1.15. When no amounts are quoted at all, that itself
 * is a partial failure — the prompt asks for estimated costs.
 */
export function gradeBudget(c: EvalCase, t: EvalTranscript): GradeResult {
  const ceiling = c.expectations.budgetCeilingGBP;
  const amounts = extractGbpAmounts(t.finalText);

  if (amounts.length === 0) {
    return {
      grader: "budget",
      score: 0.5,
      passed: ceiling === undefined,
      details: "No GBP cost estimates found in the response.",
    };
  }

  if (ceiling === undefined) {
    return {
      grader: "budget",
      score: 1,
      passed: true,
      details: `Cost estimates present (${amounts.length} amounts), no ceiling set for this case.`,
    };
  }

  const max = Math.max(...amounts);
  const withinBudget = max <= ceiling * BUDGET_TOLERANCE;
  return {
    grader: "budget",
    score: withinBudget ? 1 : Math.max(0, 1 - (max / ceiling - 1)),
    passed: withinBudget,
    details: withinBudget
      ? `Max quoted estimate £${max} within ceiling £${ceiling} (+15% tolerance).`
      : `Max quoted estimate £${max} exceeds ceiling £${ceiling}.`,
  };
}
