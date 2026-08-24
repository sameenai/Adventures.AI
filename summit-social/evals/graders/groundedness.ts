import type { EvalCase, EvalTranscript, GradeResult } from "../types";

/**
 * Words that mark a £ amount as a FLIGHT price claim when they appear within
 * CONTEXT_WINDOW chars of it (airline names harvested from tool results count
 * too). Trip-total phrasing ("£1,350 total including flights") is excluded —
 * that attributes the flight to a bundle, not a specific fare.
 */
const FLIGHT_CONTEXT =
  /\bflights?\b|\bfl(?:y|ies|ying)\b|\bfares?\b|\bairlines?\b|\bairways\b|\bairfare\b/i;
const TRIP_TOTAL_CONTEXT = /\btotal\b|\binclud|\ball-in\b|\boverall\b|\bbudget\b/i;
const CONTEXT_WINDOW = 80;

interface FlightSearchEvidence {
  /** True when at least one search_flights call has a recorded result. */
  resultsRecorded: boolean;
  /** Every priceGBP value found in search_flights results, rounded to whole £. */
  prices: Set<number>;
  /** Airline/carrier names found in search_flights results. */
  airlines: string[];
}

function walk(value: unknown, evidence: FlightSearchEvidence): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, evidence);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key === "priceGBP" && typeof val === "number") evidence.prices.add(Math.round(val));
    else if (
      (key === "airline" || key === "carrier") &&
      typeof val === "string" &&
      val.length > 0
    ) {
      evidence.airlines.push(val);
    } else walk(val, evidence);
  }
}

function collectFlightSearchEvidence(t: EvalTranscript): FlightSearchEvidence {
  const evidence: FlightSearchEvidence = {
    resultsRecorded: false,
    prices: new Set(),
    airlines: [],
  };
  for (const call of t.toolCalls) {
    if (call.name !== "search_flights" || !call.id) continue;
    const raw = t.toolResults?.[call.id];
    if (raw === undefined) continue;
    evidence.resultsRecorded = true;
    let result: unknown = raw;
    if (typeof raw === "string") {
      try {
        result = JSON.parse(raw) as unknown;
      } catch {
        continue;
      }
    }
    walk(result, evidence);
  }
  return evidence;
}

interface PriceClaim {
  valueGBP: number;
  context: string;
}

/** Every £/GBP amount in the text along with its ±CONTEXT_WINDOW char context. */
function extractPriceClaims(text: string): PriceClaim[] {
  const claims: PriceClaim[] = [];
  const pattern = /(?:£|GBP\s?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
  let match = pattern.exec(text);
  while (match !== null) {
    const valueGBP = Number.parseInt(match[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(valueGBP)) {
      const start = Math.max(0, match.index - CONTEXT_WINDOW);
      const end = Math.min(text.length, match.index + match[0].length + CONTEXT_WINDOW);
      claims.push({ valueGBP, context: text.slice(start, end) });
    }
    match = pattern.exec(text);
  }
  return claims;
}

function isFlightAttributed(claim: PriceClaim, airlines: string[]): boolean {
  const lower = claim.context.toLowerCase();
  const flightContext =
    FLIGHT_CONTEXT.test(claim.context) || airlines.some((a) => lower.includes(a.toLowerCase()));
  return flightContext && !TRIP_TOTAL_CONTEXT.test(claim.context);
}

/**
 * Flight-price groundedness: when the transcript records search_flights
 * results, every £ amount in the final text attributed to a flight (near
 * flight/fare/airline wording, or an airline name from the results) must
 * match a priceGBP those results actually returned. An assistant that
 * searched and then invented a fare fails here.
 *
 * Transcripts with no recorded search_flights results are not assessable —
 * quoting ballpark market fares without searching is a toolUse/content
 * concern, not a grounding one.
 */
export function gradeGroundedness(_c: EvalCase, t: EvalTranscript): GradeResult {
  const evidence = collectFlightSearchEvidence(t);
  if (!evidence.resultsRecorded) {
    return {
      grader: "groundedness",
      score: 1,
      passed: true,
      details: "No search_flights results recorded — flight-price grounding not assessable.",
    };
  }

  const claims = extractPriceClaims(t.finalText).filter((c) =>
    isFlightAttributed(c, evidence.airlines),
  );
  if (claims.length === 0) {
    return {
      grader: "groundedness",
      score: 1,
      passed: true,
      details: "No flight-attributed prices claimed in the final text.",
    };
  }

  const untraced = claims.filter((c) => !evidence.prices.has(c.valueGBP));
  const score = (claims.length - untraced.length) / claims.length;
  return {
    grader: "groundedness",
    score,
    passed: untraced.length === 0,
    details:
      untraced.length === 0
        ? `All ${claims.length} flight price(s) trace to search_flights results.`
        : `Invented flight price(s) not present in any search_flights result: ${untraced
            .map((c) => `£${c.valueGBP}`)
            .join(", ")}.`,
  };
}
