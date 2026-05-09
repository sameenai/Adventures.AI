import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = await rateLimit(
    `user-search:${ip}`,
    RATE_LIMITS.userSearch.limit,
    RATE_LIMITS.userSearch.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        _count: { select: { adventures: { where: { published: true } } } },
      },
      orderBy: { adventures: { _count: "desc" } },
      take: 20,
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Search failed", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
