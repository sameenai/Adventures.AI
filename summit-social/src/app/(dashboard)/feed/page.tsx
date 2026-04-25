import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { timeAgo } from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Activity Feed | Basecamp" };

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Get IDs of users this person follows
  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-2">
          Activity Feed
        </p>
        <h1 className="font-display text-3xl uppercase tracking-widest text-stone-100 mb-4">
          Nothing here yet
        </h1>
        <p className="font-mono text-sm text-stone-500 mb-8">
          Follow other adventurers to see their latest adventures and comments here.
        </p>
        <Link
          href="/adventures"
          className="border border-amber-500 bg-amber-500 px-6 py-2 font-display text-xs uppercase tracking-widest text-ink hover:bg-amber-400 transition-colors"
        >
          Explore Adventures
        </Link>
      </div>
    );
  }

  // Fetch recent adventures and comments from followed users (last 50)
  const [recentAdventures, recentComments] = await Promise.all([
    prisma.adventure.findMany({
      where: { userId: { in: followingIds }, published: true },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        tags: { take: 3 },
      },
    }),
    prisma.comment.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        adventure: { select: { id: true, title: true } },
      },
    }),
  ]);

  // Merge and sort by date
  type FeedItem =
    | { type: "adventure"; createdAt: Date; data: (typeof recentAdventures)[0] }
    | { type: "comment"; createdAt: Date; data: (typeof recentComments)[0] };

  const feed: FeedItem[] = [
    ...recentAdventures.map((a) => ({
      type: "adventure" as const,
      createdAt: a.createdAt,
      data: a,
    })),
    ...recentComments.map((c) => ({ type: "comment" as const, createdAt: c.createdAt, data: c })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Following {followingIds.length} people
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Activity Feed
        </h1>
      </div>

      {feed.length === 0 ? (
        <p className="font-mono text-sm text-stone-500 text-center py-12">
          No recent activity from people you follow.
        </p>
      ) : (
        <ul className="space-y-4">
          {feed.map((item) => (
            <li
              key={`${item.type}-${item.data.id}`}
              className="border border-stone-800 p-4 hover:border-stone-700 transition-colors"
            >
              {item.type === "adventure" ? (
                <AdventureFeedItem adventure={item.data} />
              ) : (
                <CommentFeedItem comment={item.data} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdventureFeedItem({
  adventure,
}: {
  adventure: {
    id: string;
    title: string;
    location: string;
    country: string;
    category: string;
    difficulty: string;
    durationDays: number;
    coverImageUrl: string;
    createdAt: Date;
    user: { id: string; name: string | null; avatarUrl: string | null };
    tags: { name: string }[];
  };
}) {
  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty as never);
  return (
    <div className="flex gap-4">
      <Link
        href={`/adventures/${adventure.id}`}
        className="relative h-20 w-28 shrink-0 overflow-hidden border border-stone-800"
      >
        <Image
          src={adventure.coverImageUrl}
          alt={adventure.title}
          fill
          className="object-cover brightness-75"
          sizes="112px"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/profile/${adventure.user.id}`}
            className="font-mono text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            {adventure.user.name}
          </Link>
          <span className="font-mono text-xs text-stone-600">shared a new adventure</span>
        </div>
        <Link
          href={`/adventures/${adventure.id}`}
          className="font-display text-sm uppercase tracking-wider text-stone-200 hover:text-amber-400 transition-colors block"
        >
          {adventure.title}
        </Link>
        <p className="font-mono text-xs text-stone-500 mt-0.5">
          {adventure.location} · <span className={difficulty?.color}>{difficulty?.label}</span>
        </p>
        <p className="font-mono text-[10px] text-stone-700 mt-1">{timeAgo(adventure.createdAt)}</p>
      </div>
    </div>
  );
}

function CommentFeedItem({
  comment,
}: {
  comment: {
    id: string;
    body: string;
    createdAt: Date;
    user: { id: string; name: string | null; avatarUrl: string | null };
    adventure: { id: string; title: string };
  };
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/profile/${comment.user.id}`}
          className="font-mono text-xs text-amber-500 hover:text-amber-400 transition-colors"
        >
          {comment.user.name}
        </Link>
        <span className="font-mono text-xs text-stone-600">commented on</span>
        <Link
          href={`/adventures/${comment.adventure.id}`}
          className="font-mono text-xs text-stone-400 hover:text-amber-400 transition-colors"
        >
          {comment.adventure.title}
        </Link>
      </div>
      <p className="font-mono text-xs text-stone-400 line-clamp-2 leading-relaxed">
        "{comment.body}"
      </p>
      <p className="font-mono text-[10px] text-stone-700 mt-1">{timeAgo(comment.createdAt)}</p>
    </div>
  );
}
