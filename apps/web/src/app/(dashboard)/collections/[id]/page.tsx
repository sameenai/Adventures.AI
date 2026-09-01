import { AdventureCard } from "@/components/adventures/adventure-card";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Collection | Basecamper" };

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Owner-only for now: a collection that doesn't exist or isn't yours is a 404.
  const collection = await prisma.collection.findUnique({
    where: { id, userId: session.user.id },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          adventure: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
              tags: true,
              _count: { select: { comments: true } },
            },
          },
        },
      },
    },
  });

  if (!collection) notFound();

  const adventureIds = collection.items.map((item) => item.adventureId);
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
  const votedIds = new Set(votes.map((v) => v.adventureId));
  const bookmarkedIds = new Set(bookmarks.map((b) => b.adventureId));
  const itemCount = collection.items.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-amber-600/70">
          ▲ Basecamper / Collection
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-widest text-stone-100">
          {collection.name}
        </h1>
        <p className="mt-2 font-mono text-xs text-stone-500">
          {itemCount === 0
            ? "No adventures in this collection yet"
            : `${itemCount} adventure${itemCount === 1 ? "" : "s"}`}
        </p>
        <Link
          href={`/profile/${session.user.id}`}
          className="mt-3 inline-block font-mono text-xs text-stone-600 transition-colors hover:text-amber-500"
        >
          ← Back to your profile
        </Link>
      </div>

      {itemCount === 0 ? (
        <div className="border border-stone-800 py-16 text-center">
          <p className="font-display text-lg uppercase tracking-widest text-stone-500">
            Nothing here yet
          </p>
          <p className="mt-2 font-mono text-xs text-stone-600">
            Save an adventure, then add it to this collection.
          </p>
          <Link
            href="/adventures"
            className="mt-6 inline-block border border-stone-700 px-6 py-2 font-display text-xs uppercase tracking-widest text-stone-400 transition-colors hover:border-amber-500 hover:text-amber-500"
          >
            Explore Adventures
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map(({ adventure }) => (
            <AdventureCard
              key={adventure.id}
              adventure={adventure}
              currentUserId={session.user.id}
              hasVoted={votedIds.has(adventure.id)}
              hasBookmarked={bookmarkedIds.has(adventure.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
