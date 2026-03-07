import { AdventureGrid } from "@/components/adventures/adventure-grid";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CONTINENTS, DIFFICULTIES } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/config";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const metadata = { title: "Adventures | SummitSocial" };

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const adventures = await prisma.adventure.findMany({
    where: {
      published: true,
      ...(params.category && { category: params.category as never }),
      ...(params.continent && { continent: params.continent }),
      ...(params.difficulty && { difficulty: params.difficulty as never }),
    },
    orderBy: { voteCount: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
    },
  });

  let votedIds = new Set<string>();
  if (session?.user?.id) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        adventureId: { in: adventures.map((a) => a.id) },
      },
      select: { adventureId: true },
    });
    votedIds = new Set(votes.map((v) => v.adventureId));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Adventures</h1>
        {session && (
          <Link href="/adventures/new">
            <Button>Share Adventure</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={`/adventures?category=${cat.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              params.category === cat.value
                ? "bg-summit-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <AdventureGrid
          adventures={adventures}
          currentUserId={session?.user?.id}
          votedAdventureIds={votedIds}
        />
      </div>
    </div>
  );
}
