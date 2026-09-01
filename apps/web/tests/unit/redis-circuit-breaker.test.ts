import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ioredis", () => {
  const RedisMock = vi.fn(() => ({
    eval: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }));
  return { default: RedisMock };
});

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("redis circuit breaker", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fails open and logs when Redis is unavailable", async () => {
    const { redis, rateLimit } = await import("@/lib/db/redis");
    const { logger } = await import("@/lib/logger");
    (redis.eval as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Connection refused"));

    const result = await rateLimit("test-key", 10, 60);
    expect(result.allowed).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "Redis rateLimit failed — failing open",
      expect.any(Error),
    );
  });

  it("opens circuit after consecutive failures", async () => {
    const { redis, rateLimit } = await import("@/lib/db/redis");
    const { logger } = await import("@/lib/logger");
    (redis.eval as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Connection refused"));

    // Trigger 5 failures to open the circuit
    for (let i = 0; i < 5; i++) {
      await rateLimit(`key-${i}`, 10, 60);
    }

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("circuit breaker OPEN"));

    // Next call should not even hit Redis
    (redis.eval as ReturnType<typeof vi.fn>).mockClear();
    const result = await rateLimit("another-key", 10, 60);
    expect(result.allowed).toBe(true);
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it("getCached returns null and logs on failure", async () => {
    const { redis, getCached } = await import("@/lib/db/redis");
    const { logger } = await import("@/lib/logger");
    (redis.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));

    const result = await getCached("test-key");
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith("Redis getCached failed", expect.any(Error));
  });

  it("setCache logs on failure", async () => {
    const { redis, setCache } = await import("@/lib/db/redis");
    const { logger } = await import("@/lib/logger");
    (redis.set as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));

    await setCache("test-key", { data: "value" }, 300);
    expect(logger.warn).toHaveBeenCalledWith("Redis setCache failed", expect.any(Error));
  });
});
