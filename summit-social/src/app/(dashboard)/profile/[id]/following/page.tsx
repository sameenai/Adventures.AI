import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  if (!user) return {};
  return { title: `${user.name ?? "User"} · Following | Basecamp` };
}

export default async function FollowingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, user] = await Promise.all([
    getServerSession(authOptions),
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        following: {
          orderBy: { createdAt: "desc" },
          include: {
            following: {
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

  const viewerFollowingIds = new Set<string>();
  if (session?.user?.id) {
    const follows = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: user.following.map((f) => f.following.id) },
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
        <span className="text-stone-400">Following</span>
      </nav>

      <h1 className="mb-6 font-display text-2xl uppercase tracking-widest text-stone-100">
        Following {user.following.length}
      </h1>

      {user.following.length === 0 ? (
        <p className="font-mono text-sm text-stone-600">Not following anyone yet.</p>
      ) : (
        <ul className="space-y-3">
          {user.following.map(({ following: followed }) => (
            <li
              key={followed.id}
              className="flex items-center justify-between gap-3 border border-stone-800 p-3"
            >
              <Link
                href={`/profile/${followed.id}`}
                className="flex items-center gap-3 group min-w-0"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-800">
                  {followed.avatarUrl && (
                    <Image
                      src={followed.avatarUrl}
                      alt={followed.name ?? ""}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors truncate">
                    {followed.name ?? "Anonymous"}
                  </p>
                  <p className="font-mono text-xs text-stone-600">
                    {followed._count.adventures}{" "}
                    {followed._count.adventures === 1 ? "adventure" : "adventures"}
                  </p>
                </div>
              </Link>
              {session?.user?.id && session.user.id !== followed.id && (
                <span className="shrink-0 font-mono text-xs text-stone-600">
                  {viewerFollowingIds.has(followed.id) ? "Following" : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
