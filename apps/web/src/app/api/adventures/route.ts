import { fetchAdventuresPage } from "@/lib/adventures/query";
import { authOptions } from "@/lib/auth/config";
import { CACHE_TTL, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getCached, rateLimit, setCache } from "@/lib/db/redis";
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

  const filters = parsed.data;
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
  } = filters;

  // Cache first-page requests (no cursor) — these are the hottest reads and
  // their results are identical for all visitors with the same filter params.
  // Paginated requests (cursor present) are per-session and not cached, and
  // trending is left uncached so the ranking reflects recent votes promptly.
  const cacheKey =
    cursor || sortBy === "trending"
      ? null
      : `adventures:${sortBy}:${(category ?? []).join(",")}:${(continent ?? []).join(",")}:${(difficulty ?? []).join(",")}:${(duration ?? []).join(",")}:${month ?? ""}:${(climate ?? []).join(",")}:${tag ?? ""}:${search ?? ""}:${limit}`;

  if (cacheKey) {
    const cached = await getCached<{ items: unknown[]; nextCursor?: string }>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const payload = await fetchAdventuresPage(filters);
  if (cacheKey) await setCache(cacheKey, payload, CACHE_TTL.adventureCounts);

  // Demand capture (fire-and-forget, first page only): searches and filter
  // combinations were previously parsed and discarded — they are the "based
  // on past searches" half of the cadence vision.
  const hasIntent =
    Boolean(search) ||
    Boolean(category?.length || continent?.length || difficulty?.length) ||
    Boolean(duration?.length || month || climate?.length || tag);
  if (!cursor && hasIntent) {
    try {
      const session = await getServerSession(authOptions).catch(() => null);
      void prisma.searchEvent
        .create({
          data: {
            userId: session?.user?.id ?? null,
            source: "ADVENTURE_LIST",
            query: search ?? null,
            filters: { category, continent, difficulty, duration, month, climate, tag },
            resultCount: payload.items.length,
          },
        })
        .catch(() => undefined);
    } catch {
      // Analytics capture must never break the listing response.
    }
  }

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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }
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
