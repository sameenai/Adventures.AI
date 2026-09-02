import { DURATION_RANGES } from "@/lib/constants";
import type { DurationKey } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import type { AdventureFilterInput } from "@/lib/validators/adventure";
import type { Prisma } from "@prisma/client";

// Shared adventure listing logic used by both the /api/adventures route and the
// /adventures RSC page. Both callers parse their inputs through
// adventureFilterSchema, then delegate here — keeping the Prisma where/orderBy/
// cursor construction in exactly one place.

export type AdventureSort = AdventureFilterInput["sortBy"];

export const ADVENTURE_LIST_INCLUDE = {
  user: { select: { id: true, name: true, avatarUrl: true } },
  tags: true,
  _count: { select: { comments: true } },
} satisfies Prisma.AdventureInclude;

export type AdventureListItem = Prisma.AdventureGetPayload<{
  include: typeof ADVENTURE_LIST_INCLUDE;
}>;

export interface AdventureListPage {
  items: AdventureListItem[];
  nextCursor?: string;
}

export function buildAdventureWhere(filters: AdventureFilterInput): Prisma.AdventureWhereInput {
  const { category, continent, difficulty, search, duration, month, climate, tag } = filters;

  // Collect OR-based conditions into an AND array to avoid key collisions
  const andConditions: Prisma.AdventureWhereInput[] = [];
  if (duration?.length) {
    andConditions.push({
      OR: duration.map((d) => ({
        durationDays: DURATION_RANGES[d as DurationKey],
      })),
    });
  }
  if (climate?.length) {
    andConditions.push({ OR: climate.map((c) => ({ climate: { has: c } })) });
  }
  if (month?.length) {
    andConditions.push({ OR: month.map((m) => ({ bestMonths: { has: m } })) });
  }
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    });
  }

  return {
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
    ...(tag && { tags: { some: { name: tag } } }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };
}

export function buildAdventureOrderBy(
  sortBy: AdventureSort,
): Prisma.AdventureOrderByWithRelationInput[] {
  if (sortBy === "newest") return [{ createdAt: "desc" }, { id: "asc" }];
  if (sortBy === "duration") return [{ durationDays: "asc" }, { id: "asc" }];
  // "votes" — also the fallback for "trending", which never reaches orderBy.
  return [{ voteCount: "desc" }, { id: "asc" }];
}

// Keyset WHERE condition from a cursor so page boundaries are exact even when
// the primary sort field has ties.
//   votes:    (voteCount < v) OR (voteCount = v AND id > id)
//   newest:   (createdAt < c) OR (createdAt = c AND id > id)
//   duration: (durationDays > d) OR (durationDays = d AND id > id)
export function buildAdventureCursorWhere(
  sortBy: AdventureSort,
  cursor: string,
): Prisma.AdventureWhereInput {
  const decoded = decodeCursor(cursor);
  if (!decoded) return {};
  if (sortBy === "newest" && "c" in decoded) {
    const cursorDate = new Date(decoded.c);
    return {
      OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { gt: decoded.id } }],
    };
  }
  if (sortBy === "duration" && "d" in decoded) {
    return {
      OR: [
        { durationDays: { gt: decoded.d } },
        { durationDays: decoded.d, id: { gt: decoded.id } },
      ],
    };
  }
  if ("v" in decoded) {
    return {
      OR: [{ voteCount: { lt: decoded.v } }, { voteCount: decoded.v, id: { gt: decoded.id } }],
    };
  }
  return {};
}

export function buildAdventureNextCursor(
  sortBy: AdventureSort,
  last: { id: string; createdAt: Date; durationDays: number; voteCount: number },
): string {
  if (sortBy === "newest") return encodeCursor({ c: last.createdAt.toISOString(), id: last.id });
  if (sortBy === "duration") return encodeCursor({ d: last.durationDays, id: last.id });
  return encodeCursor({ v: last.voteCount, id: last.id });
}

// ---------------------------------------------------------------------------
// Trending
// ---------------------------------------------------------------------------

/** How far back votes count towards the trending ranking. */
export const TRENDING_WINDOW_DAYS = 7;

