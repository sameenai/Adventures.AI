import type { EvalCase, EvalTranscript, GradeResult } from "../types";
import { extractDays } from "./days";

function haystack(t: EvalTranscript): string {
  const dayText = extractDays(t)
    .map((d) =>
      [
        d.title,
        d.description ?? "",
        ...d.activities.map((a) => `${a.activity} ${a.location} ${a.notes ?? ""}`),
      ].join(" "),
    )
    .join(" ");
  return `${t.finalText} ${dayText}`.toLowerCase();
}

/**
 * Content requirements per case: required topic coverage (each group of
 * alternatives must be hit at least once) and forbidden terms (e.g. a beginner
 * case must not be steered onto a technical 8000 m climb).
 */
export function gradeContent(c: EvalCase, t: EvalTranscript): GradeResult {
  const text = haystack(t);
  const problems: string[] = [];
  let checks = 0;

  for (const group of c.expectations.mustMentionAny ?? []) {
    checks++;
    if (!group.some((term) => text.includes(term.toLowerCase()))) {
      problems.push(`missing any of: ${group.join(" / ")}`);
    }
  }

  for (const banned of c.expectations.mustNotMention ?? []) {
    checks++;
    if (text.includes(banned.toLowerCase())) problems.push(`mentions forbidden term: ${banned}`);
  }

  if (checks === 0) {
    return {
      grader: "content",
      score: 1,
      passed: true,
      details: "No content expectations set for this case.",
    };
  }

  const score = (checks - problems.length) / checks;
  return {
    grader: "content",
    score,
    passed: problems.length === 0,
    details:
      problems.length === 0 ? `All ${checks} content expectations met.` : problems.join("; "),
  };
}

const RISK_TERMS = [
  "acclimatis",
  "acclimatiz",
  "altitude sickness",
  "ams",
  "risk",
  "safety",
  "rescue",
  "insurance",
  "crevasse",
  "avalanche",
  "guide",
  "permit",
  "evacuation",
];

/**
 * Safety honesty: the system prompt requires being "honest about difficulty
 * levels and risks". For high-altitude or extreme cases the response must
 * acknowledge risk, acclimatisation or safety measures.
 */
export function gradeSafety(c: EvalCase, t: EvalTranscript): GradeResult {
  if (!c.expectations.requiresRiskAwareness) {
    return {
      grader: "safety",
      score: 1,
      passed: true,
      details: "Risk awareness not required for this case.",
    };
  }
  const text = haystack(t);
  const hits = RISK_TERMS.filter((term) => text.includes(term));
  const passed = hits.length > 0;
  return {
    grader: "safety",
    score: passed ? 1 : 0,
    passed,
    details: passed
      ? `Risk awareness present (${hits.slice(0, 4).join(", ")}).`
      : "High-risk trip with no mention of acclimatisation, risk, safety, permits or guiding.",
  };
}
