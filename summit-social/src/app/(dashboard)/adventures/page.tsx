import { InfiniteAdventureGrid } from "@/components/adventures/infinite-adventure-grid";
import { SearchFilter } from "@/components/adventures/search-filter";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = { title: "Adventures | Basecamp" };

const PAGE_SIZE = 20;

function buildFilterUrl(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...current, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join("&");
  return `/adventures${qs ? `?${qs}` : ""}`;
}

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();
  const sortBy = params.sortBy ?? "votes";

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
    ...(params.category && { category: params.category as never }),
    ...(params.continent && { continent: params.continent }),
    ...(params.difficulty && { difficulty: params.difficulty as never }),
    ...(params.duration &&
      params.duration in DURATION_RANGES && {
        durationDays: DURATION_RANGES[params.duration as keyof typeof DURATION_RANGES],
      }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const include = {
    user: { select: { id: true, name: true, avatarUrl: true } },
    tags: true,
    _count: { select: { comments: true } },
  };

  const [session, rawAdventures] = await Promise.all([
    getServerSession(authOptions),
    sortBy === "trending"
      ? (async () => {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentVotes = await prisma.vote.groupBy({
            by: ["adventureId"],
            where: { createdAt: { gte: sevenDaysAgo } },
            _count: { adventureId: true },
            orderBy: { _count: { adventureId: "desc" } },
            take: PAGE_SIZE + 1,
          });
          const orderedIds = recentVotes.map((v) => v.adventureId);
          const map = await prisma.adventure
            .findMany({ where: { ...where, id: { in: orderedIds } }, include })
            .then((list) => new Map(list.map((a) => [a.id, a])));
          return orderedIds.flatMap((id) => {
            const a = map.get(id);
            return a ? [a] : [];
          });
        })()
      : prisma.adventure.findMany({
          where,
          orderBy:
            sortBy === "newest"
              ? { createdAt: "desc" as const }
              : sortBy === "duration"
                ? { durationDays: "asc" as const }
                : { voteCount: "desc" as const },
          take: PAGE_SIZE + 1,
          include,
        }),
  ]);

  const hasMore = rawAdventures.length > PAGE_SIZE;
  const adventures = hasMore ? rawAdventures.slice(0, PAGE_SIZE) : rawAdventures;
  const nextCursor = hasMore ? adventures[adventures.length - 1].id : undefined;

  let votedIds: string[] = [];
  let bookmarkedIds: string[] = [];
  if (session?.user?.id) {
    const adventureIds = adventures.map((a) => a.id);
    const [votes, bookmarks] = await Promise.all([
      prisma.vote.findMany({
        where: { userId: session.user.id, adventureId: { in: adventureIds } },
        select: { adventureId: true },
      }),
      prisma.bookmark.findMany({
        where: { userId: session.user.id, adventureId: { in: adventureIds } },
        select: { adventureId: true },
      }),
    ]);
    votedIds = votes.map((v) => v.adventureId);
    bookmarkedIds = bookmarks.map((b) => b.adventureId);
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-stone-800 bg-stone-950">
        {/* Topographic dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #d97706 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Diagonal accent */}
        <div
          className="absolute right-0 top-0 h-full w-px opacity-10"
          style={{ background: "linear-gradient(180deg, #d97706 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-amber-600/70">
                ▲ Basecamp / Explore
              </p>
              <h1 className="mt-3 font-display text-6xl uppercase leading-none tracking-widest text-stone-100 sm:text-8xl">
                Adventures
              </h1>
              <p className="mt-4 font-mono text-xs text-stone-500">
                {rawAdventures.length > 0
                  ? `${adventures.length}${hasMore ? "+" : ""} expeditions across 7 continents`
                  : "No adventures found — adjust your filters"}
              </p>
              <p className="mt-1 font-mono text-xs text-stone-700">
                Weekend escapes · week-long treks · multi-month expeditions
              </p>
            </div>
            {session && (
              <Link href="/adventures/new">
                <Button size="sm">Share Adventure</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildFilterUrl(params, { category: undefined })}
            className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
              !params.category
                ? "border border-amber-500 text-amber-500"
                : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => {
            const active = params.category === cat.value;
            return (
              <Link
                key={cat.value}
                href={buildFilterUrl(params, { category: active ? undefined : cat.value })}
                className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Duration quick-filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Duration
          </span>
          {(
            [
              { value: "weekend", label: "Weekend", sub: "1–3 days" },
              { value: "week", label: "Week", sub: "4–7 days" },
              { value: "fortnight", label: "Fortnight", sub: "8–14 days" },
              { value: "expedition", label: "Expedition", sub: "15–30 days" },
              { value: "peregrination", label: "Peregrinations", sub: "31–90 days" },
              { value: "lifestyle", label: "Lifestyle", sub: "91+ days" },
            ] as const
          ).map(({ value, label, sub }) => {
            const active = params.duration === value;
            const href = buildFilterUrl(params, { duration: active ? undefined : value });
            return (
              <Link
                key={value}
                href={href}
                className={`flex items-baseline gap-1.5 px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {label}
                <span className="font-mono text-[9px] normal-case tracking-normal opacity-60">
                  {sub}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Difficulty quick-filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Level
          </span>
          {DIFFICULTIES.map((diff) => {
            const active = params.difficulty === diff.value;
            const href = buildFilterUrl(params, { difficulty: active ? undefined : diff.value });
            return (
              <Link
                key={diff.value}
                href={href}
                className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? `border ${diff.value === "EASY" ? "border-emerald-500 text-emerald-400" : diff.value === "MODERATE" ? "border-amber-500 text-amber-400" : diff.value === "CHALLENGING" ? "border-orange-500 text-orange-400" : diff.value === "EXTREME" ? "border-red-500 text-red-400" : "border-purple-500 text-purple-400"}`
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {diff.label}
              </Link>
            );
          })}
        </div>

        {/* Continent quick-filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Continent
          </span>
          {CONTINENTS.map((continent) => {
            const active = params.continent === continent;
            const href = buildFilterUrl(params, { continent: active ? undefined : continent });
            return (
              <Link
                key={continent}
                href={href}
                className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {continent}
              </Link>
            );
          })}
        </div>

        {/* Search + sort */}
        <Suspense>
          <SearchFilter />
        </Suspense>

        <div className="mt-6">
          <InfiniteAdventureGrid
            key={[
              params.category,
              params.continent,
              params.difficulty,
              params.duration,
              params.search,
              params.sortBy,
            ].join("|")}
            initialAdventures={adventures}
            initialNextCursor={nextCursor}
            currentUserId={session?.user?.id}
            votedAdventureIds={votedIds}
            bookmarkedAdventureIds={bookmarkedIds}
            queryParams={{
              category: params.category,
              continent: params.continent,
              difficulty: params.difficulty,
              duration: params.duration,
              search: params.search,
              sortBy: params.sortBy,
            }}
          />
        </div>
      </div>
    </div>
  );
}
