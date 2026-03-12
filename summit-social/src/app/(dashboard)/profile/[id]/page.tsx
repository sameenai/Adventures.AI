import { AdventureHistory } from "@/components/profile/adventure-history";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, user] = await Promise.all([
    getServerSession(authOptions),
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        instagramUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        adventures: {
          where: { published: true },
          orderBy: { voteCount: "desc" },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            tags: true,
          },
        },
        bookmarks: {
          orderBy: { createdAt: "desc" },
          include: {
            adventure: {
              select: {
                id: true,
                title: true,
                coverImageUrl: true,
                location: true,
                country: true,
                category: true,
                difficulty: true,
                durationDays: true,
              },
            },
          },
        },
        _count: {
          select: {
            adventures: { where: { published: true } },
            votes: true,
            followers: true,
            following: true,
          },
        },
      },
    }),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === id;
  const isFollowing = session?.user?.id
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: id } },
        select: { id: true },
      }))
    : false;

  // Only show bookmarks to the owner of the profile
  const showBookmarks = isOwnProfile && user.bookmarks.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader user={user} />

      <div className="mt-4 flex items-center gap-6">
        <div className="flex gap-6 font-mono text-xs text-stone-500">
          <span>
            <span className="text-stone-200">{user._count.adventures}</span> adventures
          </span>
          <span>
            <span className="text-stone-200">{user._count.followers}</span> followers
          </span>
          <span>
            <span className="text-stone-200">{user._count.following}</span> following
          </span>
        </div>
        {isOwnProfile ? (
          <Link
            href="/profile/edit"
            className="border border-stone-700 px-4 py-1.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
          >
            Edit Profile
          </Link>
        ) : (
          <FollowButton userId={id} isFollowing={isFollowing} disabled={!session?.user?.id} />
        )}
      </div>

      <div className="mt-10">
        <AdventureHistory adventures={user.adventures} currentUserId={session?.user?.id} />
      </div>

      {showBookmarks && (
        <div className="mt-12">
          <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
            Bucket List · {user.bookmarks.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user.bookmarks.map(({ adventure }) => (
              <Link
                key={adventure.id}
                href={`/adventures/${adventure.id}`}
                className="flex items-center gap-3 border border-stone-800 p-3 hover:border-stone-700 transition-colors group"
              >
                <div className="relative h-14 w-20 shrink-0 overflow-hidden">
                  <Image
                    src={adventure.coverImageUrl}
                    alt={adventure.title}
                    fill
                    className="object-cover brightness-75 group-hover:brightness-90 transition-all"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors truncate">
                    {adventure.title}
                  </p>
                  <p className="font-mono text-xs text-stone-600 truncate">
                    {adventure.location}, {adventure.country}
                  </p>
                  <p className="font-mono text-xs text-stone-700">
                    {adventure.category.replace(/_/g, " ")} · {adventure.difficulty.toLowerCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
