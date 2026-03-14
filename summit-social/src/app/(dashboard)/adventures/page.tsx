import { InfiniteAdventureGrid } from "@/components/adventures/infinite-adventure-grid";
import { SearchFilter } from "@/components/adventures/search-filter";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = { title: "Adventures | SummitSocial" };

const PAGE_SIZE = 20;

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();
  const sortBy = params.sortBy ?? "votes";

  const where = {
    published: true,
    ...(params.category && { category: params.category as never }),
    ...(params.continent && { continent: params.continent }),
    ...(params.difficulty && { difficulty: params.difficulty as never }),
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between border-b border-stone-800 pb-6">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
            Community
          </p>
          <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
            Adventures
          </h1>
        </div>
        {session && (
          <Link href="/adventures/new">
            <Button size="sm">Share Adventure</Button>
          </Link>
        )}
      </div>

      {/* Category filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/adventures"
          className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
            !params.category
              ? "border border-amber-500 text-amber-500"
              : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={`/adventures?category=${cat.value}`}
            className={`px-3 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
              params.category === cat.value
                ? "border border-amber-500 text-amber-500"
                : "border border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Search + sort */}
      <Suspense>
        <SearchFilter />
      </Suspense>

      <div className="mt-6">
        <InfiniteAdventureGrid
          initialAdventures={adventures}
          initialNextCursor={nextCursor}
          currentUserId={session?.user?.id}
          votedAdventureIds={votedIds}
          bookmarkedAdventureIds={bookmarkedIds}
          queryParams={{
            category: params.category,
            continent: params.continent,
            difficulty: params.difficulty,
            search: params.search,
            sortBy: params.sortBy,
          }}
        />
      </div>
    </div>
  );
}
