// Tests for the real OpenAI streaming path in POST /api/chat
// (the code path executed when OPENAI_API_KEY is set)

// Hoist the mock function so it's accessible both inside vi.mock and in tests.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    eval: vi.fn().mockResolvedValue([1, 3600]),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }));
  return { default: Redis };
});
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        openAiApiKey: null,
        plan: "FREE",
        aiCreditsUsed: 0,
        aiCreditsResetAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    adventure: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    itinerary: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "auto-itin-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    itineraryDay: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "day-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));
// Mock the openai npm package — the chat route creates OpenAI instances directly.
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

import { POST as chatRoute } from "@/app/api/chat/route";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockPrismaItinerary = prisma.itinerary as unknown as Record<string, ReturnType<typeof vi.fn>>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId, name: "Alice" } });
}

async function* makeAsyncStream(chunks: string[]) {
  for (const chunk of chunks) {
    yield { choices: [{ delta: { content: chunk } }] };
  }
}

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function drainStream(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("POST /api/chat — real OpenAI path", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-live-test-key";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  it("streams OpenAI chunks to the response", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["Hello ", "world"]));

    const response = await chatRoute(makeRequest({ message: "Plan my trip" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await drainStream(response);
    expect(text).toContain("Hello ");
    expect(text).toContain("world");
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await chatRoute(makeRequest({ message: "hi" }));
    expect(response.status).toBe(401);
  });

  it("persists chat history to itinerary after streaming", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["Great plan!"]));
    mockPrismaItinerary.findUnique.mockResolvedValue({ chatHistory: [] });

    const response = await chatRoute(
      makeRequest({ message: "Plan Nepal", itineraryId: "itin-42" }),
    );
    await drainStream(response);

    expect(mockPrismaItinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "itin-42", userId: "user-1" },
        data: expect.objectContaining({ chatHistory: expect.any(Array) }),
      }),
    );
  });

  it("returns 404 when the itineraryId does not belong to the caller (IDOR guard)", async () => {
    mockSession("attacker-1");
    // Ownership-scoped lookup finds nothing for this user
    mockPrismaItinerary.findUnique.mockResolvedValue(null);

    const response = await chatRoute(
      makeRequest({ message: "inject days", itineraryId: "victims-itinerary" }),
    );
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
    // No write may ever happen to the foreign itinerary
    expect(mockPrismaItinerary.update).not.toHaveBeenCalled();
    // The lookup itself must be scoped by user
    expect(mockPrismaItinerary.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "victims-itinerary", userId: "attacker-1" },
      }),
    );
  });

  it("handles streaming error gracefully (closes stream)", async () => {
    mockSession();
    async function* failingStream() {
      yield { choices: [{ delta: { content: "Start" } }] };
      throw new Error("OpenAI dropped connection");
    }
    mockCreate.mockResolvedValue(failingStream());

    const response = await chatRoute(makeRequest({ message: "Plan" }));
    expect(response.status).toBe(200);
    const text = await drainStream(response);
    expect(text).toContain("Start");
  });

  it("auto-creates an itinerary and persists history even when no itineraryId supplied", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["Done"]));

    const response = await chatRoute(makeRequest({ message: "Quick question" }));
    await drainStream(response);

    // Route always creates an itinerary record and saves history
    expect(mockPrismaItinerary.create).toHaveBeenCalled();
    expect(mockPrismaItinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "auto-itin-1", userId: "user-1" },
        data: expect.objectContaining({ chatHistory: expect.any(Array) }),
      }),
    );
  });

  it("processes tool calls when finish_reason is tool_calls", async () => {
    mockSession();

    // First stream: tool call delta chunks
    async function* toolCallStream() {
      // chunk 1: start of tool call
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call-1",
                  function: { name: "search_fl", arguments: "" },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };
      // chunk 2: finish reason
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                { index: 0, id: "", function: { name: "ights", arguments: '{"origin":"LHR"}' } },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      };
    }

    // Second stream: follow-up response
    mockCreate
      .mockResolvedValueOnce(toolCallStream())
      .mockResolvedValueOnce(makeAsyncStream(["Flight results"]));

    const response = await chatRoute(makeRequest({ message: "Find flights from LHR" }));
    expect(response.status).toBe(200);
    const text = await drainStream(response);
    expect(text).toContain("Flight results");
    // create was called twice (initial + follow-up)
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("handles create_itinerary_day tool call and persists day", async () => {
    mockSession();

    const dayArgs = JSON.stringify({
      dayNumber: 1,
      title: "Arrival",
      description: "Fly in",
      activities: [],
    });

    async function* itineraryToolStream() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call-itin",
                  function: { name: "create_itinerary_day", arguments: dayArgs },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      };
      yield {
        choices: [{ delta: {}, finish_reason: "tool_calls" }],
      };
    }

    mockCreate
      .mockResolvedValueOnce(itineraryToolStream())
      .mockResolvedValueOnce(makeAsyncStream(["Here's your itinerary"]));

    const response = await chatRoute(makeRequest({ message: "Plan day 1" }));
    expect(response.status).toBe(200);
    const text = await drainStream(response);
    expect(text).toContain("Here's your itinerary");
  });
});

