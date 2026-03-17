import { AdventureHistory } from "@/components/profile/adventure-history";
import { CollectionsPanel } from "@/components/profile/collections-panel";
import { FollowButton } from "@/components/profile/follow-button";
import { FollowSuggestions } from "@/components/profile/follow-suggestions";
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
        plan: true,
        openAiApiKey: true,
        adventures: {
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
  const hasApiKey = Boolean(user.openAiApiKey);

  // Non-owners only see published adventures
  const visibleAdventures = isOwnProfile
    ? user.adventures
    : user.adventures.filter((a) => a.published);

  const [isFollowing, collections] = await Promise.all([
    session?.user?.id
      ? prisma.follow
          .findUnique({
            where: { followerId_followingId: { followerId: session.user.id, followingId: id } },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    isOwnProfile
      ? prisma.collection.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { items: true } },
            items: {
              take: 1,
              include: { adventure: { select: { coverImageUrl: true } } },
              orderBy: { addedAt: "desc" },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  // Only show bookmarks to the owner of the profile
  const showBookmarks = isOwnProfile && user.bookmarks.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {isOwnProfile && !hasApiKey && user.plan !== "PRO" && (
        <div className="mb-6 border border-amber-500/60 bg-amber-500/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-amber-500">
                Unlock AI Trip Planning
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
                Add your OpenAI API key to start building personalised, day-by-day itineraries with
                GPT-4o. Your key is stored privately, never shared, and lets you bypass the monthly
                session limit.
              </p>
            </div>
            <Link
              href="/profile/edit#api-key"
              className="shrink-0 border border-amber-500 bg-amber-500 px-4 py-2 font-display text-xs uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
            >
              Add API Key
            </Link>
          </div>
        </div>
      )}
      <ProfileHeader user={user} />

      <div className="mt-4 flex items-center gap-6">
        <div className="flex gap-6 font-mono text-xs text-stone-500">
          <span>
            <span className="text-stone-200">{user._count.adventures}</span> adventures
          </span>
          <Link
            href={`/profile/${id}/followers`}
            className="hover:text-amber-500 transition-colors"
          >
            <span className="text-stone-200">{user._count.followers}</span> followers
          </Link>
          <Link
            href={`/profile/${id}/following`}
            className="hover:text-amber-500 transition-colors"
          >
            <span className="text-stone-200">{user._count.following}</span> following
          </Link>
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
        <AdventureHistory
          adventures={visibleAdventures}
          currentUserId={session?.user?.id}
          showManageActions={isOwnProfile}
        />
      </div>

      {isOwnProfile && <CollectionsPanel initialCollections={collections} />}

      {/* Follow suggestions: shown to logged-in users based on top category of this profile */}
      {session?.user?.id && <FollowSuggestions category={visibleAdventures[0]?.category} />}

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
