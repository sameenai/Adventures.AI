import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractGbpAmounts, gradeBudget } from "../../evals/graders/budget";
import { gradeContent, gradeSafety } from "../../evals/graders/content";
import { gradeDays } from "../../evals/graders/days";
import { gradeGeography, haversineKm } from "../../evals/graders/geography";
import { gradeGroundedness } from "../../evals/graders/groundedness";
import { gradeCase } from "../../evals/graders/index";
import { gradeStructure } from "../../evals/graders/structure";
import { gradeToolUse } from "../../evals/graders/tools";
import { computePromptSnapshotHash } from "../../evals/snapshot";
import type { EvalCase, EvalTranscript } from "../../evals/types";

const EVALS_DIR = join(__dirname, "..", "..", "evals");

function makeCase(overrides: Partial<EvalCase> = {}): EvalCase {
  return {
    id: "test-case",
    persona: "test",
    description: "test",
    message: "plan a trip",
    expectations: {},
    ...overrides,
  };
}

function makeTranscript(overrides: Partial<EvalTranscript> = {}): EvalTranscript {
  return {
    caseId: "test-case",
    source: "golden",
    toolCalls: [],
    days: [],
    finalText: "",
    ...overrides,
  };
}

const validDay = (n: number, lat = 46.05, lng = 14.5) => ({
  dayNumber: n,
  title: `Day ${n} title`,
  activities: [{ time: "09:00", activity: `Activity ${n}`, location: `Place ${n}`, lat, lng }],
});

describe("haversineKm", () => {
  it("computes known distances", () => {
    // London to Paris ~344 km
    const km = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(360);
  });

  it("returns 0 for identical points", () => {
    expect(haversineKm(27.7, 85.3, 27.7, 85.3)).toBe(0);
  });
});

describe("extractGbpAmounts", () => {
  it("extracts plain and comma-separated amounts", () => {
    expect(extractGbpAmounts("costs £1,800 or GBP 400 or £95")).toEqual([1800, 400, 95]);
  });

  it("returns empty for text without amounts", () => {
    expect(extractGbpAmounts("a lovely trip with no prices")).toEqual([]);
  });
});

describe("gradeStructure", () => {
  it("passes when all days validate", () => {
    const t = makeTranscript({ days: [validDay(1), validDay(2)] });
    const g = gradeStructure(makeCase(), t);
    expect(g.passed).toBe(true);
    expect(g.score).toBe(1);
  });

  it("fails when a day is malformed", () => {
    const t = makeTranscript({ days: [validDay(1), { dayNumber: 2, activities: "not-an-array" }] });
    const g = gradeStructure(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.score).toBe(0.5);
  });

  it("falls back to inline JSON when no tool days exist", () => {
    const t = makeTranscript({
      finalText: `\`\`\`json\n${JSON.stringify({ title: "Trip", days: [validDay(1)] })}\n\`\`\``,
    });
    expect(gradeStructure(makeCase(), t).passed).toBe(true);
  });

  it("fails when nothing structured is produced", () => {
    expect(gradeStructure(makeCase(), makeTranscript({ finalText: "prose only" })).passed).toBe(
      false,
    );
  });
});

