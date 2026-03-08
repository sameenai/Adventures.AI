import { AdventureHistory } from "@/components/profile/adventure-history";
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
        _count: { select: { adventures: true, votes: true } },
      },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader user={user} />
      <div className="mt-10">
        <AdventureHistory adventures={user.adventures} currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}
