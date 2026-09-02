import { Avatar } from "@/components/ui/avatar";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Find People | Basecamper" };

async function UserResults({ q }: { q: string }) {
  if (!q || q.trim().length < 2) {
    return (
      <p className="font-mono text-sm text-stone-600">
        Enter at least 2 characters to search for people.
      </p>
    );
  }

  const users = await prisma.user.findMany({
    where: { name: { contains: q.trim(), mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      _count: { select: { adventures: { where: { published: true } }, followers: true } },
    },
    orderBy: { adventures: { _count: "desc" } },
    take: 30,
  });

  if (users.length === 0) {
    return (
      <p className="font-mono text-sm text-stone-600">No users found for &ldquo;{q}&rdquo;.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-4 border border-stone-800 p-4 hover:border-stone-700 transition-colors group"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-stone-800">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors">
                {user.name ?? "Anonymous"}
              </p>
              {user.bio && (
                <p className="mt-0.5 font-mono text-xs text-stone-600 truncate">{user.bio}</p>
              )}
              <p className="mt-1 font-mono text-xs text-stone-600">
                {user._count.adventures} adventures · {user._count.followers} followers
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function UserSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { q = "" } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Community
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Find People
        </h1>
      </div>

      <form method="GET" className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            autoComplete="off"
            className="flex-1 border border-stone-700 bg-stone-900 px-4 py-2.5 font-mono text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            className="border border-stone-700 px-4 py-2.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <Suspense>
        <UserResults q={q} />
      </Suspense>
    </div>
  );
}
