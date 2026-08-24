// Tests for src/lib/db/redis.ts — atomic limiter, fail-open/fail-closed branches
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock ioredis to simulate connection failures
vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    eval: vi.fn(),
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
    mockRedis.eval.mockResolvedValue([1, 3600]);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("runs the INCR+EXPIRE script atomically with the window as argument", async () => {
    mockRedis.eval.mockResolvedValue([1, 3600]);
    await rateLimit("test:key", 10, 3600);
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.stringContaining("INCR"),
      1,
      "test:key",
      3600,
    );
    const script = mockRedis.eval.mock.calls[0][0] as string;
    expect(script).toContain("EXPIRE");
  });

  it("blocks when limit exceeded and returns ttl as retryAfter", async () => {
    mockRedis.eval.mockResolvedValue([11, 120]);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(120);
  });

  it("uses windowSeconds as retryAfter when ttl is not positive", async () => {
    mockRedis.eval.mockResolvedValue([11, 0]);
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(3600);
  });

  it("fails open when Redis throws (returns allowed=true)", async () => {
    mockRedis.eval.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await rateLimit("test:key", 10, 3600);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("fails CLOSED for cost-bearing routes when Redis throws", async () => {
    mockRedis.eval.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await rateLimit("chat:user1", 30, 3600, { failClosed: true });
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
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
