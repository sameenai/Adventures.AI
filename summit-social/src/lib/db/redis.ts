import { logger } from "@/lib/logger";
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

let consecutiveFailures = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 30_000;
let circuitOpenUntil = 0;

function isCircuitOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    consecutiveFailures = 0;
    return false;
  }
  return true;
}

function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_RESET_MS;
    logger.error(
      `Redis circuit breaker OPEN — ${consecutiveFailures} consecutive failures, bypassing for ${CIRCUIT_BREAKER_RESET_MS / 1000}s`,
    );
  }
}

function recordSuccess(): void {
  consecutiveFailures = 0;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (isCircuitOpen()) {
    return { allowed: true, retryAfter: 0 };
  }

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    recordSuccess();
    if (current <= limit) {
      return { allowed: true, retryAfter: 0 };
    }
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
  } catch (err) {
    recordFailure();
    logger.warn("Redis rateLimit failed — failing open", err);
    return { allowed: true, retryAfter: 0 };
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (isCircuitOpen()) return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    recordSuccess();
    return JSON.parse(data) as T;
  } catch (err) {
    recordFailure();
    logger.warn("Redis getCached failed", err);
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  if (isCircuitOpen()) return;

  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
    recordSuccess();
  } catch (err) {
    recordFailure();
    logger.warn("Redis setCache failed", err);
  }
}
