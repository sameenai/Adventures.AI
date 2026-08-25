// Thumbs feedback on assistant replies: ownership, index validation, the
// conversation snapshot, and upsert-on-re-rate semantics.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    itinerary: { findUnique: vi.fn() },
    messageFeedback: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/analytics/track", () => ({ track: vi.fn() }));

import { POST as feedback } from "@/app/api/chat/feedback/route";
import { track } from "@/lib/analytics/track";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  itinerary: { findUnique: ReturnType<typeof vi.fn> };
  messageFeedback: { upsert: ReturnType<typeof vi.fn> };
};

const route = { params: Promise.resolve({}) };
const req = (body: unknown) =>
  new NextRequest("http://localhost/api/chat/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// A realistic stored history: tool plumbing between the visible messages.
const history = [
  { role: "user", content: "2 weeks trekking in Nepal" },
  { role: "assistant", content: "Great — here is a plan for the Khumbu." },
  { role: "user", content: "Any flights from London?" },
  {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: "call_1",
        type: "function",
        function: { name: "search_flights", arguments: '{"origin":"LHR","destination":"KTM"}' },
      },
    ],
  },
  { role: "tool", tool_call_id: "call_1", content: '{"success":true,"results":[]}' },
  { role: "assistant", content: "Qatar Airways via Doha is the strongest option." },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user-1" } });
  vi.mocked(rateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 });
  p.itinerary.findUnique.mockResolvedValue({ chatHistory: history });
  p.messageFeedback.upsert.mockImplementation((args: { create: Record<string, unknown> }) =>
    Promise.resolve({ id: "fb-1", ...args.create }),
  );
});

describe("POST /api/chat/feedback", () => {
  it("401s without a session", async () => {
    mockSession.mockResolvedValue(null);
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 5, rating: "UP" }), route);
    expect(res.status).toBe(401);
  });

  it("404s for an itinerary the caller does not own", async () => {
    p.itinerary.findUnique.mockResolvedValue(null);
    const res = await feedback(req({ itineraryId: "it-2", messageIndex: 5, rating: "UP" }), route);
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("NOT_FOUND");
    // The ownership scope is in the query itself — no post-hoc comparison.
    expect(p.itinerary.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "it-2", userId: "user-1" } }),
    );
    expect(p.messageFeedback.upsert).not.toHaveBeenCalled();
  });

  it("400s when messageIndex is out of range", async () => {
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 99, rating: "UP" }), route);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_MESSAGE_INDEX");
  });

  it("400s when the message at messageIndex is not an assistant reply", async () => {
    // Index 2 is a user message.
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 2, rating: "DOWN" }), route);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_MESSAGE_INDEX");
  });

  it("400s on a tool-call plumbing entry (assistant role, null content)", async () => {
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 3, rating: "DOWN" }), route);
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("INVALID_MESSAGE_INDEX");
  });

  it("rejects malformed bodies (negative index, unknown rating, oversize comment)", async () => {
    for (const body of [
      { itineraryId: "it-1", messageIndex: -1, rating: "UP" },
      { itineraryId: "it-1", messageIndex: 1.5, rating: "UP" },
      { itineraryId: "it-1", messageIndex: 5, rating: "MEH" },
      { itineraryId: "it-1", messageIndex: 5, rating: "DOWN", comment: "x".repeat(501) },
    ]) {
      const res = await feedback(req(body), route);
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe("VALIDATION_ERROR");
    }
    expect(p.messageFeedback.upsert).not.toHaveBeenCalled();
  });

  it("stores the rating with a snapshot up to and including the rated reply", async () => {
    const res = await feedback(
      req({ itineraryId: "it-1", messageIndex: 5, rating: "DOWN", comment: "Fares look invented" }),
      route,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.feedback).toMatchObject({ id: "fb-1", rating: "DOWN", messageIndex: 5 });

    expect(p.messageFeedback.upsert).toHaveBeenCalledWith({
      where: {
        userId_itineraryId_messageIndex: {
          userId: "user-1",
          itineraryId: "it-1",
          messageIndex: 5,
        },
      },
      update: {
        rating: "DOWN",
        comment: "Fares look invented",
        transcript: history.slice(0, 6),
        exportedAt: null,
      },
      create: {
        userId: "user-1",
        itineraryId: "it-1",
        messageIndex: 5,
        rating: "DOWN",
        comment: "Fares look invented",
        transcript: history.slice(0, 6),
      },
    });
    // The snapshot ends AT the rated reply and carries the tool plumbing.
    const transcript = p.messageFeedback.upsert.mock.calls[0][0].create.transcript;
    expect(transcript).toHaveLength(6);
    expect(transcript[5].content).toBe("Qatar Airways via Doha is the strongest option.");
    expect(transcript[4].role).toBe("tool");
  });

  it("can rate an earlier assistant reply mid-conversation", async () => {
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 1, rating: "DOWN" }), route);
    expect(res.status).toBe(201);
    const transcript = p.messageFeedback.upsert.mock.calls[0][0].create.transcript;
    expect(transcript).toHaveLength(2);
    expect(transcript[1].content).toBe("Great — here is a plan for the Khumbu.");
  });

  it("re-rating replaces the row for the (user, itinerary, index) triple", async () => {
    // The row already exists, so upsert's update path runs: the same triple
    // still ends with exactly one row and the latest rating wins.
    p.messageFeedback.upsert.mockImplementation((args: { update: Record<string, unknown> }) =>
      Promise.resolve({ id: "fb-1", messageIndex: 5, ...args.update }),
    );
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 5, rating: "UP" }), route);
    expect(res.status).toBe(201);
    expect((await res.json()).feedback).toMatchObject({ id: "fb-1", rating: "UP" });

    // One atomic upsert keyed on the compound unique — no delete/create race.
    expect(p.messageFeedback.upsert).toHaveBeenCalledTimes(1);
    const args = p.messageFeedback.upsert.mock.calls[0][0];
    expect(args.where).toEqual({
      userId_itineraryId_messageIndex: { userId: "user-1", itineraryId: "it-1", messageIndex: 5 },
    });
    // The update path overwrites the rating and re-arms the eval export.
    expect(args.update).toMatchObject({ rating: "UP", exportedAt: null });
  });

  it("tracks feedback_submitted with the rating only (no free text)", async () => {
    await feedback(
      req({ itineraryId: "it-1", messageIndex: 5, rating: "DOWN", comment: "too vague" }),
      route,
    );
    expect(track).toHaveBeenCalledWith("feedback_submitted", {
      userId: "user-1",
      props: { rating: "DOWN" },
    });
  });

  it("429s when the feedback rate limit is exhausted", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false, retryAfter: 120 });
    const res = await feedback(req({ itineraryId: "it-1", messageIndex: 5, rating: "UP" }), route);
    expect(res.status).toBe(429);
    expect(p.messageFeedback.upsert).not.toHaveBeenCalled();
  });
});
