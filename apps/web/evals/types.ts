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
  /** First (or only) user turn. */
  message: string;
  /**
   * Multi-turn cases: the full ordered list of user turns. When set, live mode
   * runs each turn through the production loop with the prior conversation as
   * history. `message` stays the first turn for single-turn compatibility.
   */
  messages?: string[];
  preferences?: EvalPreferences;
  expectations: EvalExpectations;
}

export interface TranscriptToolCall {
  /** Provider tool_call id — keys the matching entry in EvalTranscript.toolResults. */
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** One user→assistant exchange within a multi-turn transcript. */
export interface TranscriptTurn {
  userMessage: string;
  /** The assistant's complete reply for this turn. */
  finalText: string;
  toolCalls?: TranscriptToolCall[];
}

export interface EvalTranscript {
  caseId: string;
  /**
   * "candidate" transcripts are generated from production thumbs-down feedback
   * (evals/from-feedback.ts). They are triage input only — the replay run loads
   * just golden/ and adversarial/ — until a human promotes them.
   */
  source: "golden" | "adversarial" | "live" | "candidate";
  /** Graders listed here are EXPECTED to fail — used to prove the harness catches bad outputs. */
  expectedFailures?: string[];
  /** All tool calls across every turn, in order. */
  toolCalls: TranscriptToolCall[];
  /**
   * Tool RESULTS keyed by tool_call id (parsed JSON or raw string). Populated
   * by live mode and by hand in goldens — the groundedness grader traces
   * quoted flight prices back to these.
   */
  toolResults?: Record<string, unknown>;
  /**
   * The itinerary's final state: create_itinerary_day arguments, in order. In
   * multi-turn transcripts a later turn re-creating a dayNumber replaces the
   * earlier version (a revision), so graders see the finished itinerary.
   */
  days: unknown[];
  /** The assistant's final reply — for multi-turn transcripts, the LAST turn's text. */
  finalText: string;
  /** Per-turn detail for multi-turn cases; absent on single-turn transcripts. */
  turns?: TranscriptTurn[];
  recordedAt?: string;
  model?: string;
  /** Total OpenAI tokens consumed producing this transcript (live mode only). */
  totalTokens?: number;
  /** Wall-clock time to produce this transcript (live mode only). */
  latencyMs?: number;
}

/** Provenance carried on candidate transcripts generated from production feedback. */
export interface CandidateMeta {
  feedbackId: string;
  rating: "UP" | "DOWN";
  /** The user's free-text comment, when they left one on the thumbs down. */
  comment: string | null;
  itineraryId: string | null;
  /** Index of the rated assistant reply in the itinerary's stored chatHistory. */
  messageIndex: number;
  ratedAt: string;
}

/**
 * What `npm run eval:candidates` writes to evals/transcripts/candidates/:
 * an EvalTranscript-shaped scaffold plus the feedback provenance, ready for a
 * human (or AI triage) to review and promote into golden/ or adversarial/.
 */
export interface CandidateTranscript extends EvalTranscript {
  source: "candidate";
  _meta: CandidateMeta;
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
  /** Live mode only — copied from the transcript for the scorecard. */
  totalTokens?: number;
  latencyMs?: number;
}

/** Soft, informational usage budgets — reported on live scorecards, never gating. */
export interface ScorecardUsage {
  totalTokens: number;
  totalLatencyMs: number;
  softTokenBudgetPerCase: number;
  softLatencyBudgetMsPerCase: number;
  casesOverTokenBudget: string[];
  casesOverLatencyBudget: string[];
}

export interface Scorecard {
  mode: "replay" | "live";
  generatedAt: string;
  promptSnapshotHash: string;
  aggregateScore: number;
  cases: CaseResult[];
  /** Live mode only — replay ignores usage entirely. */
  usage?: ScorecardUsage;
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
