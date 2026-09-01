import { PublishButton } from "@/components/admin/publish-button";
import { Avatar } from "@/components/ui/avatar";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { timeAgo } from "@/lib/utils";
import { getServerSession } from "next-auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Moderation Queue | Basecamper" };

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];
  return adminEmails.includes(email);
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-red-500 mb-3">
          Access Denied
        </p>
        <h1 className="font-display text-3xl uppercase tracking-widest text-stone-300">
          Forbidden
        </h1>
        <p className="mt-3 text-sm text-stone-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const [unpublished, recentlyPublished] = await Promise.all([
    prisma.adventure.findMany({
      where: { published: false },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.adventure.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-800 pb-6 mb-8">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-1">
          Admin
        </p>
        <h1 className="font-display text-4xl uppercase tracking-widest text-stone-100">
          Moderation Queue
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {unpublished.length} pending {unpublished.length === 1 ? "submission" : "submissions"}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xs uppercase tracking-widest text-amber-500 mb-4">
          Pending Review
        </h2>
        {unpublished.length === 0 ? (
          <p className="text-sm text-stone-600 border border-stone-800 px-4 py-6 text-center">
            No pending submissions. All caught up.
          </p>
        ) : (
          <div className="space-y-px">
            {unpublished.map((adventure) => (
              <AdventureRow key={adventure.id} adventure={adventure} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xs uppercase tracking-widest text-stone-500 mb-4">
          Recently Published
        </h2>
        <div className="space-y-px">
          {recentlyPublished.map((adventure) => (
            <AdventureRow key={adventure.id} adventure={adventure} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AdventureRow({
  adventure,
}: {
  adventure: {
    id: string;
    title: string;
    location: string;
    country: string;
    category: string;
    published: boolean;
    createdAt: Date;
    user: { id: string; name: string | null; avatarUrl: string | null };
  };
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-stone-800 px-4 py-3 hover:border-stone-700 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar
          src={adventure.user.avatarUrl}
          name={adventure.user.name}
          size={24}
          className="shrink-0 border border-stone-700"
        />
        <div className="min-w-0">
          <Link
            href={`/adventures/${adventure.id}`}
            className="font-mono text-sm text-stone-200 hover:text-amber-500 transition-colors truncate block"
          >
            {adventure.title}
          </Link>
          <p className="font-mono text-xs text-stone-600 truncate">
            {adventure.location}, {adventure.country} · {adventure.category.replace(/_/g, " ")} ·{" "}
            <Link href={`/profile/${adventure.user.id}`} className="hover:text-stone-400">
              {adventure.user.name}
            </Link>{" "}
            · {timeAgo(new Date(adventure.createdAt))}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`font-mono text-xs ${adventure.published ? "text-emerald-600" : "text-stone-600"}`}
        >
          {adventure.published ? "live" : "pending"}
        </span>
        <PublishButton adventureId={adventure.id} published={adventure.published} />
      </div>
    </div>
  );
}
