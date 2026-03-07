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

  const { cursor, limit, category, continent, difficulty, search, sortBy } = parsed.data;

  const where = {
    published: true,
    ...(category && { category }),
    ...(continent && { continent }),
    ...(difficulty && { difficulty }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

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

  const allowed = await rateLimit(
    `adventure:create:${session.user.id}`,
    RATE_LIMITS.adventureCreate.limit,
    RATE_LIMITS.adventureCreate.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMITED" }, { status: 429 });
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
