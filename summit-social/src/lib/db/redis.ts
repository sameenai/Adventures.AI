import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (current <= limit) {
    return { allowed: true, retryAfter: 0 };
  }
  const ttl = await redis.ttl(key);
  return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
}

export async function getCached<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
}
