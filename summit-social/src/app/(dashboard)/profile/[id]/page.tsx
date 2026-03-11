import { AdventureHistory } from "@/components/profile/adventure-history";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
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
        {!isOwnProfile && (
          <FollowButton userId={id} isFollowing={isFollowing} disabled={!session?.user?.id} />
        )}
      </div>

      <div className="mt-10">
        <AdventureHistory adventures={user.adventures} currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}
