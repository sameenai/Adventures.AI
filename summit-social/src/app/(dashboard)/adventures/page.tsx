import { InfiniteAdventureGrid } from "@/components/adventures/infinite-adventure-grid";
import { SearchFilter } from "@/components/adventures/search-filter";
import { ViewToggle } from "@/components/adventures/view-toggle";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { encodeCursor } from "@/lib/pagination";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Adventures | Basecamp" };

const PAGE_SIZE = 20;

// Toggle a value in/out of a comma-separated param, then return the new URL.
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

function toggleMultiValue(
  current: Record<string, string | undefined>,
  key: string,
  value: string,
): string {
  const existing = current[key] ? (current[key] as string).split(",") : [];
  const next = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value];
  return buildFilterUrl(current, { [key]: next.length > 0 ? next.join(",") : undefined });
}

function isActive(param: string | undefined, value: string): boolean {
  return param ? param.split(",").includes(value) : false;
}

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";
  const search = params.search?.trim();
  const sortBy = params.sortBy ?? "votes";
  const months = params.month
    ? params.month
        .split(",")
        .map(Number)
        .filter((n) => n >= 1 && n <= 12)
    : [];
  const tag = params.tag;

  const categories = params.category ? params.category.split(",") : [];
  const continents = params.continent ? params.continent.split(",") : [];
  const difficulties = params.difficulty ? params.difficulty.split(",") : [];
  const durations = params.duration ? params.duration.split(",") : [];
  const VALID_CLIMATES = new Set(["hot", "cold", "mixed"]);
  const climates = (params.climate?.split(",") ?? []).filter((c) => VALID_CLIMATES.has(c));

  const hasActiveFilters =
    categories.length > 0 ||
    continents.length > 0 ||
    difficulties.length > 0 ||
    durations.length > 0 ||
    months.length > 0 ||
    climates.length > 0 ||
    !!tag ||
    !!search;

  const DURATION_RANGES = {
    weekend: { gte: 1, lte: 3 },
    week: { gte: 4, lte: 7 },
    fortnight: { gte: 8, lte: 14 },
    expedition: { gte: 15, lte: 30 },
    peregrination: { gte: 31, lte: 90 },
    lifestyle: { gte: 91 },
  } as const;

  const andConditions: Prisma.AdventureWhereInput[] = [];
  if (durations.length > 0) {
    const validDurations = durations.filter(
      (d) => d in DURATION_RANGES,
    ) as (keyof typeof DURATION_RANGES)[];
    if (validDurations.length > 0) {
      andConditions.push({ OR: validDurations.map((d) => ({ durationDays: DURATION_RANGES[d] })) });
    }
  }
  if (climates.length > 0) {
    andConditions.push({ OR: climates.map((c) => ({ climate: { has: c } })) });
  }
  if (months.length > 0) {
    andConditions.push({ OR: months.map((m) => ({ bestMonths: { has: m } })) });
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

  const where = {
    published: true,
    ...(categories.length > 0 && {
      category: categories.length === 1 ? (categories[0] as never) : { in: categories as never[] },
    }),
    ...(continents.length > 0 && {
      continent: continents.length === 1 ? continents[0] : { in: continents },
    }),
    ...(difficulties.length > 0 && {
      difficulty:
        difficulties.length === 1 ? (difficulties[0] as never) : { in: difficulties as never[] },
    }),
    ...(tag && { tags: { some: { name: tag } } }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  const include = {
    user: { select: { id: true, name: true, avatarUrl: true } },
    tags: true,
    _count: { select: { comments: true } },
  };

  // Fetch a featured (top-voted) adventure for the hero banner — independent of current filters.
  const [session, featured, rawAdventures, totalCount] = await Promise.all([
    getServerSession(authOptions),
    prisma.adventure.findFirst({
      where: { published: true },
      orderBy: { voteCount: "desc" },
      select: {
        id: true,
        title: true,
        country: true,
        location: true,
        category: true,
        durationDays: true,
        voteCount: true,
        coverImageUrl: true,
      },
    }),
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
              ? [{ createdAt: "desc" as const }, { id: "asc" as const }]
              : sortBy === "duration"
                ? [{ durationDays: "asc" as const }, { id: "asc" as const }]
                : [{ voteCount: "desc" as const }, { id: "asc" as const }],
          take: PAGE_SIZE + 1,
          include,
        }),
    prisma.adventure.count({ where: { published: true } }),
  ]);

  const hasMore = rawAdventures.length > PAGE_SIZE;
  const adventures = hasMore ? rawAdventures.slice(0, PAGE_SIZE) : rawAdventures;

  let nextCursor: string | undefined;
  if (hasMore) {
    const last = adventures[adventures.length - 1];
    if (sortBy === "newest") {
      nextCursor = encodeCursor({ c: last.createdAt.toISOString(), id: last.id });
    } else if (sortBy === "duration") {
      nextCursor = encodeCursor({ d: last.durationDays, id: last.id });
    } else {
      nextCursor = encodeCursor({ v: last.voteCount, id: last.id });
    }
  }

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
      {/* Full-bleed hero with featured adventure background */}
      <div className="relative h-[380px] overflow-hidden border-b border-stone-800 sm:h-[520px]">
        {featured ? (
          <>
            <Image
              src={featured.coverImageUrl}
              alt={featured.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-stone-950" />
        )}

        {/* Topographic dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(217,119,6,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8 sm:pb-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-amber-500/70">
                ▲ Basecamp / Explore
              </p>
              <h1 className="mt-3 font-display text-5xl uppercase leading-none tracking-widest text-stone-100 sm:text-8xl drop-shadow-2xl">
                Adventures
              </h1>
              <p className="mt-5 font-mono text-xs text-stone-400">
                {hasActiveFilters
                  ? `${adventures.length}${hasMore ? "+" : ""} of ${totalCount.toLocaleString()} expeditions`
                  : `${totalCount.toLocaleString()} expeditions across 7 continents`}
              </p>
              <p className="mt-1 font-mono text-xs text-stone-600">
                Weekend escapes · week-long treks · multi-month expeditions
              </p>
            </div>
            {session && (
              <Link href="/adventures/new">
                <Button size="sm">Share Adventure</Button>
              </Link>
            )}
          </div>

          {/* Featured adventure card at bottom */}
          {featured && (
            <div className="mt-8">
              <Link
                href={`/adventures/${featured.id}`}
                className="group inline-flex items-center gap-4"
              >
                <div className="border border-amber-500/40 bg-stone-950/80 px-4 py-2.5 backdrop-blur-sm group-hover:border-amber-500/80 transition-colors">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500/70">
                    Featured
                  </p>
                  <p className="mt-0.5 font-display text-sm uppercase tracking-wider text-stone-100 group-hover:text-amber-400 transition-colors">
                    {featured.title}
                  </p>
                  <p className="font-mono text-[10px] text-stone-500">
                    {featured.country} · {featured.durationDays || 1} days · {featured.voteCount}{" "}
                    votes
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-8">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Category
          </span>
          <Link
            href={buildFilterUrl(params, { category: undefined })}
            className={`px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
              categories.length === 0
                ? "border border-amber-500 text-amber-500"
                : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => {
            const active = isActive(params.category, cat.value);
            return (
              <Link
                key={cat.value}
                href={toggleMultiValue(params, "category", cat.value)}
                className={`px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
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
            const active = isActive(params.duration, value);
            const href = toggleMultiValue(params, "duration", value);
            return (
              <Link
                key={value}
                href={href}
                className={`flex items-baseline gap-1.5 px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Level
          </span>
          {DIFFICULTIES.map((diff) => {
            const active = isActive(params.difficulty, diff.value);
            const href = toggleMultiValue(params, "difficulty", diff.value);
            return (
              <Link
                key={diff.value}
                href={href}
                className={`px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Continent
          </span>
          {CONTINENTS.map((continent) => {
            const active = isActive(params.continent, continent);
            const href = toggleMultiValue(params, "continent", continent);
            return (
              <Link
                key={continent}
                href={href}
                className={`px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
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

        {/* Climate quick-filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Climate
          </span>
          {(
            [
              { value: "hot", label: "Hot", icon: "☀" },
              { value: "cold", label: "Cold", icon: "❄" },
              { value: "mixed", label: "Mixed", icon: "⛅" },
            ] as const
          ).map(({ value, label, icon }) => {
            const active = isActive(params.climate, value);
            const href = toggleMultiValue(params, "climate", value);
            return (
              <Link
                key={value}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Month quick-filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-700 pr-1">
            Season
          </span>
          {(
            [
              { value: 1, label: "Jan" },
              { value: 2, label: "Feb" },
              { value: 3, label: "Mar" },
              { value: 4, label: "Apr" },
              { value: 5, label: "May" },
              { value: 6, label: "Jun" },
              { value: 7, label: "Jul" },
              { value: 8, label: "Aug" },
              { value: 9, label: "Sep" },
              { value: 10, label: "Oct" },
              { value: 11, label: "Nov" },
              { value: 12, label: "Dec" },
            ] as const
          ).map(({ value, label }) => {
            const active = months.includes(value);
            const href = toggleMultiValue(params, "month", String(value));
            return (
              <Link
                key={value}
                href={href}
                className={`px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Search + sort + view toggle */}
        <div className="mt-8 flex items-center gap-2">
          <div className="flex-1">
            <Suspense>
              <SearchFilter />
            </Suspense>
          </div>
          <Suspense>
            <ViewToggle current={view} />
          </Suspense>
        </div>

        <div className="mt-6">
          <InfiniteAdventureGrid
            key={[
              params.category,
              params.continent,
              params.difficulty,
              params.duration,
              params.month,
              params.climate,
              params.tag,
              params.search,
              params.sortBy,
            ].join("|")}
            initialAdventures={adventures}
            initialNextCursor={nextCursor}
            currentUserId={session?.user?.id}
            votedAdventureIds={votedIds}
            bookmarkedAdventureIds={bookmarkedIds}
            category={params.category}
            continent={params.continent}
            difficulty={params.difficulty}
            duration={params.duration}
            month={params.month}
            climate={params.climate}
            tag={params.tag}
            search={params.search}
            sortBy={params.sortBy}
            view={view}
          />
        </div>
      </div>
    </div>
  );
}
