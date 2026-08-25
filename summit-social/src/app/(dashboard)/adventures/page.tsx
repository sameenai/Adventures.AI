import { AdventureCard } from "@/components/adventures/adventure-card";
import { InfiniteAdventureGrid } from "@/components/adventures/infinite-adventure-grid";
import { SearchFilter } from "@/components/adventures/search-filter";
import { ViewToggle } from "@/components/adventures/view-toggle";
import { Button } from "@/components/ui/button";
import { ADVENTURE_LIST_INCLUDE, fetchAdventuresPage } from "@/lib/adventures/query";
import type { AdventureListItem } from "@/lib/adventures/query";
import { authOptions } from "@/lib/auth/config";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getCached, setCache } from "@/lib/db/redis";
import { adventureFilterSchema } from "@/lib/validators/adventure";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Adventures | Basecamper" };

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

const IN_SEASON_LIMIT = 6;
const IN_SEASON_TTL_SECONDS = 600;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Top-voted published adventures whose bestMonths include the current month.
// Identical for every visitor, so served from Redis for 10 minutes.
async function getInSeasonAdventures(month: number): Promise<AdventureListItem[]> {
  const cacheKey = `in-season:${month}`;
  const cached = await withTimeout(getCached<AdventureListItem[]>(cacheKey), 500, null);
  if (cached) return cached;

  const adventures = await prisma.adventure.findMany({
    where: { published: true, bestMonths: { has: month } },
    orderBy: { voteCount: "desc" },
    take: IN_SEASON_LIMIT,
    include: ADVENTURE_LIST_INCLUDE,
  });
  setCache(cacheKey, adventures, IN_SEASON_TTL_SECONDS).catch(() => {});
  return adventures;
}

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";

  // Parse the URL filters through the exact same schema the API route uses so
  // page and API can never drift. Invalid params fall back to the defaults
  // (unfiltered, votes sort) instead of erroring the page render.
  const parsedFilters = adventureFilterSchema.safeParse({
    category: params.category,
    continent: params.continent,
    difficulty: params.difficulty,
    duration: params.duration,
    month: params.month,
    climate: params.climate,
    tag: params.tag,
    search: params.search?.trim() || undefined,
    sortBy: params.sortBy,
  });
  const filters = parsedFilters.success ? parsedFilters.data : adventureFilterSchema.parse({});
  const months = filters.month ?? [];

  const hasActiveFilters = Boolean(
    filters.category?.length ||
      filters.continent?.length ||
      filters.difficulty?.length ||
      filters.duration?.length ||
      filters.month?.length ||
      filters.climate?.length ||
      filters.tag ||
      filters.search,
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentMonthName = now.toLocaleString("en-GB", { month: "long" });

  // Fetch a featured (top-voted) adventure for the hero banner — independent of current filters.
  const [session, featured, { items: adventures, nextCursor }, totalCount, inSeason] =
    await Promise.all([
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
      fetchAdventuresPage(filters),
      prisma.adventure.count({ where: { published: true } }),
      // In-season rail only renders on the unfiltered view — skip the query otherwise.
      hasActiveFilters
        ? Promise.resolve([])
        : withTimeout(getInSeasonAdventures(currentMonth), 2000, []),
    ]);

  const hasMore = nextCursor !== undefined;

  let votedIds: string[] = [];
  let bookmarkedIds: string[] = [];
  if (session?.user?.id) {
    const adventureIds = [...new Set([...adventures, ...inSeason].map((a) => a.id))];
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

  const filterChip = (active: boolean) =>
    `px-3 py-1.5 text-xs transition-colors ${
      active
        ? "border border-amber-500 text-amber-500"
        : "border border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300"
    }`;

  return (
    <div>
      {/* Page header */}
      <div className="border-b border-stone-800 px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
                Basecamper / Explore
              </p>
              <h1 className="mt-3 font-display text-5xl font-light leading-none tracking-[-0.5px] text-stone-100 sm:text-7xl">
                Adventures
              </h1>
              <p className="mt-3 text-xs text-stone-600">
                {hasActiveFilters
                  ? `${adventures.length}${hasMore ? "+" : ""} of ${totalCount.toLocaleString()} expeditions`
                  : `${totalCount.toLocaleString()} expeditions across 7 continents`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {featured && (
                <Link
                  href={`/adventures/${featured.id}`}
                  className="group hidden border border-stone-800 px-4 py-2.5 transition-colors hover:border-stone-700 sm:block"
                >
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-600">
                    Top voted
                  </p>
                  <p className="mt-0.5 font-display text-sm font-light text-stone-100 transition-colors group-hover:text-amber-500">
                    {featured.title}
                  </p>
                  <p className="font-mono text-[10px] text-stone-600">
                    {featured.country} · {featured.durationDays || 1} days
                  </p>
                </Link>
              )}
              {session && (
                <Link href="/adventures/new">
                  <Button size="sm">Share Adventure</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-6 lg:px-8">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
            Category
          </span>
          <Link
            href={buildFilterUrl(params, { category: undefined })}
            className={filterChip(!filters.category?.length)}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={toggleMultiValue(params, "category", cat.value)}
              className={filterChip(isActive(params.category, cat.value))}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Duration quick-filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
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
            return (
              <Link
                key={value}
                href={toggleMultiValue(params, "duration", value)}
                className={`flex items-baseline gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border border-amber-500 text-amber-500"
                    : "border border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300"
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
            Level
          </span>
          {DIFFICULTIES.map((diff) => {
            const active = isActive(params.difficulty, diff.value);
            return (
              <Link
                key={diff.value}
                href={toggleMultiValue(params, "difficulty", diff.value)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? `border ${diff.value === "EASY" ? "border-emerald-500 text-emerald-400" : diff.value === "MODERATE" ? "border-amber-500 text-amber-400" : diff.value === "CHALLENGING" ? "border-orange-500 text-orange-400" : diff.value === "EXTREME" ? "border-red-500 text-red-400" : "border-purple-500 text-purple-400"}`
                    : "border border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300"
                }`}
              >
                {diff.label}
              </Link>
            );
          })}
        </div>

        {/* Continent quick-filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
            Continent
          </span>
          {CONTINENTS.map((continent) => (
            <Link
              key={continent}
              href={toggleMultiValue(params, "continent", continent)}
              className={filterChip(isActive(params.continent, continent))}
            >
              {continent}
            </Link>
          ))}
        </div>

        {/* Climate quick-filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
            Climate
          </span>
          {(
            [
              { value: "hot", label: "Hot" },
              { value: "cold", label: "Cold" },
              { value: "mixed", label: "Mixed" },
            ] as const
          ).map(({ value, label }) => (
            <Link
              key={value}
              href={toggleMultiValue(params, "climate", value)}
              className={filterChip(isActive(params.climate, value))}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Month quick-filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="pr-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-700">
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
          ).map(({ value, label }) => (
            <Link
              key={value}
              href={toggleMultiValue(params, "month", String(value))}
              className={filterChip(months.includes(value))}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Search + sort + view toggle */}
        <div className="mt-6 flex items-center gap-2">
          <div className="flex-1">
            <Suspense>
              <SearchFilter />
            </Suspense>
          </div>
          <Suspense>
            <ViewToggle current={view} />
          </Suspense>
        </div>

        {/* In-season rail — only on the unfiltered view */}
        {!hasActiveFilters && inSeason.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
              In season in {currentMonthName}
            </h2>
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
              {inSeason.map((adventure) => (
                <div key={adventure.id} className="w-72 shrink-0">
                  <AdventureCard
                    adventure={adventure}
                    currentUserId={session?.user?.id}
                    hasVoted={votedIds.includes(adventure.id)}
                    hasBookmarked={bookmarkedIds.includes(adventure.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

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
