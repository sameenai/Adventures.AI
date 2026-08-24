import type { CaseResult, EvalCase, EvalTranscript, GradeResult } from "../types";
import { gradeBudget } from "./budget";
import { gradeContent, gradeSafety } from "./content";
import { gradeDays } from "./days";
import { gradeGeography } from "./geography";
import { gradeStructure } from "./structure";
import { gradeToolUse } from "./tools";

export type Grader = (c: EvalCase, t: EvalTranscript) => GradeResult;

export const GRADERS: Record<string, Grader> = {
  structure: gradeStructure,
  days: gradeDays,
  geography: gradeGeography,
  budget: gradeBudget,
  toolUse: gradeToolUse,
  content: gradeContent,
  safety: gradeSafety,
};

/**
 * Conversational cases (no day-count expectation and no days produced) skip
 * the itinerary-shape graders — a clarifying question is a legitimate
 * response to an under-specified request.
 */
function applicableGraders(c: EvalCase, t: EvalTranscript): string[] {
  const wantsItinerary = c.expectations.dayCountMin !== undefined || t.days.length > 0;
  return Object.keys(GRADERS).filter((name) => {
    if (!wantsItinerary && ["structure", "days", "geography"].includes(name)) return false;
    return true;
  });
}

export function gradeCase(c: EvalCase, t: EvalTranscript, transcriptName: string): CaseResult {
  const grades = applicableGraders(c, t).map((name) => GRADERS[name](c, t));
  const score = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
  return {
    caseId: c.id,
    transcript: transcriptName,
    source: t.source,
    grades,
    score: Number(score.toFixed(4)),
    passed: grades.every((g) => g.passed),
  };
}