// ---------------------------------------------------------------------------
// AI credit metering — the monetization gate
// ---------------------------------------------------------------------------
describe("POST /api/chat — credit metering", () => {
  const mockPrismaUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-live-test-key";
    mockPrismaUser.findUnique.mockResolvedValue({
      openAiApiKey: null,
      plan: "FREE",
      aiCreditsUsed: 0,
      aiCreditsResetAt: new Date(),
    });
    mockPrismaUser.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  it("charges one credit per message with a conditional atomic increment", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["ok"]));

    const response = await chatRoute(makeRequest({ message: "Plan my trip" }));
    await drainStream(response);

    expect(mockPrismaUser.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", aiCreditsUsed: { lt: expect.any(Number) } },
      data: { aiCreditsUsed: { increment: 1 } },
    });
  });

  it("meters resumed sessions too — itineraryId does not bypass the cap", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["ok"]));
    mockPrismaItinerary.findUnique.mockResolvedValue({ chatHistory: [] });

    const response = await chatRoute(makeRequest({ message: "more", itineraryId: "itin-42" }));
    await drainStream(response);

    expect(mockPrismaUser.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { aiCreditsUsed: { increment: 1 } } }),
    );
  });

  it("returns 402 UPGRADE_REQUIRED when the conditional increment matches no row", async () => {
    mockSession();
    mockPrismaUser.updateMany.mockResolvedValue({ count: 0 });

    const response = await chatRoute(makeRequest({ message: "Plan my trip" }));
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.code).toBe("UPGRADE_REQUIRED");
    expect(body.creditsLimit).toBeGreaterThan(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("resets the counter when the calendar month rolled over", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["ok"]));
    mockPrismaUser.findUnique.mockResolvedValue({
      openAiApiKey: null,
      plan: "FREE",
      aiCreditsUsed: 60,
      aiCreditsResetAt: new Date("2020-01-15T00:00:00Z"),
    });

    const response = await chatRoute(makeRequest({ message: "new month" }));
    await drainStream(response);

    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { aiCreditsUsed: 0, aiCreditsResetAt: expect.any(Date) },
    });
    expect(mockPrismaUser.updateMany).toHaveBeenCalled();
  });

  it("exempts PRO users from metering", async () => {
    mockSession();
    mockCreate.mockResolvedValue(makeAsyncStream(["ok"]));
    mockPrismaUser.findUnique.mockResolvedValue({
      openAiApiKey: null,
      plan: "PRO",
      aiCreditsUsed: 0,
      aiCreditsResetAt: new Date(),
    });

    const response = await chatRoute(makeRequest({ message: "pro user" }));
    await drainStream(response);

    expect(mockPrismaUser.updateMany).not.toHaveBeenCalled();
  });

  it("does not charge in demo mode (no API key anywhere)", async () => {
    delete process.env.OPENAI_API_KEY;
    mockSession();

    const response = await chatRoute(makeRequest({ message: "demo" }));
    expect(response.status).toBe(200);
    await drainStream(response);

    expect(mockPrismaUser.updateMany).not.toHaveBeenCalled();
  });

  it("seeds the 5 canned itinerary days in demo mode so the itinerary is not empty", async () => {
    delete process.env.OPENAI_API_KEY;
    mockSession();
    const mockPrismaDay = prisma.itineraryDay as unknown as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    mockPrismaDay.findFirst.mockResolvedValue(null);

    const response = await chatRoute(makeRequest({ message: "demo trip" }));
    expect(response.status).toBe(200);
    const text = await drainStream(response);
    expect(text).toContain("Day 1");

    // One upsert-check per day, all scoped to the auto-created itinerary
    expect(mockPrismaDay.findFirst).toHaveBeenCalledTimes(5);
    expect(mockPrismaDay.create).toHaveBeenCalledTimes(5);
    const createdDays = mockPrismaDay.create.mock.calls.map(
      ([arg]) => (arg as { data: { dayNumber: number } }).data,
    );
    expect(createdDays.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5]);
    for (const day of createdDays as unknown as Array<{
      itineraryId: string;
      title: string;
      description: string;
      activities: Array<{ time: string; activity: string; location: string }>;
    }>) {
      expect(day.itineraryId).toBe("auto-itin-1");
      expect(day.title).toBeTruthy();
      expect(day.description).toBeTruthy();
      expect(day.activities).toHaveLength(1);
      expect(day.activities[0].time).toBeTruthy();
      expect(day.activities[0].activity).toBeTruthy();
      expect(day.activities[0].location).toBeTruthy();
    }
    expect(createdDays.map((d) => (d as unknown as { title: string }).title)).toEqual([
      "Arrival & Orientation",
      "Acclimatisation Hike",
      "Main Trail Begins",
      "High Camp",
      "Summit Day",
    ]);
  });

  it("updates existing rows instead of duplicating days when demo mode re-runs", async () => {
    delete process.env.OPENAI_API_KEY;
    mockSession();
    const mockPrismaDay = prisma.itineraryDay as unknown as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    mockPrismaDay.findFirst.mockResolvedValue({ id: "existing-day" });
    mockPrismaItinerary.findUnique.mockResolvedValue({ chatHistory: [] });

    const response = await chatRoute(makeRequest({ message: "again", itineraryId: "itin-42" }));
    await drainStream(response);

    expect(mockPrismaDay.create).not.toHaveBeenCalled();
    expect(mockPrismaDay.update).toHaveBeenCalledTimes(5);
    expect(mockPrismaDay.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "existing-day" } }),
    );
  });

  it("refunds the credit when the OpenAI stream fails", async () => {
    mockSession();
    mockCreate.mockRejectedValue(new Error("upstream exploded"));

    const response = await chatRoute(makeRequest({ message: "Plan my trip" }));
    const text = await drainStream(response);
    expect(text).toContain("Something went wrong");

    expect(mockPrismaUser.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", aiCreditsUsed: { gt: 0 } },
      data: { aiCreditsUsed: { decrement: 1 } },
    });
  });
});
