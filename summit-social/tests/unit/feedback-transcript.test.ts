// The feedback → candidate shaper: pure, DB-free, so a production snapshot is
// provably turned into an EvalTranscript-shaped scaffold the harness can use.
import { describe, expect, it } from "vitest";
import {
  type FeedbackRowLike,
  feedbackToCandidateTranscript,
} from "../../evals/feedback-transcript";

const baseRow: FeedbackRowLike = {
  id: "fb-123",
  itineraryId: "it-1",
  messageIndex: 5,
  rating: "DOWN",
  comment: "The fare looks invented",
  transcript: [],
  createdAt: new Date("2026-08-25T12:00:00.000Z"),
};

// A realistic snapshot: two user turns, tool plumbing, a day revision.
const snapshot = [
  { role: "user", content: "2 weeks trekking in Nepal, budget £3,000" },
  {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: "call_days",
        type: "function",
        function: {
          name: "create_itinerary_day",
          arguments: '{"dayNumber":1,"title":"Arrive in Kathmandu"}',
        },
      },
    ],
  },
  { role: "tool", tool_call_id: "call_days", content: '{"success":true}' },
  { role: "assistant", content: "Here is your two-week plan starting in Kathmandu." },
  { role: "user", content: "Any flights from London? And redo day 1 for Pokhara." },
  {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: "call_fs",
        type: "function",
        function: {
          name: "search_flights",
          arguments: '{"origin":"LHR","destination":"KTM"}',
        },
      },
      {
        id: "call_day_rev",
        type: "function",
        function: {
          name: "create_itinerary_day",
          arguments: '{"dayNumber":1,"title":"Arrive in Pokhara"}',
        },
      },
    ],
  },
  { role: "tool", tool_call_id: "call_fs", content: '{"success":true,"results":[{"priceGBP":620}]}' },
  { role: "tool", tool_call_id: "call_day_rev", content: "plain-text ack" },
  { role: "assistant", content: "Qatar Airways via Doha, £620 return. Day 1 now starts in Pokhara." },
];

describe("feedbackToCandidateTranscript", () => {
  const candidate = feedbackToCandidateTranscript({ ...baseRow, transcript: snapshot });

  it("produces a candidate-source transcript keyed to the feedback row", () => {
    expect(candidate.caseId).toBe("feedback-fb-123");
    expect(candidate.source).toBe("candidate");
    expect(candidate.recordedAt).toBe("2026-08-25T12:00:00.000Z");
  });

  it("sets finalText to the rated assistant reply (the snapshot's last reply)", () => {
    expect(candidate.finalText).toBe(
      "Qatar Airways via Doha, £620 return. Day 1 now starts in Pokhara.",
    );
  });

  it("reconstructs toolCalls in order with parsed arguments", () => {
    expect(candidate.toolCalls).toEqual([
      {
        id: "call_days",
        name: "create_itinerary_day",
        arguments: { dayNumber: 1, title: "Arrive in Kathmandu" },
      },
      { id: "call_fs", name: "search_flights", arguments: { origin: "LHR", destination: "KTM" } },
      {
        id: "call_day_rev",
        name: "create_itinerary_day",
        arguments: { dayNumber: 1, title: "Arrive in Pokhara" },
      },
    ]);
  });

  it("keys toolResults by tool_call id, parsing JSON and keeping raw strings", () => {
    expect(candidate.toolResults).toEqual({
      call_days: { success: true },
      call_fs: { success: true, results: [{ priceGBP: 620 }] },
      call_day_rev: "plain-text ack",
    });
  });

  it("carries the itinerary's FINAL state in days (a re-created dayNumber is a revision)", () => {
    expect(candidate.days).toEqual([{ dayNumber: 1, title: "Arrive in Pokhara" }]);
  });

  it("records per-turn detail like multi-turn goldens", () => {
    expect(candidate.turns).toHaveLength(2);
    expect(candidate.turns?.[0]).toMatchObject({
      userMessage: "2 weeks trekking in Nepal, budget £3,000",
      finalText: "Here is your two-week plan starting in Kathmandu.",
    });
    expect(candidate.turns?.[0].toolCalls).toHaveLength(1);
    expect(candidate.turns?.[1].toolCalls?.map((tc) => tc.name)).toEqual([
      "search_flights",
      "create_itinerary_day",
    ]);
  });

  it("carries the feedback provenance in _meta", () => {
    expect(candidate._meta).toEqual({
      feedbackId: "fb-123",
      rating: "DOWN",
      comment: "The fare looks invented",
      itineraryId: "it-1",
      messageIndex: 5,
      ratedAt: "2026-08-25T12:00:00.000Z",
    });
  });

  it("tolerates a malformed snapshot: non-array, junk entries, broken arguments", () => {
    const junk = feedbackToCandidateTranscript({ ...baseRow, transcript: "not-an-array" });
    expect(junk.toolCalls).toEqual([]);
    expect(junk.days).toEqual([]);
    expect(junk.finalText).toBe("");

    const messy = feedbackToCandidateTranscript({
      ...baseRow,
      transcript: [
        null,
        42,
        { role: "assistant", content: "Reply before any user turn" },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            { id: "call_bad", type: "function", function: { name: "search_flights", arguments: "{oops" } },
            { id: "call_noname", type: "function", function: { arguments: "{}" } },
          ],
        },
        { role: "tool", tool_call_id: "call_bad", content: '{"success":false}' },
      ],
    });
    // The orphan reply survives in a synthetic turn; malformed arguments become {}.
    expect(messy.finalText).toBe("Reply before any user turn");
    expect(messy.toolCalls).toEqual([{ id: "call_bad", name: "search_flights", arguments: {} }]);
    expect(messy.toolResults).toEqual({ call_bad: { success: false } });
  });
});