/** Maximum size of the ranked trending pool reachable via pagination. */
export const TRENDING_POOL_SIZE = 200;

const TRENDING_CURSOR_PREFIX = "trending:";

// Trending paginates by rank offset into the ranked list rather than by keyset,
// because the ranking (recent-vote count) is not a column we can keyset on.
// The offset is wrapped in the same opaque base64url format as other cursors.
export function encodeTrendingCursor(offset: number): string {
  return Buffer.from(`${TRENDING_CURSOR_PREFIX}${offset}`).toString("base64url");
}

export function decodeTrendingCursor(cursor: string): number | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    if (!raw.startsWith(TRENDING_CURSOR_PREFIX)) return null;
    const offset = Number(raw.slice(TRENDING_CURSOR_PREFIX.length));
    return Number.isInteger(offset) && offset >= 0 ? offset : null;
  } catch {
    return null;
  }
}

// Rank by votes cast in the last TRENDING_WINDOW_DAYS days, restricted to
// adventures matching the active filters (including published: true) so that
// votes on filtered-out adventures never consume ranking slots.
export async function fetchTrendingAdventures(
  filters: AdventureFilterInput,
): Promise<AdventureListPage> {
  const { cursor, limit } = filters;
  const offset = cursor ? (decodeTrendingCursor(cursor) ?? 0) : 0;
  const where = buildAdventureWhere(filters);
  const windowStart = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const recentVoteCounts = await prisma.vote.groupBy({
    by: ["adventureId"],
    where: {
      createdAt: { gte: windowStart },
      adventure: { is: where },
    },
    _count: { adventureId: true },
    orderBy: { _count: { adventureId: "desc" } },
    take: TRENDING_POOL_SIZE,
  });

  const rankedIds = recentVoteCounts.map((v) => v.adventureId);
  const pageIds = rankedIds.slice(offset, offset + limit);
  if (pageIds.length === 0) return { items: [] };

  const adventuresById = await prisma.adventure
    .findMany({
      where: { ...where, id: { in: pageIds } },
      include: ADVENTURE_LIST_INCLUDE,
    })
    .then((list) => new Map(list.map((a) => [a.id, a])));

  const items = pageIds.flatMap((id) => {
    const a = adventuresById.get(id);
    return a ? [a] : [];
  });

  const nextOffset = offset + limit;
  const nextCursor = nextOffset < rankedIds.length ? encodeTrendingCursor(nextOffset) : undefined;
  return { items, nextCursor };
}

// ---------------------------------------------------------------------------
// Offset-based pagination (for page controls)
// ---------------------------------------------------------------------------

export interface AdventureOffsetPage {
  items: AdventureListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function fetchAdventuresOffset(
  filters: AdventureFilterInput,
  page: number,
  perPage: number,
): Promise<AdventureOffsetPage> {
  const where = buildAdventureWhere(filters);
  const orderBy = buildAdventureOrderBy(filters.sortBy);
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.adventure.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      include: ADVENTURE_LIST_INCLUDE,
    }),
    prisma.adventure.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

// ---------------------------------------------------------------------------
// Unified page fetch (cursor-based, for backwards compat)
// ---------------------------------------------------------------------------

export async function fetchAdventuresPage(
  filters: AdventureFilterInput,
): Promise<AdventureListPage> {
  if (filters.sortBy === "trending") return fetchTrendingAdventures(filters);

  const { cursor, limit, sortBy } = filters;
  const where = buildAdventureWhere(filters);
  const cursorWhere = cursor ? buildAdventureCursorWhere(sortBy, cursor) : {};

  const adventures = await prisma.adventure.findMany({
    where: { ...where, ...cursorWhere },
    orderBy: buildAdventureOrderBy(sortBy),
    take: limit + 1,
    include: ADVENTURE_LIST_INCLUDE,
  });

  const hasMore = adventures.length > limit;
  const items = hasMore ? adventures.slice(0, limit) : adventures;
  const nextCursor =
    hasMore && items.length > 0
      ? buildAdventureNextCursor(sortBy, items[items.length - 1])
      : undefined;

  return { items, nextCursor };
}