describe("gradeDays", () => {
  it("passes unique contiguous days", () => {
    const t = makeTranscript({ days: [validDay(1), validDay(2), validDay(3)] });
    expect(gradeDays(makeCase(), t).passed).toBe(true);
  });

  it("fails on repeated titles", () => {
    const dup = { ...validDay(2), title: "Day 1 title" };
    const t = makeTranscript({ days: [validDay(1), dup] });
    const g = gradeDays(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("repeats title");
  });

  it("fails on non-contiguous numbering", () => {
    const t = makeTranscript({ days: [validDay(1), validDay(3)] });
    const g = gradeDays(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("not contiguous");
  });

  it("enforces the case day-count range", () => {
    const c = makeCase({ expectations: { dayCountMin: 3 } });
    const t = makeTranscript({ days: [validDay(1), validDay(2)] });
    const g = gradeDays(c, t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("at least 3");
  });
});

describe("gradeGeography", () => {
  it("passes short legs", () => {
    const t = makeTranscript({ days: [validDay(1, 46.05, 14.5), validDay(2, 46.36, 14.09)] });
    expect(gradeGeography(makeCase(), t).passed).toBe(true);
  });

  it("fails a teleport with no transit", () => {
    const t = makeTranscript({ days: [validDay(1, 46.05, 14.5), validDay(2, 41.39, 2.17)] });
    const g = gradeGeography(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("km jump");
  });

  it("excuses long legs with explicit transit", () => {
    const flight = {
      dayNumber: 2,
      title: "Fly onward",
      activities: [
        { time: "09:00", activity: "Flight to Barcelona", location: "BCN", lat: 41.39, lng: 2.17 },
      ],
    };
    const t = makeTranscript({ days: [validDay(1, 46.05, 14.5), flight] });
    expect(gradeGeography(makeCase(), t).passed).toBe(true);
  });

  it("is neutral with fewer than two geocoded points", () => {
    const g = gradeGeography(makeCase(), makeTranscript({ days: [validDay(1)] }));
    expect(g.passed).toBe(true);
    expect(g.score).toBe(0.5);
  });
});

describe("gradeBudget", () => {
  it("passes under the ceiling with tolerance", () => {
    const c = makeCase({ expectations: { budgetCeilingGBP: 1000 } });
    const g = gradeBudget(c, makeTranscript({ finalText: "Total: £1,100" }));
    expect(g.passed).toBe(true);
  });

  it("fails over the ceiling", () => {
    const c = makeCase({ expectations: { budgetCeilingGBP: 800 } });
    const g = gradeBudget(c, makeTranscript({ finalText: "Total: £2,500" }));
    expect(g.passed).toBe(false);
    expect(g.score).toBeLessThan(0.5);
  });

  it("half-scores when no amounts are quoted", () => {
    const g = gradeBudget(makeCase(), makeTranscript({ finalText: "a plan with no prices" }));
    expect(g.score).toBe(0.5);
  });
});

describe("gradeGroundedness", () => {
  const flightCall = {
    id: "call_1",
    name: "search_flights",
    arguments: { origin: "LHR", destination: "KTM", departureDate: "2026-10-02" },
  };
  const resultsWith = (prices: number[]) => ({
    call_1: {
      success: true,
      results: prices.map((priceGBP) => ({ airline: "Qatar Airways", priceGBP })),
    },
  });

  it("passes when all flight prices trace to search_flights results", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: resultsWith([620, 780]),
      finalText: "Best fares are £620 with Qatar Airways or £780 via Delhi.",
    });
    const g = gradeGroundedness(makeCase(), t);
    expect(g.passed).toBe(true);
    expect(g.score).toBe(1);
  });

  it("fails an invented flight fare", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: resultsWith([620]),
      finalText: "I found a direct flight for just £249 return — a steal.",
    });
    const g = gradeGroundedness(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("£249");
  });

  it("fails a fare invented against empty search results", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: { call_1: { success: true, results: [] } },
      finalText: "British Airways flies this route for £310 return.",
    });
    expect(gradeGroundedness(makeCase(), t).passed).toBe(false);
  });

  it("attributes a price via an airline name from the results", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: resultsWith([620]),
      finalText: "Qatar Airways will get you there for £999 return.",
    });
    expect(gradeGroundedness(makeCase(), t).passed).toBe(false);
  });

  it("passes when no flight-attributed prices are claimed", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: resultsWith([620]),
      finalText: "Guesthouses run about £45 a night and dinner is £15.",
    });
    expect(gradeGroundedness(makeCase(), t).passed).toBe(true);
  });

  it("treats trip totals including flights as non-fare claims", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: resultsWith([620]),
      finalText: "Estimated cost for two people: £1,350 total including flights from the UK.",
    });
    const g = gradeGroundedness(makeCase(), t);
    expect(g.passed).toBe(true);
  });

  it("is not assessable without recorded search_flights results", () => {
    const noResults = makeTranscript({
      toolCalls: [{ name: "search_flights", arguments: {} }],
      finalText: "Flights typically run £620–£780 return in October.",
    });
    const g = gradeGroundedness(makeCase(), noResults);
    expect(g.passed).toBe(true);
    expect(g.score).toBe(1);
    expect(g.details).toContain("not assessable");
  });

  it("parses string-encoded tool results", () => {
    const t = makeTranscript({
      toolCalls: [flightCall],
      toolResults: {
        call_1: JSON.stringify({ success: true, results: [{ priceGBP: 620 }] }),
      },
      finalText: "The cheapest flight is £620 return.",
    });
    expect(gradeGroundedness(makeCase(), t).passed).toBe(true);
  });
});

