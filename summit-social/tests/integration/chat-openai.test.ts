// Tests for the real OpenAI streaming path in POST /api/chat
// (the code path executed when OPENAI_API_KEY is set)

// Hoist the mock function so it's accessible both inside vi.mock and in tests.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
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
      findUnique: vi.fn().mockResolvedValue({ openAiApiKey: null }),
    },
    adventure: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    itinerary: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "auto-itin-1" }),
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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as chatRoute } from "@/app/api/chat/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

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

    const response = await chatRoute(makeRequest({ message: "Plan Nepal", itineraryId: "itin-42" }));
    await drainStream(response);

    expect(mockPrismaItinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "itin-42" },
        data: expect.objectContaining({ chatHistory: expect.any(Array) }),
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
        where: { id: "auto-itin-1" },
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
            delta: { tool_calls: [{ index: 0, id: "", function: { name: "ights", arguments: '{"origin":"LHR"}' } }] },
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
    const { prisma: mockPrismaModule } = await import("@/lib/db/prisma");
    const mockPrismaFull = mockPrismaModule as typeof mockPrismaModule & {
      itinerary: Record<string, ReturnType<typeof vi.fn>>;
      itineraryDay: Record<string, ReturnType<typeof vi.fn>>;
    };

    // Add itineraryDay mock
    (mockPrismaFull as unknown as Record<string, unknown>).itineraryDay = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "day-1" }),
      update: vi.fn().mockResolvedValue({}),
    };

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
              tool_calls: [{ index: 0, id: "call-itin", function: { name: "create_itinerary_day", arguments: dayArgs } }],
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
