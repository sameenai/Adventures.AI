import { logger } from "@/lib/logger";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    commandTimeout: 1000,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 2) return null;
      return Math.min(times * 200, 1000);
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

let consecutiveFailures = 0;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_RESET_MS = 10_000;
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

// Atomically INCR the counter and guarantee a TTL exists, healing keys that
// lost their expiry (e.g. a crash between INCR and EXPIRE in older versions).
// Returns {count, ttl} in one round trip.
const RATE_LIMIT_SCRIPT = `
local c = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {c, ttl}
`;

/** Retry-After returned when a fail-closed limiter cannot reach Redis. */
const UNAVAILABLE_RETRY_AFTER_SECONDS = 30;

export interface RateLimitOptions {
  /**
   * Cost-bearing routes (AI chat, flight search, checkout) must DENY when the
   * limiter is unavailable — a Redis outage must not silently unmeter paid
   * upstream calls. Low-risk social routes keep the availability-first
   * fail-open default.
   */
  failClosed?: boolean;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  options: RateLimitOptions = {},
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (isCircuitOpen()) {
    return options.failClosed
      ? { allowed: false, retryAfter: UNAVAILABLE_RETRY_AFTER_SECONDS }
      : { allowed: true, retryAfter: 0 };
  }

  try {
    const [current, ttl] = (await redis.eval(RATE_LIMIT_SCRIPT, 1, key, windowSeconds)) as [
      number,
      number,
    ];
    recordSuccess();
    if (current <= limit) {
      return { allowed: true, retryAfter: 0 };
    }
    return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
  } catch (err) {
    recordFailure();
    if (options.failClosed) {
      logger.warn("Redis rateLimit failed — failing CLOSED for cost-bearing route", err);
      return { allowed: false, retryAfter: UNAVAILABLE_RETRY_AFTER_SECONDS };
    }
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
