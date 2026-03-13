import { AdventureGrid } from "@/components/adventures/adventure-grid";
import { SearchFilter } from "@/components/adventures/search-filter";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = { title: "Adventures | SummitSocial" };

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();
  const sortBy = params.sortBy ?? "votes";

  const orderBy =
    sortBy === "newest"
      ? { createdAt: "desc" as const }
      : sortBy === "duration"
        ? { durationDays: "asc" as const }
        : { voteCount: "desc" as const };

  const [session, adventures] = await Promise.all([
    getServerSession(authOptions),
    prisma.adventure.findMany({
      where: {
        published: true,
        ...(params.category && { category: params.category as never }),
        ...(params.continent && { continent: params.continent }),
        ...(params.difficulty && { difficulty: params.difficulty as never }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy,
      take: 20,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        tags: true,
        _count: { select: { comments: true } },
      },
    }),
  ]);

  let votedIds = new Set<string>();
  let bookmarkedIds = new Set<string>();
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
    votedIds = new Set(votes.map((v) => v.adventureId));
    bookmarkedIds = new Set(bookmarks.map((b) => b.adventureId));
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
        <AdventureGrid
          adventures={adventures}
          currentUserId={session?.user?.id}
          votedAdventureIds={votedIds}
          bookmarkedAdventureIds={bookmarkedIds}
        />
      </div>
    </div>
  );
}
