// Real-Redis semantics of the atomic limiter script.
import { afterAll, describe, expect, it } from "vitest";
import { rateLimit, redis } from "@/lib/db/redis";

const key = (suffix: string) => `dbtest:ratelimit:${suffix}:${Date.now()}`;

describe("rateLimit against real Redis", () => {
  afterAll(async () => {
    await redis.quit();
  });

  it("allows exactly `limit` calls then denies with a live TTL", async () => {
    const k = key("window");
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await rateLimit(k, 3, 60));
    }
    expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true);
    expect(results[3].allowed).toBe(false);
    expect(results[3].retryAfter).toBeGreaterThan(0);
    expect(results[3].retryAfter).toBeLessThanOrEqual(60);
  });

  it("heals keys that lost their TTL instead of limiting forever", async () => {
    const k = key("healing");
    // Simulate the historical crash-between-INCR-and-EXPIRE state.
    await redis.set(k, "999");
    await redis.persist(k);
    expect(await redis.ttl(k)).toBe(-1);

    await rateLimit(k, 3, 45);
    const ttl = await redis.ttl(k);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(45);
  });

  it("counts atomically under concurrent callers", async () => {
    const k = key("concurrent");
    const results = await Promise.all(
      Array.from({ length: 10 }, () => rateLimit(k, 5, 60)),
    );
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(5);
  });
});
