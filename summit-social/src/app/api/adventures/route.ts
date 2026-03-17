import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { adventureFilterSchema, createAdventureSchema } from "@/lib/validators/adventure";
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

  const { cursor, limit, category, continent, difficulty, search, sortBy, duration } = parsed.data;

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
    ...(category && { category }),
    ...(continent && { continent }),
    ...(difficulty && { difficulty }),
    ...(duration && { durationDays: DURATION_RANGES[duration] }),
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

  const orderBy =
    sortBy === "newest"
      ? { createdAt: "desc" as const }
      : sortBy === "duration"
        ? { durationDays: "asc" as const }
        : { voteCount: "desc" as const };

  const adventures = await prisma.adventure.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
      _count: { select: { comments: true } },
    },
  });

  const hasMore = adventures.length > limit;
  const items = hasMore ? adventures.slice(0, limit) : adventures;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return NextResponse.json({ items, nextCursor });
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
