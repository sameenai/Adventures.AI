import type { EvalCase, EvalTranscript, GradeResult } from "../types";
import { extractDays } from "./days";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

const TRANSIT_WORDS = /flight|fly|flying|airport|train|rail|drive|driving|bus|transfer|ferry|boat/i;

/**
 * "Do not teleport": consecutive activities with coordinates must be within a
 * plausible distance unless the activity text signals explicit transit.
 * Default ceiling 400 km per leg (case can override via maxLegKm).
 */
export function gradeGeography(c: EvalCase, t: EvalTranscript): GradeResult {
  const days = extractDays(t);
  const maxLegKm = c.expectations.maxLegKm ?? 400;

  const points: Array<{ lat: number; lng: number; label: string; transit: boolean }> = [];
  for (const d of days) {
    for (const a of d.activities) {
      if (typeof a.lat === "number" && typeof a.lng === "number") {
        points.push({
          lat: a.lat,
          lng: a.lng,
          label: `day ${d.dayNumber}: ${a.activity}`,
          transit: TRANSIT_WORDS.test(`${a.activity} ${a.notes ?? ""}`),
        });
      }
    }
  }

  if (points.length < 2) {
    return {
      grader: "geography",
      score: 0.5,
      passed: true,
      details: "Fewer than two geocoded activities — geographic coherence not assessable.",
    };
  }

  const violations: string[] = [];
  let legs = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    legs++;
    const km = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
    if (km > maxLegKm && !prev.transit && !curr.transit) {
      violations.push(`${Math.round(km)} km jump from "${prev.label}" to "${curr.label}"`);
    }
  }

  const score = legs === 0 ? 1 : (legs - violations.length) / legs;
  return {
    grader: "geography",
    score,
    passed: violations.length === 0,
    details:
      violations.length === 0
        ? `${legs} legs all within ${maxLegKm} km or explicit transit.`
        : violations.slice(0, 3).join("; "),
  };
}
