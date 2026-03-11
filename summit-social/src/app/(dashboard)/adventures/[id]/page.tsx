import { CommentForm } from "@/components/adventures/comment-form";
import { ShareButtons } from "@/components/adventures/share-buttons";
import { VoteButton } from "@/components/adventures/vote-button";
import { MapView } from "@/components/itinerary/map-view";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import { formatPrice, monthName, pluralise, timeAgo } from "@/lib/utils";
import type { AdventureDetail } from "@/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!adventure) return {};
  return {
    title: `${adventure.title} | SummitSocial`,
    description: adventure.description.slice(0, 155),
  };
}

export default async function AdventureDetailPage({ params }: Props) {
  const { id } = await params;

  const [session, adventure] = await Promise.all([
    getServerSession(authOptions),
    prisma.adventure.findUnique({
      where: { id, published: true },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, bio: true, instagramUrl: true } },
        tags: true,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            },
          },
        },
        votes: { select: { userId: true } },
      },
    }) as Promise<AdventureDetail | null>,
  ]);

  if (!adventure) notFound();

  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);
  const hasVoted = session?.user?.id
    ? adventure.votes.some((v) => v.userId === session.user.id)
    : false;

  const markers =
    adventure.latitude && adventure.longitude
      ? [{ lat: adventure.latitude, lng: adventure.longitude, label: adventure.location }]
      : [];

  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-600">
        <Link href="/adventures" className="hover:text-amber-500 transition-colors">
          Adventures
        </Link>
        <span>/</span>
        <span className="text-stone-400">{adventure.title}</span>
      </nav>

      {/* Hero image */}
      <div className="relative aspect-[21/9] overflow-hidden border border-stone-800">
        <Image
          src={adventure.coverImageUrl}
          alt={adventure.title}
          fill
          className="object-cover brightness-75"
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-amber-500">
            {adventure.category.replace(/_/g, " ")}
          </span>
          <h1 className="mt-1 font-display text-3xl uppercase tracking-widest text-stone-100 sm:text-5xl">
            {adventure.title}
          </h1>
          <p className="mt-2 font-mono text-sm text-stone-400">
            {adventure.location} · {adventure.country}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 py-4">
        <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
          <span className={difficulty?.color ?? "text-stone-400"}>{difficulty?.label}</span>
          <span className="text-stone-500">{pluralise(adventure.durationDays, "day")}</span>
          <span className="text-stone-500">{adventure.continent}</span>
          {adventure.estimatedCost && (
            <span className="text-stone-500">~{formatPrice(adventure.estimatedCost)} est.</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ShareButtons
            title={adventure.title}
            url={`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/adventures/${adventure.id}`}
          />
          <VoteButton
            adventureId={adventure.id}
            voteCount={adventure.voteCount}
            hasVoted={hasVoted}
            disabled={!session?.user?.id}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
              Overview
            </h2>
            <p className="text-sm leading-relaxed text-stone-400 whitespace-pre-line">
              {adventure.description}
            </p>
          </section>

          {/* Highlights */}
          {adventure.highlights.length > 0 && (
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Highlights
              </h2>
              <ul className="space-y-2">
                {adventure.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-sm text-stone-400">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-amber-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Map */}
          {markers.length > 0 && (
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Location
              </h2>
              <MapView markers={markers} className="h-[280px]" />
            </section>
          )}

          {/* Comments */}
          <section>
            <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
              {pluralise(adventure.comments.length, "Comment")}
            </h2>
            {session?.user?.id ? (
              <div className="mb-6">
                <CommentForm adventureId={adventure.id} />
              </div>
            ) : (
              <p className="mb-6 font-mono text-xs text-stone-600">
                <Link href="/login" className="text-amber-500 hover:text-amber-400">
                  Sign in
                </Link>{" "}
                to leave a comment.
              </p>
            )}
            {adventure.comments.length === 0 ? (
              <p className="text-sm text-stone-600">
                No comments yet. Be the first to share your experience.
              </p>
            ) : (
              <div className="space-y-6">
                {adventure.comments.map((comment) => (
                  <div key={comment.id}>
                    <div className="flex items-start gap-3">
                      {comment.user.avatarUrl && (
                        <Image
                          src={comment.user.avatarUrl}
                          alt={comment.user.name ?? ""}
                          width={28}
                          height={28}
                          className="shrink-0 border border-stone-700"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <Link
                            href={`/profile/${comment.user.id}`}
                            className="font-mono text-xs text-stone-300 hover:text-amber-500 transition-colors"
                          >
                            {comment.user.name}
                          </Link>
                          <span className="font-mono text-xs text-stone-700">
                            {timeAgo(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-stone-400">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-10 mt-4 space-y-4 border-l border-stone-800 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-3">
                            {reply.user.avatarUrl && (
                              <Image
                                src={reply.user.avatarUrl}
                                alt={reply.user.name ?? ""}
                                width={22}
                                height={22}
                                className="shrink-0 border border-stone-700"
                              />
                            )}
                            <div>
                              <div className="flex items-baseline gap-2">
                                <Link
                                  href={`/profile/${reply.user.id}`}
                                  className="font-mono text-xs text-stone-300 hover:text-amber-500 transition-colors"
                                >
                                  {reply.user.name}
                                </Link>
                                <span className="font-mono text-xs text-stone-700">
                                  {timeAgo(new Date(reply.createdAt))}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-relaxed text-stone-400">
                                {reply.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Gear */}
          {adventure.gear.length > 0 && (
            <div className="border border-stone-800 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Gear List
              </h3>
              <ul className="space-y-2">
                {adventure.gear.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-mono text-xs text-stone-400"
                  >
                    <span className="h-px w-3 bg-stone-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Best months */}
          {adventure.bestMonths.length > 0 && (
            <div className="border border-stone-800 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Best Months
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {MONTH_NAMES.map((name, i) => {
                  const active = adventure.bestMonths.includes(i + 1);
                  return (
                    <span
                      key={name}
                      className={`font-mono text-xs px-2 py-1 ${
                        active
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          : "text-stone-700 border border-stone-900"
                      }`}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {adventure.tags.length > 0 && (
            <div className="border border-stone-800 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {adventure.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="border border-stone-800 px-2 py-0.5 font-mono text-xs text-stone-500"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <div className="border border-stone-800 p-5">
            <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
              Posted by
            </h3>
            <Link href={`/profile/${adventure.user.id}`} className="flex items-center gap-3 group">
              {adventure.user.avatarUrl && (
                <Image
                  src={adventure.user.avatarUrl}
                  alt={adventure.user.name ?? ""}
                  width={40}
                  height={40}
                  className="border border-stone-700"
                />
              )}
              <div>
                <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors">
                  {adventure.user.name}
                </p>
                {adventure.user.bio && (
                  <p className="mt-0.5 text-xs text-stone-600 line-clamp-2">{adventure.user.bio}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Album gallery */}
          {adventure.albumUrl && (
            <div className="border border-stone-800 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Photo Album
              </h3>
              <a
                href={adventure.albumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current stroke-2 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                View photos on{" "}
                {adventure.albumPlatform
                  ? adventure.albumPlatform
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())
                  : "external site"}
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3 fill-none stroke-current stroke-2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Plan this trip CTA */}
          <div className="border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="font-display text-xs uppercase tracking-[0.35em] text-amber-500 mb-2">
              Plan This Trip
            </h3>
            <p className="text-xs leading-relaxed text-stone-500 mb-4">
              Use the AI Trip Planner to build a day-by-day itinerary inspired by this adventure.
            </p>
            <Link
              href={`/itinerary?prompt=${encodeURIComponent(`Plan a trip inspired by "${adventure.title}" in ${adventure.location}, ${adventure.country}. Duration: ${adventure.durationDays} days, difficulty: ${adventure.difficulty.toLowerCase()}.`)}`}
              className="block w-full border border-amber-500 bg-amber-500 py-2 text-center font-display text-xs uppercase tracking-widest text-stone-950 transition-colors hover:bg-amber-400"
            >
              Open Planner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
