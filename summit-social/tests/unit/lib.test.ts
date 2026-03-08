import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// buildUserContextPrompt  (lib/ai/prompts.ts)
// ---------------------------------------------------------------------------
import { buildUserContextPrompt, ITINERARY_SYSTEM_PROMPT, GEAR_SYSTEM_PROMPT } from "@/lib/ai/prompts";

describe("buildUserContextPrompt", () => {
  it("returns empty string for empty preferences", () => {
    expect(buildUserContextPrompt({})).toBe("");
  });

  it("includes budget in GBP", () => {
    const result = buildUserContextPrompt({ budget: 200000 });
    expect(result).toContain("Budget: £2,000");
  });

  it("includes fitness level", () => {
    const result = buildUserContextPrompt({ fitnessLevel: "advanced" });
    expect(result).toContain("Fitness level: advanced");
  });

  it("includes travel dates", () => {
    const result = buildUserContextPrompt({
      travelDates: { start: "2025-07-01", end: "2025-07-14" },
    });
    expect(result).toContain("2025-07-01 to 2025-07-14");
  });

  it("includes group size", () => {
    const result = buildUserContextPrompt({ travellers: 3 });
    expect(result).toContain("Group size: 3 traveller(s)");
  });

  it("includes all preferences when all provided", () => {
    const result = buildUserContextPrompt({
      budget: 500000,
      fitnessLevel: "intermediate",
      travelDates: { start: "2025-06-01", end: "2025-06-15" },
      travellers: 2,
    });
    expect(result).toContain("Budget:");
    expect(result).toContain("Fitness level:");
    expect(result).toContain("Travel dates:");
    expect(result).toContain("Group size:");
  });

  it("prefixes with User preferences header", () => {
    const result = buildUserContextPrompt({ travellers: 1 });
    expect(result).toContain("User preferences:");
  });
});

describe("ITINERARY_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof ITINERARY_SYSTEM_PROMPT).toBe("string");
    expect(ITINERARY_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("mentions adventure planning", () => {
    expect(ITINERARY_SYSTEM_PROMPT.toLowerCase()).toContain("itinerar");
  });
});

describe("GEAR_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof GEAR_SYSTEM_PROMPT).toBe("string");
    expect(GEAR_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// difficulty-map (lib/difficulty-map.ts)
// ---------------------------------------------------------------------------
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";

describe("DIFFICULTY_MAP", () => {
  it("is a Map", () => {
    expect(DIFFICULTY_MAP).toBeInstanceOf(Map);
  });

  it("contains all 5 difficulty levels", () => {
    const keys = ["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"];
    for (const key of keys) {
      expect(DIFFICULTY_MAP.has(key)).toBe(true);
    }
  });

  it("each entry has value and color", () => {
    for (const [, entry] of DIFFICULTY_MAP) {
      expect(entry).toHaveProperty("value");
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("color");
    }
  });

  it("returns undefined for unknown difficulty", () => {
    expect(DIFFICULTY_MAP.get("UNKNOWN")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Redis helpers (lib/db/redis.ts)
// Mock ioredis at the module level
// ---------------------------------------------------------------------------
vi.mock("ioredis", () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  };
  const Redis = vi.fn().mockImplementation(() => mockRedis);
  (Redis as unknown as { _mock: typeof mockRedis })._mock = mockRedis;
  return { default: Redis };
});

import { getCached, setCache, rateLimit } from "@/lib/db/redis";
import Redis from "ioredis";

const redisMock = (Redis as unknown as { _mock: ReturnType<typeof vi.fn> & { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; incr: ReturnType<typeof vi.fn>; expire: ReturnType<typeof vi.fn> } })._mock;

describe("getCached", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns null when key is not cached", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await getCached("missing-key");
    expect(result).toBeNull();
  });

  it("returns parsed JSON when key exists", async () => {
    const data = { id: "test", value: 42 };
    redisMock.get.mockResolvedValue(JSON.stringify(data));
    const result = await getCached<typeof data>("existing-key");
    expect(result).toEqual(data);
  });

  it("calls redis.get with the correct key", async () => {
    redisMock.get.mockResolvedValue(null);
    await getCached("my-key");
    expect(redisMock.get).toHaveBeenCalledWith("my-key");
  });
});

describe("setCache", () => {
  afterEach(() => vi.clearAllMocks());

  it("calls redis.set with key, JSON value, and TTL", async () => {
    redisMock.set.mockResolvedValue("OK");
    const data = { id: "test" };
    await setCache("my-key", data, 300);
    expect(redisMock.set).toHaveBeenCalledWith("my-key", JSON.stringify(data), "EX", 300);
  });
});

describe("rateLimit", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns true when under the limit (first request)", async () => {
    redisMock.incr.mockResolvedValue(1);
    redisMock.expire.mockResolvedValue(1);
    const allowed = await rateLimit("user-key", 10, 60);
    expect(allowed).toBe(true);
  });

  it("sets expiry on first request (incr returns 1)", async () => {
    redisMock.incr.mockResolvedValue(1);
    redisMock.expire.mockResolvedValue(1);
    await rateLimit("user-key", 10, 60);
    expect(redisMock.expire).toHaveBeenCalledWith("user-key", 60);
  });

  it("does not set expiry on subsequent requests (incr > 1)", async () => {
    redisMock.incr.mockResolvedValue(5);
    await rateLimit("user-key", 10, 60);
    expect(redisMock.expire).not.toHaveBeenCalled();
  });

  it("returns true when at the limit", async () => {
    redisMock.incr.mockResolvedValue(10);
    const allowed = await rateLimit("user-key", 10, 60);
    expect(allowed).toBe(true);
  });

  it("returns false when over the limit", async () => {
    redisMock.incr.mockResolvedValue(11);
    const allowed = await rateLimit("user-key", 10, 60);
    expect(allowed).toBe(false);
  });
});
