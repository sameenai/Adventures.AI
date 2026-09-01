import { BookmarkButton } from "@/components/adventures/bookmark-button";
import { CommentForm } from "@/components/adventures/comment-form";
import { CommentSection } from "@/components/adventures/comment-section";
import { MarkDoneButton } from "@/components/adventures/mark-done-button";
import { ShareButtons } from "@/components/adventures/share-buttons";
import { ViewCounter } from "@/components/adventures/view-counter";
import { VoteButton } from "@/components/adventures/vote-button";
import { MapView } from "@/components/itinerary/map-view";
import { Avatar } from "@/components/ui/avatar";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { DIFFICULTY_MAP } from "@/lib/difficulty-map";
import {
  formatDepartureLabel,
  nextBestDeparture,
  operatorBookingUrl,
  partnerLinks,
} from "@/lib/partners/deep-links";
import { formatPrice, pluralise } from "@/lib/utils";
import type { AdventureDetail } from "@/types";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { title: true, description: true, coverImageUrl: true, location: true, country: true },
  });
  if (!adventure) return {};

  const title = `${adventure.title} | Basecamper`;
  const description = adventure.description.slice(0, 155);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: adventure.coverImageUrl, width: 1200, height: 630, alt: adventure.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [adventure.coverImageUrl],
    },
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
            _count: { select: { reactions: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                _count: { select: { reactions: true } },
              },
            },
          },
        },
        votes: { select: { userId: true } },
        operator: true,
      },
    }) as Promise<AdventureDetail | null>,
  ]);

  if (!adventure) notFound();

  const difficulty = DIFFICULTY_MAP.get(adventure.difficulty);
  const hasVoted = session?.user?.id
    ? adventure.votes.some((v) => v.userId === session.user.id)
    : false;

  let reactedCommentIds: string[] = [];
  if (session?.user?.id) {
    const allCommentIds = [
      ...adventure.comments.map((c) => c.id),
      ...adventure.comments.flatMap((c) => c.replies?.map((r) => r.id) ?? []),
    ];
    const reactions = await prisma.commentReaction.findMany({
      where: { userId: session.user.id, commentId: { in: allCommentIds } },
      select: { commentId: true },
    });
    reactedCommentIds = reactions.map((r) => r.commentId);
  }

  const commentsWithReactions = adventure.comments.map((c) => ({
    ...c,
    viewerReacted: reactedCommentIds.includes(c.id),
    replies: c.replies?.map((r) => ({
      ...r,
      viewerReacted: reactedCommentIds.includes(r.id),
    })),
  }));

  const tagNames = adventure.tags.map((t) => t.name);

  const [isBookmarkedResult, completedResult, relatedBySameContinent, relatedByCategory] =
    await Promise.all([
      session?.user?.id
        ? prisma.bookmark.findUnique({
            where: { userId_adventureId: { userId: session.user.id, adventureId: id } },
            select: { id: true },
          })
        : Promise.resolve(null),
      session?.user?.id
        ? prisma.tripEvent.findFirst({
            where: { userId: session.user.id, adventureId: id, source: "MARKED_DONE" },
            select: { id: true },
          })
        : Promise.resolve(null),
      prisma.adventure.findMany({
        where: {
          published: true,
          category: adventure.category,
          continent: adventure.continent,
          id: { not: id },
        },
        orderBy: { voteCount: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          coverImageUrl: true,
          location: true,
          difficulty: true,
          durationDays: true,
          tags: { select: { name: true } },
        },
      }),
      prisma.adventure.findMany({
        where: { published: true, category: adventure.category, id: { not: id } },
        orderBy: { voteCount: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          coverImageUrl: true,
          location: true,
          difficulty: true,
          durationDays: true,
          tags: { select: { name: true } },
        },
      }),
    ]);

  const seenIds = new Set<string>([id]);
  const related: typeof relatedByCategory = [];

  for (const a of relatedBySameContinent) {
    if (seenIds.has(a.id)) continue;
    seenIds.add(a.id);
    related.push(a);
    if (related.length === 4) break;
  }

  if (related.length < 4 && tagNames.length > 0) {
    const withOverlap = relatedByCategory
      .filter((a) => !seenIds.has(a.id))
      .map((a) => ({
        ...a,
        overlap: "tags" in a ? a.tags.filter((t) => tagNames.includes(t.name)).length : 0,
      }))
      .sort((a, b) => b.overlap - a.overlap);

    for (const a of withOverlap) {
      if (seenIds.has(a.id)) continue;
      seenIds.add(a.id);
      related.push(a);
      if (related.length === 4) break;
    }
  }

  if (related.length < 4) {
    for (const a of relatedByCategory) {
      if (seenIds.has(a.id)) continue;
      seenIds.add(a.id);
      related.push(a);
      if (related.length === 4) break;
    }
  }

  const relatedAdventures = related.slice(0, 4);
  const isBookmarked = !!isBookmarkedResult;
  const hasCompleted = !!completedResult;

  const totalCommentCount =
    adventure.comments.length +
    adventure.comments.reduce((sum, c) => sum + (c.replies?.length ?? 0), 0);

  const markers =
    adventure.latitude && adventure.longitude
      ? [{ lat: adventure.latitude, lng: adventure.longitude, label: adventure.location }]
      : [];

  // Partner deep links, prefilled for the next best-season departure window.
  const departure = nextBestDeparture(adventure.bestMonths);
  const departureLabel = formatDepartureLabel(departure);
  const partnerRail = partnerLinks(
    {
      location: adventure.location,
      country: adventure.country,
      bestMonths: adventure.bestMonths,
      durationDays: adventure.durationDays,
    },
    { departure },
  );
  const operatorTemplateUrl = adventure.operator?.bookingUrlTemplate
    ? operatorBookingUrl(adventure.operator.bookingUrlTemplate, departure, 1)
    : null;
  const operatorDirectUrl =
    operatorTemplateUrl ??
    (adventure.operator?.website
      ? operatorBookingUrl(adventure.operator.website, departure, 1)
      : null);

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

  const pageUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/adventures/${adventure.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: adventure.title,
    description: adventure.description.slice(0, 500),
    image: adventure.coverImageUrl,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: adventure.location,
      addressCountry: adventure.country,
    },
    ...(adventure.latitude &&
      adventure.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: adventure.latitude,
          longitude: adventure.longitude,
        },
      }),
    ...(adventure.estimatedCost && {
      offers: {
        "@type": "Offer",
        price: adventure.estimatedCost,
        priceCurrency: "USD",
      },
    }),
    touristType: adventure.category.replace(/_/g, " "),
  };

  // Gallery: cover + up to 4 extras
  const allPhotos = [adventure.coverImageUrl, ...adventure.galleryImages].slice(0, 5);

  // Cover-photo provenance (CC imagery requires the credit; shape guarded —
  // the column is Json and older rows may carry nothing).
  const rawAttribution = adventure.imageAttribution as {
    artist?: unknown;
    license?: unknown;
    sourceUrl?: unknown;
  } | null;
  const credit =
    rawAttribution && typeof rawAttribution.artist === "string" && rawAttribution.artist
      ? {
          artist: rawAttribution.artist,
          license: typeof rawAttribution.license === "string" ? rawAttribution.license : "",
          sourceUrl:
            typeof rawAttribution.sourceUrl === "string" &&
            rawAttribution.sourceUrl.startsWith("https://")
              ? rawAttribution.sourceUrl
              : "",
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static server-generated JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-stone-600">
          <Link href="/adventures" className="hover:text-amber-500 transition-colors">
            Adventures
          </Link>
          <span>/</span>
          <span className="text-stone-400">{adventure.title}</span>
        </nav>

        {/* ── PHOTO GALLERY ── */}
        <div className="mb-6">
          {allPhotos.length === 1 ? (
            /* Single image — wide hero */
            <div className="relative aspect-[21/9] overflow-hidden border border-stone-800">
              <Image
                src={allPhotos[0]}
                alt={adventure.title}
                fill
                className="object-cover brightness-75"
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          ) : (
            /* Cover + up to 4 gallery thumbs */
            <div className="grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden h-[220px] sm:grid-cols-4 sm:h-[460px]">
              {/* Large cover — spans 2 cols × 2 rows */}
              <div className="relative col-span-2 row-span-2 overflow-hidden border border-stone-800">
                <Image
                  src={allPhotos[0]}
                  alt={adventure.title}
                  fill
                  className="object-cover brightness-80 hover:brightness-90 transition-all duration-300"
                  priority
                  sizes="(max-width: 1024px) 50vw, 512px"
                />
              </div>
              {/* Up to 4 smaller thumbs */}
              {allPhotos.slice(1, 5).map((url, i) => (
                <div key={url} className="relative overflow-hidden border border-stone-800">
                  <Image
                    src={url}
                    alt={`${adventure.title} — photo ${i + 2}`}
                    fill
                    className="object-cover brightness-75 hover:brightness-90 transition-all duration-300"
                    sizes="(max-width: 1024px) 25vw, 256px"
                  />
                </div>
              ))}
            </div>
          )}
          {credit && (
            <p className="mt-1 text-right font-mono text-[10px] text-stone-600">
              Photo:{" "}
              {credit.sourceUrl ? (
                <a
                  href={credit.sourceUrl}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="underline decoration-stone-700 underline-offset-2 hover:text-stone-400 transition-colors"
                >
                  {credit.artist}
                </a>
              ) : (
                credit.artist
              )}
              {credit.license ? ` · ${credit.license}` : ""}
            </p>
          )}
        </div>

        {/* Title block */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-display text-xs uppercase tracking-[0.35em] text-amber-500">
              {adventure.category.replace(/_/g, " ")}
            </span>
            {adventure.id.startsWith("seed-") && (
              <span className="border border-stone-600 px-2 py-0.5 font-display text-xs uppercase tracking-widest text-stone-500">
                Demo
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl uppercase tracking-widest text-stone-100 sm:text-4xl">
            {adventure.title}
          </h1>
          <p className="mt-1 font-mono text-sm text-stone-400">
            {adventure.location} · {adventure.country}
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-col gap-3 border-b border-stone-800 py-4 mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <span className={difficulty?.color ?? "text-stone-400"}>{difficulty?.label}</span>
            <span className="text-stone-500">{pluralise(adventure.durationDays, "day")}</span>
            <span className="text-stone-500">{adventure.continent}</span>
            {adventure.estimatedCost && (
              <span className="text-stone-500">~{formatPrice(adventure.estimatedCost)} est.</span>
            )}
            <ViewCounter
              adventureId={adventure.id}
              isAuthor={session?.user?.id === adventure.user.id}
            />
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.id === adventure.user.id && (
              <Link
                href={`/adventures/${adventure.id}/edit`}
                className="border border-stone-700 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-stone-400 hover:text-stone-200 transition-colors"
              >
                Edit
              </Link>
            )}
            <BookmarkButton
              adventureId={adventure.id}
              isBookmarked={isBookmarked}
              disabled={!session?.user?.id}
            />
            <MarkDoneButton
              adventureId={adventure.id}
              initialCompleted={hasCompleted}
              isAuthenticated={Boolean(session?.user?.id)}
            />
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Overview
              </h2>
              <p className="text-sm leading-relaxed text-stone-400 whitespace-pre-line">
                {adventure.description}
              </p>
            </section>

            {/* ── BOOK THIS TRIP ── */}
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
                Book This Trip
              </h2>

              {/* Operator — the outfit that actually runs this trip */}
              {adventure.operator && (
                <div className="mb-6 border border-amber-500/30 bg-amber-500/5 p-5">
                  <p className="font-display text-xs uppercase tracking-[0.35em] text-amber-500 mb-1">
                    Run by
                  </p>
                  <p className="font-display text-xl uppercase tracking-widest text-stone-100">
                    {adventure.operator.name}
                  </p>
                  {adventure.operator.description && (
                    <p className="mt-2 text-xs leading-relaxed text-stone-500">
                      {adventure.operator.description}
                    </p>
                  )}
                  {operatorDirectUrl && (
                    <>
                      <a
                        href={operatorDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="mt-4 inline-block border border-amber-500 bg-amber-500 px-5 py-2 font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
                      >
                        Book Direct
                      </a>
                      <p className="mt-2 font-mono text-xs text-stone-600">
                        {operatorTemplateUrl
                          ? `Prefilled for ${departureLabel} · 1 traveller — opens the operator's site in a new tab`
                          : "Opens the operator's site in a new tab"}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Partner rail — pre-filled searches, honestly labelled */}
              <h3 className="font-display text-xs uppercase tracking-widest text-stone-400 mb-1">
                Plan Your Dates
              </h3>
              <p className="font-mono text-xs text-stone-600 mb-4">
                Prefilled for {departureLabel}
                {adventure.bestMonths.length > 0
                  ? " — the next best-season window"
                  : " — about two months out"}
                . Search on partner sites — opens in a new tab.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {partnerRail.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="group border border-stone-800 p-4 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-xs uppercase tracking-widest text-stone-300 group-hover:text-amber-500 transition-colors">
                        {link.label}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-none stroke-stone-600 group-hover:stroke-amber-500 stroke-2 transition-colors"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </div>
                    <p className="font-mono text-xs text-stone-600 group-hover:text-stone-500">
                      {link.note}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            {/* Map */}
            {(markers.length > 0 || adventure.gpxTrackUrl) && (
              <section>
                <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                  {adventure.gpxTrackUrl ? "Route" : "Location"}
                </h2>
                <MapView
                  markers={markers}
                  gpxTrackUrl={adventure.gpxTrackUrl ?? undefined}
                  className="h-[280px]"
                />
              </section>
            )}

            {/* Comments */}
            <section>
              <h2 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-4">
                {pluralise(totalCommentCount, "Comment")}
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
              <CommentSection
                adventureId={adventure.id}
                comments={commentsWithReactions}
                currentUserId={session?.user?.id ?? null}
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan CTA */}
            <div className="border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-amber-500 mb-2">
                Customise This Trip
              </h3>
              <p className="text-xs leading-relaxed text-stone-500 mb-4">
                Adjust dates, budget, and pace. The AI planner builds a personalised day-by-day
                itinerary you can tweak in chat.
              </p>
              <Link
                href={`/itinerary?prompt=${encodeURIComponent(`Plan a ${adventure.durationDays}-day trip for "${adventure.title}" in ${adventure.location}, ${adventure.country}. Difficulty: ${adventure.difficulty.toLowerCase()}. Key highlights: ${adventure.highlights.slice(0, 5).join(", ")}.`)}`}
                className="block w-full border border-amber-500 bg-amber-500 py-2 text-center font-display text-xs uppercase tracking-widest text-ink transition-colors hover:bg-amber-400"
              >
                Plan with AI
              </Link>
            </div>

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
                    <Link
                      key={tag.id}
                      href={`/adventures?tag=${encodeURIComponent(tag.name)}`}
                      className="border border-stone-800 px-2 py-0.5 font-mono text-xs text-stone-500 hover:border-amber-500/50 hover:text-amber-500 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author */}
            <div className="border border-stone-800 p-5">
              <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                Posted by
              </h3>
              <Link
                href={`/profile/${adventure.user.id}`}
                className="flex items-center gap-3 group"
              >
                <Avatar
                  src={adventure.user.avatarUrl}
                  name={adventure.user.name}
                  size={40}
                  className="border border-stone-700"
                />
                <div>
                  <p className="font-mono text-sm text-stone-200 group-hover:text-amber-500 transition-colors">
                    {adventure.user.name}
                  </p>
                  {adventure.user.bio && (
                    <p className="mt-0.5 text-xs text-stone-600 line-clamp-2">
                      {adventure.user.bio}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            {/* Photo album link */}
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

            {/* Related adventures */}
            {relatedAdventures.length > 0 && (
              <div className="border border-stone-800 p-5">
                <h3 className="font-display text-xs uppercase tracking-[0.35em] text-stone-500 mb-3">
                  More {adventure.category.replace(/_/g, " ")}
                </h3>
                <ul className="space-y-3">
                  {relatedAdventures.map((rel) => {
                    const relDifficulty = DIFFICULTY_MAP.get(rel.difficulty);
                    return (
                      <li key={rel.id}>
                        <Link
                          href={`/adventures/${rel.id}`}
                          className="flex items-start gap-3 group"
                        >
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden border border-stone-800">
                            <Image
                              src={rel.coverImageUrl}
                              alt={rel.title}
                              fill
                              className="object-cover brightness-75 group-hover:brightness-90 transition-all"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-stone-200 group-hover:text-amber-500 transition-colors line-clamp-2 leading-relaxed">
                              {rel.title}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-stone-600">
                              {rel.location} ·{" "}
                              <span className={relDifficulty?.color}>{relDifficulty?.label}</span>
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
