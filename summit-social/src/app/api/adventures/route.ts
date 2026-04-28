import { authOptions } from "@/lib/auth/config";
import { CACHE_TTL, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getCached, rateLimit, setCache } from "@/lib/db/redis";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { adventureFilterSchema, createAdventureSchema } from "@/lib/validators/adventure";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adventureFilterSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    cursor,
    limit,
    category,
    continent,
    difficulty,
    search,
    sortBy,
    duration,
    month,
    climate,
    tag,
  } = parsed.data;

  const DURATION_RANGES = {
    weekend: { gte: 1, lte: 3 },
    week: { gte: 4, lte: 7 },
    fortnight: { gte: 8, lte: 14 },
    expedition: { gte: 15, lte: 30 },
    peregrination: { gte: 31, lte: 90 },
    lifestyle: { gte: 91 },
  } as const;

  const where = {
    published: true,
    ...(category && {
      category: category.length === 1 ? (category[0] as never) : ({ in: category } as never),
    }),
    ...(continent && {
      continent: continent.length === 1 ? continent[0] : { in: continent },
    }),
    ...(difficulty && {
      difficulty:
        difficulty.length === 1 ? (difficulty[0] as never) : ({ in: difficulty } as never),
    }),
    ...(duration && { durationDays: DURATION_RANGES[duration] }),
    ...(month &&
      month.length > 0 && {
        OR: month.map((m) => ({ bestMonths: { has: m } })),
      }),
    ...(climate && { climate: { has: climate } }),
    ...(tag && { tags: { some: { name: tag } } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  // Trending: rank by votes cast in the last 7 days
  if (sortBy === "trending") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentVoteCounts = await prisma.vote.groupBy({
      by: ["adventureId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { adventureId: true },
      orderBy: { _count: { adventureId: "desc" } },
      take: limit + 1,
    });

    const orderedIds = recentVoteCounts.map((v) => v.adventureId);

    const adventuresMap = await prisma.adventure
      .findMany({
        where: { ...where, id: { in: orderedIds } },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          tags: true,
          _count: { select: { comments: true } },
        },
      })
      .then((list) => new Map(list.map((a) => [a.id, a])));

    const ordered = orderedIds.flatMap((id) => {
      const a = adventuresMap.get(id);
      return a ? [a] : [];
    });

    const hasMore = recentVoteCounts.length > limit;
    const items = hasMore ? ordered.slice(0, limit) : ordered;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;

    return NextResponse.json({ items, nextCursor });
  }

  // Build keyset WHERE condition from cursor so page boundaries are exact even
  // when the primary sort field has ties.
  //   votes:    (voteCount < v) OR (voteCount = v AND id > id)
  //   newest:   (createdAt < c) OR (createdAt = c AND id > id)
  //   duration: (durationDays > d) OR (durationDays = d AND id > id)
  let cursorWhere: Prisma.AdventureWhereInput = {};
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      if (sortBy === "newest" && "c" in decoded) {
        const cursorDate = new Date(decoded.c);
        cursorWhere = {
          OR: [
            { createdAt: { lt: cursorDate } },
            { createdAt: cursorDate, id: { gt: decoded.id } },
          ],
        };
      } else if (sortBy === "duration" && "d" in decoded) {
        cursorWhere = {
          OR: [
            { durationDays: { gt: decoded.d } },
            { durationDays: decoded.d, id: { gt: decoded.id } },
          ],
        };
      } else if ("v" in decoded) {
        cursorWhere = {
          OR: [{ voteCount: { lt: decoded.v } }, { voteCount: decoded.v, id: { gt: decoded.id } }],
        };
      }
    }
  }

  const orderBy =
    sortBy === "newest"
      ? [{ createdAt: "desc" as const }, { id: "asc" as const }]
      : sortBy === "duration"
        ? [{ durationDays: "asc" as const }, { id: "asc" as const }]
        : [{ voteCount: "desc" as const }, { id: "asc" as const }];

  // Cache first-page requests (no cursor) — these are the hottest reads and
  // their results are identical for all visitors with the same filter params.
  // Paginated requests (cursor present) are per-session and not cached.
  const cacheKey = cursor
    ? null
    : `adventures:${sortBy}:${(category ?? []).join(",")}:${(continent ?? []).join(",")}:${(difficulty ?? []).join(",")}:${duration ?? ""}:${month ?? ""}:${tag ?? ""}:${search ?? ""}:${limit}`;

  if (cacheKey) {
    const cached = await getCached<{ items: unknown[]; nextCursor?: string }>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const adventures = await prisma.adventure.findMany({
    where: { ...where, ...cursorWhere },
    orderBy,
    take: limit + 1,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
      _count: { select: { comments: true } },
    },
  });

  const hasMore = adventures.length > limit;
  const items = hasMore ? adventures.slice(0, limit) : adventures;

  let nextCursor: string | undefined;
  if (hasMore) {
    const last = items[items.length - 1];
    if (sortBy === "newest") {
      nextCursor = encodeCursor({ c: last.createdAt.toISOString(), id: last.id });
    } else if (sortBy === "duration") {
      nextCursor = encodeCursor({ d: last.durationDays, id: last.id });
    } else {
      nextCursor = encodeCursor({ v: last.voteCount, id: last.id });
    }
  }

  const payload = { items, nextCursor };
  if (cacheKey) await setCache(cacheKey, payload, CACHE_TTL.adventureCounts);

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { allowed, retryAfter } = await rateLimit(
    `adventure:create:${session.user.id}`,
    RATE_LIMITS.adventureCreate.limit,
    RATE_LIMITS.adventureCreate.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await request.json();
  const parsed = createAdventureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags: tagNames, ...adventureData } = parsed.data;

  const adventure = await prisma.adventure.create({
    data: {
      ...adventureData,
      userId: session.user.id,
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
    },
  });

  return NextResponse.json(adventure, { status: 201 });
}
