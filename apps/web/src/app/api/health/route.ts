import { prisma } from "@/lib/db/prisma";
import { redis as redisClient } from "@/lib/db/redis";
import { NextResponse } from "next/server";

/**
 * Liveness + component status. DB down is fatal (503 — the platform should
 * recycle/alert). Redis down is DEGRADED but 200: the app stays up and
 * cost-bearing routes fail closed, which monitoring should alert on without
 * the orchestrator killing healthy instances.
 */
export async function GET() {
  let db = "ok";
  let redis = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "unreachable";
  }

  try {
    const pong = await redisClient.ping();
    if (pong !== "PONG") redis = "unreachable";
  } catch {
    redis = "unreachable";
  }

  if (db !== "ok") {
    return NextResponse.json({ status: "error", db, redis }, { status: 503 });
  }
  return NextResponse.json({
    status: redis === "ok" ? "ok" : "degraded",
    db,
    redis,
  });
}