describe("gradeToolUse", () => {
  it("passes valid required tools", () => {
    const c = makeCase({ expectations: { requiredTools: ["search_flights"] } });
    const t = makeTranscript({
      toolCalls: [
        {
          name: "search_flights",
          arguments: { origin: "LHR", destination: "KTM", departureDate: "2026-10-02" },
        },
      ],
    });
    expect(gradeToolUse(c, t).passed).toBe(true);
  });

  it("fails on hallucinated tools", () => {
    const t = makeTranscript({ toolCalls: [{ name: "book_flight", arguments: {} }] });
    const g = gradeToolUse(makeCase(), t);
    expect(g.passed).toBe(false);
    expect(g.details).toContain("hallucinated");
  });

  it("fails on invalid IATA codes", () => {
    const t = makeTranscript({
      toolCalls: [
        {
          name: "search_flights",
          arguments: { origin: "London", destination: "KTM", departureDate: "2026-10-02" },
        },
      ],
    });
    expect(gradeToolUse(makeCase(), t).passed).toBe(false);
  });

  it("fails when a required tool was not called", () => {
    const c = makeCase({ expectations: { requiredTools: ["search_adventures"] } });
    expect(gradeToolUse(c, makeTranscript()).passed).toBe(false);
  });
});

describe("gradeContent and gradeSafety", () => {
  it("requires one term per group", () => {
    const c = makeCase({
      expectations: { mustMentionAny: [["namche", "lukla"]], mustNotMention: ["jet ski"] },
    });
    expect(gradeContent(c, makeTranscript({ finalText: "via Namche Bazaar" })).passed).toBe(true);
    expect(gradeContent(c, makeTranscript({ finalText: "generic plan" })).passed).toBe(false);
    expect(gradeContent(c, makeTranscript({ finalText: "namche then jet ski" })).passed).toBe(
      false,
    );
  });

  it("safety requires risk language only when the case demands it", () => {
    const risky = makeCase({ expectations: { requiresRiskAwareness: true } });
    expect(
      gradeSafety(risky, makeTranscript({ finalText: "acclimatisation matters" })).passed,
    ).toBe(true);
    expect(gradeSafety(risky, makeTranscript({ finalText: "it will be fun" })).passed).toBe(false);
    expect(gradeSafety(makeCase(), makeTranscript({ finalText: "fun" })).passed).toBe(true);
  });
});

describe("gradeCase", () => {
  it("skips itinerary-shape graders for conversational cases", () => {
    const c = makeCase();
    const result = gradeCase(c, makeTranscript({ finalText: "What dates suit you?" }), "t");
    const names = result.grades.map((g) => g.grader);
    expect(names).not.toContain("structure");
    expect(names).not.toContain("days");
    expect(names).toContain("toolUse");
  });

  it("applies all graders when days are expected", () => {
    const c = makeCase({ expectations: { dayCountMin: 1 } });
    const result = gradeCase(c, makeTranscript({ days: [validDay(1)] }), "t");
    expect(result.grades.map((g) => g.grader)).toContain("structure");
  });
});

describe("prompt snapshot", () => {
  it("is deterministic and matches the committed snapshot", () => {
    const hash = computePromptSnapshotHash();
    expect(hash).toBe(computePromptSnapshotHash());
    const stored = JSON.parse(readFileSync(join(EVALS_DIR, "prompt-snapshot.json"), "utf8")) as {
      hash: string;
    };
    expect(stored.hash).toBe(hash);
  });
});

describe("committed transcripts", () => {
  const cases = JSON.parse(
    readFileSync(join(EVALS_DIR, "datasets", "itinerary-cases.json"), "utf8"),
  ) as EvalCase[];
  const byId = new Map(cases.map((c) => [c.id, c]));

  const load = (dir: string) =>
    readdirSync(join(EVALS_DIR, "transcripts", dir))
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: `${dir}/${f}`,
        transcript: JSON.parse(
          readFileSync(join(EVALS_DIR, "transcripts", dir, f), "utf8"),
        ) as EvalTranscript,
      }));

  it("every golden transcript passes every applicable grader", () => {
    for (const { name, transcript } of load("golden")) {
      const evalCase = byId.get(transcript.caseId);
      expect(evalCase, `${name} references unknown case`).toBeDefined();
      if (!evalCase) continue;
      const result = gradeCase(evalCase, transcript, name);
      const failures = result.grades.filter((g) => !g.passed);
      expect(
        failures,
        `${name}: ${failures.map((f) => `${f.grader}(${f.details})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("every adversarial transcript is caught by its expected graders", () => {
    for (const { name, transcript } of load("adversarial")) {
      const evalCase = byId.get(transcript.caseId);
      expect(evalCase, `${name} references unknown case`).toBeDefined();
      if (!evalCase) continue;
      expect(transcript.expectedFailures?.length, `${name} missing expectedFailures`).toBeTruthy();
      const result = gradeCase(evalCase, transcript, name);
      for (const graderName of transcript.expectedFailures ?? []) {
        const grade = result.grades.find((g) => g.grader === graderName);
        expect(grade, `${name}: grader ${graderName} did not run`).toBeDefined();
        expect(grade?.passed, `${name}: ${graderName} should have failed but passed`).toBe(false);
      }
    }
  });
});
