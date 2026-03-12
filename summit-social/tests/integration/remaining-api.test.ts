import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
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
  rateLimit: vi.fn().mockResolvedValue(true),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    comment: { create: vi.fn() },
    itinerary: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    notification: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/ai/openai", () => ({ openai: { chat: { completions: { create: vi.fn() } } } }));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { POST as createComment } from "@/app/api/adventures/[id]/comments/route";
import { PATCH as patchAdventure } from "@/app/api/adventures/[id]/route";
import { GET as getNotifications } from "@/app/api/notifications/route";
import { POST as markAllRead } from "@/app/api/notifications/read-all/route";
import { POST as chatRoute } from "@/app/api/chat/route";
import { GET as getItineraries, POST as createItinerary } from "@/app/api/itineraries/route";
import {
  GET as getItinerary,
  PATCH as patchItinerary,
  DELETE as deleteItinerary,
} from "@/app/api/itineraries/[id]/route";
import { GET as getUser, PATCH as patchUser } from "@/app/api/users/[id]/route";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";

const mockPrisma = prisma as typeof prisma & Record<string, ReturnType<typeof vi.fn>>;
const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}
function noSession() {
  mockGetSession.mockResolvedValue(null);
}

// ---------------------------------------------------------------------------
// POST /api/adventures/[id]/comments
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/comments", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates a comment and returns 201", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "adv-1" });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "comment-1",
      body: "Great adventure!",
      userId: "user-1",
      adventureId: "adv-1",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });

    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Great adventure!" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.body).toBe("Great adventure!");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hi" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce(false);
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hi" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(429);
  });

  it("returns 400 for empty body", async () => {
    mockSession();
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when adventure not found", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/missing/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Hello there" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("creates a reply when parentId is provided", async () => {
    mockSession();
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "adv-1" });
    (mockPrisma.comment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "reply-1",
      body: "I agree!",
      parentId: "comment-1",
      userId: "user-1",
      adventureId: "adv-1",
      user: { id: "user-1", name: "Alice", avatarUrl: null },
    });

    const response = await createComment(
      new NextRequest("http://localhost/api/adventures/adv-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "I agree!", parentId: "comment-1" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.parentId).toBe("comment-1");
  });
});

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "");
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockSession();
    mockRateLimit.mockResolvedValueOnce(false);
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("returns 400 for empty message", async () => {
    mockSession();
    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns a streaming response when no API key (mock mode)", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip to Nepal" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("streams destination-aware mock for Nepal", async () => {
    mockSession();

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Nepal trekking trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Read the full stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain("Nepal");
  });

  it("persists chat history when itineraryId is provided in mock mode", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      chatHistory: [],
    });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a trip", itineraryId: "itin-1" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Drain stream to trigger the update
    const reader = response.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(mockPrisma.itinerary.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "itin-1" } }),
    );
  });

  it.each([
    ["planning a trip to patagonia", "Patagonia"],
    ["i want to climb kilimanjaro next year", "Tanzania"],
    ["iceland northern lights trip", "Iceland"],
    ["peru inca trail hike", "Peru"],
  ])("mock response names the correct destination for '%s'", async (message, expectedDest) => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
    }

    expect(text).toContain(expectedDest);
  });

  it("includes existing chat history in prompt when itineraryId is provided", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      chatHistory: [{ role: "user", content: "Previous message" }],
    });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await chatRoute(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "New message", itineraryId: "itin-1" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    // Drain stream
    const reader = response.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/itineraries
// ---------------------------------------------------------------------------
describe("GET /api/itineraries", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getItineraries();
    expect(response.status).toBe(401);
  });

  it("returns itineraries for authenticated user", async () => {
    mockSession();
    (mockPrisma.itinerary.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "itin-1", title: "Nepal Trek", days: [], _count: { flightBookings: 0 } },
    ]);

    const response = await getItineraries();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("itin-1");
  });

  it("returns empty array when user has no itineraries", async () => {
    mockSession();
    (mockPrisma.itinerary.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const response = await getItineraries();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/itineraries
// ---------------------------------------------------------------------------
describe("POST /api/itineraries", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates an itinerary and returns 201", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
      userId: "user-1",
    });

    const response = await createItinerary(
      new Request("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("itin-new");
  });

  it("uses default title when none provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-2",
      title: "Untitled Trip",
    });

    await createItinerary(
      new Request("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.title).toBe("Untitled Trip");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await createItinerary(
      new Request("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "Trip" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("converts startDate and endDate strings to Date objects when provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
    });

    await createItinerary(
      new Request("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip", startDate: "2025-08-01", endDate: "2025-08-14" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.startDate).toBeInstanceOf(Date);
    expect(createCall.data.endDate).toBeInstanceOf(Date);
  });

  it("omits startDate and endDate from prisma call when not provided", async () => {
    mockSession();
    (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-new",
      title: "My Trip",
    });

    await createItinerary(
      new Request("http://localhost/api/itineraries", {
        method: "POST",
        body: JSON.stringify({ title: "My Trip" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const createCall = (mockPrisma.itinerary.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.startDate).toBeUndefined();
    expect(createCall.data.endDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("GET /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await getItinerary(new Request("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns itinerary data", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      title: "Nepal Trek",
      days: [],
      flightBookings: [],
    });

    const response = await getItinerary(new Request("http://localhost/api/itineraries/itin-1"), {
      params: Promise.resolve({ id: "itin-1" }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("itin-1");
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await getItinerary(new Request("http://localhost/api/itineraries/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("updates and returns the itinerary", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "itin-1" });
    (mockPrisma.itinerary.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "itin-1",
      title: "Updated Trek",
      days: [],
    });

    const response = await patchItinerary(
      new Request("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Trek" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Trek");
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await patchItinerary(
      new Request("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "X" }),
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await patchItinerary(
      new Request("http://localhost/api/itineraries/missing", {
        method: "PATCH",
        body: JSON.stringify({ title: "X" }),
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });

  it("passes all optional fields to prisma update when provided", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "itin-1" });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", title: "Nepal Trek", days: [] });

    await patchItinerary(
      new Request("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Nepal Trek",
          description: "Epic adventure",
          status: "CONFIRMED",
          startDate: "2025-08-01",
          endDate: "2025-08-14",
          budget: 5000,
          travellers: 3,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Nepal Trek",
          description: "Epic adventure",
          status: "CONFIRMED",
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          budget: 5000,
          travellers: 3,
        }),
      }),
    );
  });

  it("omits undefined optional fields from prisma update", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "itin-1" });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", days: [] });

    await patchItinerary(
      new Request("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    const callData = updateMock.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("title");
    expect(callData).not.toHaveProperty("status");
    expect(callData).not.toHaveProperty("startDate");
  });

  it("sets description and budget to explicit values including falsy ones", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "itin-1" });
    const updateMock = mockPrisma.itinerary.update as ReturnType<typeof vi.fn>;
    updateMock.mockResolvedValue({ id: "itin-1", days: [] });

    await patchItinerary(
      new Request("http://localhost/api/itineraries/itin-1", {
        method: "PATCH",
        body: JSON.stringify({ description: null, budget: 0 }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "itin-1" }) },
    );

    const callData = updateMock.mock.calls[0][0].data;
    // description uses !== undefined check, so null is included
    expect(callData).toHaveProperty("description", null);
    // budget uses !== undefined check, so 0 is included
    expect(callData).toHaveProperty("budget", 0);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/itineraries/[id]
// ---------------------------------------------------------------------------
describe("DELETE /api/itineraries/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("deletes itinerary and returns 204", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "itin-1" });
    (mockPrisma.itinerary.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const response = await deleteItinerary(
      new Request("http://localhost/api/itineraries/itin-1"),
      { params: Promise.resolve({ id: "itin-1" }) },
    );
    expect(response.status).toBe(204);
  });

  it("returns 401 when unauthenticated", async () => {
    noSession();
    const response = await deleteItinerary(
      new Request("http://localhost/api/itineraries/itin-1"),
      { params: Promise.resolve({ id: "itin-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when itinerary not found", async () => {
    mockSession();
    (mockPrisma.itinerary.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await deleteItinerary(
      new Request("http://localhost/api/itineraries/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/[id]
// ---------------------------------------------------------------------------
describe("GET /api/users/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns user profile", async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      avatarUrl: null,
      bio: "Hiker",
      instagramUrl: null,
      twitterUrl: null,
      websiteUrl: null,
      adventures: [],
      _count: { adventures: 0, votes: 0 },
    });

    const response = await getUser(new Request("http://localhost/api/users/user-1"), {
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("user-1");
    expect(data.name).toBe("Alice");
  });

  it("returns 404 when user not found", async () => {
    (mockPrisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await getUser(new Request("http://localhost/api/users/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/users/[id]
// ---------------------------------------------------------------------------
describe("PATCH /api/users/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("updates user profile", async () => {
    mockSession("user-1");
    (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      name: "Alice Updated",
      bio: "Hiker and climber",
      instagramUrl: null,
      twitterUrl: null,
      websiteUrl: null,
    });

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Alice Updated", bio: "Hiker and climber" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Alice Updated");
  });

  it("returns 403 when patching another user", async () => {
    mockSession("user-2");

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacker" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe("FORBIDDEN");
  });

  it("returns 403 when unauthenticated", async () => {
    noSession();

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "X" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid profile data", async () => {
    mockSession("user-1");

    const response = await patchUser(
      new NextRequest("http://localhost/api/users/user-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "user-1" }) },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/adventures/[id] — owner edit
// ---------------------------------------------------------------------------
describe("PATCH /api/adventures/[id] owner edit", () => {
  afterEach(() => vi.clearAllMocks());

  const makeRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/adventures/adv-1", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  const updatedAdventure = {
    id: "adv-1",
    title: "Updated Title",
    description: "Updated description with enough characters here",
    userId: "user-1",
    tags: [],
  };

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not the owner", async () => {
    mockSession("user-2");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    const response = await patchAdventure(makeRequest({ title: "X" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid adventure data", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    // title too short (< 3 chars)
    const response = await patchAdventure(makeRequest({ title: "AB" }), {
      params: Promise.resolve({ id: "adv-1" }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("updates adventure and returns 200 for owner", async () => {
    mockSession("user-1");
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "adv-1",
      userId: "user-1",
    });
    (mockPrisma.adventure.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedAdventure);

    const response = await patchAdventure(
      makeRequest({ title: "Updated Title", description: "Updated description with enough characters here" }),
      { params: Promise.resolve({ id: "adv-1" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Title");
  });
});

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------
describe("GET /api/notifications", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await getNotifications();
    expect(response.status).toBe(401);
  });

  it("returns notifications and unread count", async () => {
    mockSession("user-1");
    const mockNotifications = [
      { id: "n-1", message: "Someone followed you", read: false, createdAt: new Date(), type: "NEW_FOLLOWER", linkUrl: null },
      { id: "n-2", message: "New comment on your adventure", read: true, createdAt: new Date(), type: "NEW_COMMENT", linkUrl: "/adventures/adv-1" },
    ];
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotifications);

    const response = await getNotifications();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(2);
    expect(data.unreadCount).toBe(1);
  });

  it("returns empty array for user with no notifications", async () => {
    mockSession("user-1");
    (mockPrisma.notification.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const response = await getNotifications();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.notifications).toHaveLength(0);
    expect(data.unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// POST /api/notifications/read-all
// ---------------------------------------------------------------------------
describe("POST /api/notifications/read-all", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    noSession();
    const response = await markAllRead();
    expect(response.status).toBe(401);
  });

  it("marks all unread notifications as read", async () => {
    mockSession("user-1");
    (mockPrisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

    const response = await markAllRead();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
      data: { read: true },
    });
  });
});
