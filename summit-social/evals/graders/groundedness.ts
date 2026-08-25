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

/** Parse a raw tool result (JSON string or already-parsed value), or undefined on bad JSON. */
function parseToolResult(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
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
    walk(parseToolResult(raw), evidence);
  }
  return evidence;
}

interface WeatherEvidence {
  /** True when at least one get_weather_forecast call has a recorded result. */
  resultsRecorded: boolean;
  /** Every temperature figure found in the results, rounded to whole degrees. */
  temperatures: Set<number>;
}

/** Result keys whose numeric values read as temperatures. */
const TEMP_KEY = /temp|celsius|fahrenheit|degc|degf|high|low/i;
/** Degree figures embedded in result strings, e.g. "typical highs of 18°C". */
const TEMP_IN_STRING = /(-?\d{1,3}(?:\.\d+)?)\s*°\s*[cf]\b/gi;

function walkWeather(value: unknown, evidence: WeatherEvidence): void {
  if (Array.isArray(value)) {
    for (const item of value) walkWeather(item, evidence);
    return;
  }
  if (typeof value === "string") {
    for (const m of value.matchAll(TEMP_IN_STRING)) {
      evidence.temperatures.add(Math.round(Number.parseFloat(m[1])));
    }
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (TEMP_KEY.test(key) && typeof val === "number") evidence.temperatures.add(Math.round(val));
    else walkWeather(val, evidence);
  }
}

function collectWeatherEvidence(t: EvalTranscript): WeatherEvidence {
  const evidence: WeatherEvidence = { resultsRecorded: false, temperatures: new Set() };
  for (const call of t.toolCalls) {
    if (call.name !== "get_weather_forecast" || !call.id) continue;
    const raw = t.toolResults?.[call.id];
    if (raw === undefined) continue;
    evidence.resultsRecorded = true;
    walkWeather(parseToolResult(raw), evidence);
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

interface TemperatureClaim {
  /** Rounded whole-degree figure claimed. */
  value: number;
  /** The exact text matched, e.g. "18°C" — used in failure details. */
  display: string;
}

/** Temperature figures in the final text: "18°C", "-5 °F", "18 degrees Celsius". */
const TEMP_CLAIM = /(-?\d{1,3}(?:\.\d+)?)\s*(?:°\s*([cf])\b|degrees\s+(celsius|fahrenheit))/gi;

function extractTemperatureClaims(text: string): TemperatureClaim[] {
  const claims: TemperatureClaim[] = [];
  for (const m of text.matchAll(TEMP_CLAIM)) {
    const value = Math.round(Number.parseFloat(m[1]));
    if (!Number.isNaN(value)) claims.push({ value, display: m[0].trim() });
  }
  return claims;
}

/**
 * Groundedness: figures in the final text must trace to recorded tool results.
 *
 * Flight prices — when the transcript records search_flights results, every
 * £ amount attributed to a flight (near flight/fare/airline wording, or an
 * airline name from the results) must match a priceGBP those results actually
 * returned. An assistant that searched and then invented a fare fails here.
 *
 * Temperatures — when the transcript records get_weather_forecast results,
 * every °C/°F (or "degrees Celsius/Fahrenheit") figure must appear in those
 * results. A failed weather lookup records no figures, so quoting "average
 * highs of 18°C" against it is a fabrication and fails.
 *
 * Transcripts with neither tool's results recorded are not assessable —
 * quoting ballpark market fares or typical climate without the tool is a
 * toolUse/content concern, not a grounding one.
 */
export function gradeGroundedness(_c: EvalCase, t: EvalTranscript): GradeResult {
  const flights = collectFlightSearchEvidence(t);
  const weather = collectWeatherEvidence(t);

  if (!flights.resultsRecorded && !weather.resultsRecorded) {
    return {
      grader: "groundedness",
      score: 1,
      passed: true,
      details:
        "No search_flights or get_weather_forecast results recorded — grounding not assessable.",
    };
  }

  const fareClaims = flights.resultsRecorded
    ? extractPriceClaims(t.finalText).filter((c) => isFlightAttributed(c, flights.airlines))
    : [];
  const tempClaims = weather.resultsRecorded ? extractTemperatureClaims(t.finalText) : [];
  const totalClaims = fareClaims.length + tempClaims.length;

  if (totalClaims === 0) {
    return {
      grader: "groundedness",
      score: 1,
      passed: true,
      details: "No flight-attributed prices or temperature figures claimed in the final text.",
    };
  }

  const untracedFares = fareClaims.filter((c) => !flights.prices.has(c.valueGBP));
  const untracedTemps = tempClaims.filter((c) => !weather.temperatures.has(c.value));
  const untraced = untracedFares.length + untracedTemps.length;
  const problems: string[] = [];
  if (untracedFares.length > 0) {
    problems.push(
      `Invented flight price(s) not present in any search_flights result: ${untracedFares
        .map((c) => `£${c.valueGBP}`)
        .join(", ")}.`,
    );
  }
  if (untracedTemps.length > 0) {
    problems.push(
      `Invented temperature(s) not present in any get_weather_forecast result: ${untracedTemps
        .map((c) => c.display)
        .join(", ")}.`,
    );
  }

  return {
    grader: "groundedness",
    score: (totalClaims - untraced) / totalClaims,
    passed: untraced === 0,
    details:
      untraced === 0
        ? `All ${totalClaims} claimed figure(s) trace to recorded tool results.`
        : problems.join(" "),
  };
}
