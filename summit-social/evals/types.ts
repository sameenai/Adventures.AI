/**
 * Shared types for the Basecamper AI eval harness.
 *
 * The harness grades the itinerary-planning assistant (api/chat) against a
 * golden dataset of trip-planning intents. Transcripts are the unit of
 * grading: a recorded exchange (live or hand-authored) between a user
 * message and the assistant's tool calls + final text.
 */

export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface EvalPreferences {
  /** Budget in pence (mirrors api/chat's preferences.budget). */
  budget?: number;
  fitnessLevel?: FitnessLevel;
  travelDates?: { start: string; end: string };
  travellers?: number;
}

export interface EvalExpectations {
  /** Inclusive bounds on the number of distinct itinerary days produced. */
  dayCountMin?: number;
  dayCountMax?: number;
  /** Hard ceiling (GBP) the quoted trip estimate must stay under (15% tolerance applied). */
  budgetCeilingGBP?: number;
  /** Each inner array is a group of alternatives; at least one term per group must appear. */
  mustMentionAny?: string[][];
  /** Terms that must NOT appear in the response. */
  mustNotMention?: string[];
  /** Tools the assistant is expected to call for this intent. */
  requiredTools?: string[];
  /** Max plausible distance (km) between consecutive activities without explicit transit. */
  maxLegKm?: number;
  /** High-altitude / extreme trips must acknowledge risk, acclimatisation or safety. */
  requiresRiskAwareness?: boolean;
}

export interface EvalCase {
  id: string;
  persona: string;
  description: string;
  message: string;
  preferences?: EvalPreferences;
  expectations: EvalExpectations;
}

export interface TranscriptToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface EvalTranscript {
  caseId: string;
  source: "golden" | "adversarial" | "live";
  /** Graders listed here are EXPECTED to fail — used to prove the harness catches bad outputs. */
  expectedFailures?: string[];
  toolCalls: TranscriptToolCall[];
  /** Raw arguments of every create_itinerary_day call, in order. */
  days: unknown[];
  finalText: string;
  recordedAt?: string;
  model?: string;
}

export interface GradeResult {
  grader: string;
  /** 0..1 — 1 is fully passing. */
  score: number;
  passed: boolean;
  details: string;
}

export interface CaseResult {
  caseId: string;
  transcript: string;
  source: EvalTranscript["source"];
  grades: GradeResult[];
  /** Mean of grader scores. */
  score: number;
  passed: boolean;
}

export interface Scorecard {
  mode: "replay" | "live";
  generatedAt: string;
  promptSnapshotHash: string;
  aggregateScore: number;
  cases: CaseResult[];
}

export interface BaselineEntry {
  caseId: string;
  transcript: string;
  score: number;
}

export interface Baseline {
  promptSnapshotHash: string;
  aggregateScore: number;
  updatedAt: string;
  cases: BaselineEntry[];
}
