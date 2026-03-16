import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Bucket List | Basecamp" };

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
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
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-amber-600/70">
          ▲ Basecamp / Bucket List
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase tracking-widest text-stone-100">
          Bucket List
        </h1>
        <p className="mt-2 font-mono text-xs text-stone-500">
          {bookmarks.length === 0
            ? "No adventures saved yet"
            : `${bookmarks.length} adventure${bookmarks.length === 1 ? "" : "s"} saved`}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="py-16 text-center border border-stone-800">
          <p className="font-display text-lg uppercase tracking-widest text-stone-500">
            Nothing saved yet
          </p>
          <p className="mt-2 font-mono text-xs text-stone-600">
            Bookmark adventures to add them to your bucket list.
          </p>
          <Link
            href="/adventures"
            className="mt-6 inline-block border border-stone-700 px-6 py-2 font-display text-xs uppercase tracking-widest text-stone-400 hover:border-amber-500 hover:text-amber-500 transition-colors"
          >
            Explore Adventures
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bookmarks.map(({ adventure }) => (
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
                  {adventure.category.replace(/_/g, " ")} · {adventure.difficulty.toLowerCase()} ·{" "}
                  {adventure.durationDays}d
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
