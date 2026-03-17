// Tests for src/lib/db/redis.ts — fail-open catch branches
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock ioredis to simulate connection failures
vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }));
  return { default: Redis };
});

import { rateLimit, getCached, setCache } from "@/lib/db/redis";
import { redis } from "@/lib/db/redis";

const mockRedis = redis as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe("rateLimit", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows when within limit", async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("blocks when limit exceeded and returns ttl as retryAfter", async () => {
    mockRedis.incr.mockResolvedValue(11);
    mockRedis.ttl.mockResolvedValue(120);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(120);
  });

  it("uses windowSeconds as retryAfter when ttl is -1", async () => {
    mockRedis.incr.mockResolvedValue(11);
    mockRedis.ttl.mockResolvedValue(-1);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(3600);
  });

  it("fails open when Redis throws (returns allowed=true)", async () => {
    mockRedis.incr.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });
});

describe("getCached", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed JSON when key exists", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ foo: "bar" }));
    const result = await getCached<{ foo: string }>("some-key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null when key does not exist", async () => {
    mockRedis.get.mockResolvedValue(null);
    const result = await getCached("missing-key");
    expect(result).toBeNull();
  });

  it("returns null when Redis throws", async () => {
    mockRedis.get.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await getCached("some-key");
    expect(result).toBeNull();
  });
});

describe("setCache", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("stores data with TTL", async () => {
    mockRedis.set.mockResolvedValue("OK");
    await setCache("some-key", { x: 1 }, 60);
    expect(mockRedis.set).toHaveBeenCalledWith("some-key", JSON.stringify({ x: 1 }), "EX", 60);
  });

  it("silently ignores Redis errors", async () => {
    mockRedis.set.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(setCache("some-key", {}, 60)).resolves.toBeUndefined();
  });
});
