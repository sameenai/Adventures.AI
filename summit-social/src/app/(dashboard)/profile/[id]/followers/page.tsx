import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  if (!user) return {};
  return { title: `${user.name ?? "User"} · Followers | SummitSocial` };
}

export default async function FollowersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, user] = await Promise.all([
    getServerSession(authOptions),
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        followers: {
          orderBy: { createdAt: "desc" },
          include: {
            follower: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                _count: { select: { adventures: { where: { published: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!user) notFound();

  // Check which of these followers the current user is also following
  const viewerFollowingIds = new Set<string>();
  if (session?.user?.id) {
    const follows = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: user.followers.map((f) => f.follower.id) },
      },
      select: { followingId: true },
    });
    for (const f of follows) viewerFollowingIds.add(f.followingId);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-600">
        <Link href={`/profile/${id}`} className="hover:text-amber-500 transition-colors">
          {user.name ?? "Profile"}
        </Link>
        <span>/</span>
        <span className="text-stone-400">Followers</span>
      </nav>

      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-stone-100">
        {user.followers.length} {user.followers.length === 1 ? "Follower" : "Followers"}
      </h1>

      {user.followers.length === 0 ? (
        <p className="font-mono text-sm text-stone-600">No followers yet.</p>
      ) : (
        <ul className="space-y-3">
          {user.followers.map(({ follower }) => (
            <li
              key={follower.id}
              className="flex items-center justify-between gap-3 border border-stone-800 p-3"
            >
              <Link
                href={`/profile/${follower.id}`}
                className="flex items-center gap-3 group min-w-0"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-800">
                  {follower.avatarUrl && (
                    <Image
                      src={follower.avatarUrl}
                      alt={follower.name ?? ""}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors truncate">
                    {follower.name ?? "Anonymous"}
                  </p>
                  <p className="font-mono text-xs text-stone-600">
                    {follower._count.adventures}{" "}
                    {follower._count.adventures === 1 ? "adventure" : "adventures"}
                  </p>
                </div>
              </Link>
              {session?.user?.id && session.user.id !== follower.id && (
                <span className="shrink-0 font-mono text-xs text-stone-600">
                  {viewerFollowingIds.has(follower.id) ? "Following" : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
