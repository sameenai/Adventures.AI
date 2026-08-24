import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { tripDueEmail } from "@/lib/email/templates";
import { unsubscribeToken } from "@/lib/email/unsubscribe";
import { getTasteProfile, topEntries } from "@/lib/personalization/taste-profile";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_HORIZON_DAYS = 45;
const RECS_PER_USER = 5;
const DIFFICULTY_ORDER = ["EASY", "MODERATE", "CHALLENGING", "EXTREME", "EXPEDITION_GRADE"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface CadenceStats {
  usersScanned: number;
  usersDue: number;
  recommendationsCreated: number;
  notificationsCreated: number;
  emailsSent: number;
}

/**
 * The founder-requested cadence engine, v1 (in-app channel):
 * "You're up for your quarterly/6-monthly trip — here's where to go next,
 * based on your saved favourites and what you've looked at."
 *
 * Nightly: find users whose next trip window (last TripEvent + cadenceMonths)
 * opens within 45 days, build seasonal candidates from their own signals plus
 * taste-profile matches, persist the top picks idempotently per window, and
 * notify once. Email delivery plugs into the same rows when a provider lands.
 */
export async function runCadenceScan(now = new Date()): Promise<CadenceStats> {
  const stats: CadenceStats = {
    usersScanned: 0,
    usersDue: 0,
    recommendationsCreated: 0,
    notificationsCreated: 0,
    emailsSent: 0,
  };

  // Users with any trip history anchor.
  const anchors = await prisma.tripEvent.groupBy({
    by: ["userId"],
    _max: { startedAt: true },
  });

  for (const anchor of anchors) {
    stats.usersScanned += 1;
    const lastTrip = anchor._max.startedAt;
    if (!lastTrip) continue;

    const profile = await prisma.travelerProfile.findUnique({
      where: { userId: anchor.userId },
    });
    const cadenceMonths = profile?.cadenceMonths ?? 6;

    const dueDate = new Date(lastTrip.getTime());
    dueDate.setUTCMonth(dueDate.getUTCMonth() + cadenceMonths);
    const horizon = new Date(now.getTime() + DUE_HORIZON_DAYS * DAY_MS);
    if (dueDate > horizon) continue; // not due yet
    stats.usersDue += 1;

    // The window this scan recommends for (stable per month → idempotent).
    const windowStart = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1));
    const targetMonth = windowStart.getUTCMonth() + 1;
    const monthsInWindow = [
      targetMonth === 1 ? 12 : targetMonth - 1,
      targetMonth,
      targetMonth === 12 ? 1 : targetMonth + 1,
    ];

    const existing = await prisma.cadenceRecommendation.count({
      where: { userId: anchor.userId, windowStart },
    });
    if (existing > 0) continue; // already recommended for this window

    const created = await buildRecommendations(
      anchor.userId,
      windowStart,
      monthsInWindow,
      profile?.maxDifficulty ?? null,
      profile?.budgetBandPence ?? null,
    );
    stats.recommendationsCreated += created;

    if (created > 0) {
      await prisma.notification.create({
        data: {
          userId: anchor.userId,
          type: "TRIP_DUE",
          message: `Your next trip window opens soon — ${created} adventures picked for you`,
          linkUrl: "/next-trip",
        },
      });
      stats.notificationsCreated += 1;

      const sent = await sendTripDueEmail(anchor.userId, windowStart, targetMonth);
      if (sent) stats.emailsSent += 1;
    }
  }

  return stats;
}

/**
 * The email channel: only for users who opted in (marketingConsent), with a
 * one-tap unsubscribe in every send. Recommendations flip PENDING→SENT only
 * when the provider accepted the message, so the CTR loop measures real sends.
 */
async function sendTripDueEmail(
  userId: string,
  windowStart: Date,
  targetMonth: number,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, marketingConsent: true },
  });
  if (!user?.marketingConsent) return false;

  const recs = await prisma.cadenceRecommendation.findMany({
    where: { userId, windowStart, status: "PENDING" },
    orderBy: { score: "desc" },
    include: {
      adventure: { select: { id: true, title: true, location: true, country: true } },
    },
  });
  if (recs.length === 0) return false;

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const content = tripDueEmail({
    name: user.name,
    monthLabel: MONTH_NAMES[targetMonth - 1] ?? "your next window",
    recommendations: recs.map((r) => ({
      title: r.adventure.title,
      location: r.adventure.location,
      country: r.adventure.country,
      url: `${base}/adventures/${r.adventure.id}`,
    })),
    nextTripUrl: `${base}/next-trip`,
    unsubscribeUrl: `${base}/api/email/unsubscribe?token=${unsubscribeToken(userId)}`,
  });

  const result = await sendEmail({
    to: user.email,
    userId,
    template: "trip-due",
    subject: content.subject,
    html: content.html,
    text: content.text,
    meta: { windowStart: windowStart.toISOString(), recommendations: recs.length },
  });

  if (result.status === "SENT") {
    await prisma.cadenceRecommendation.updateMany({
      where: { userId, windowStart, status: "PENDING" },
      data: { status: "SENT", sentAt: new Date() },
    });
    return true;
  }
  return false;
}

async function buildRecommendations(
  userId: string,
  windowStart: Date,
  monthsInWindow: number[],
  maxDifficulty: string | null,
  budgetBandPence: number | null,
): Promise<number> {
  const [bookmarks, votes, views, done, taste] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId }, select: { adventureId: true } }),
    prisma.vote.findMany({ where: { userId }, select: { adventureId: true } }),
    prisma.adventureView.findMany({ where: { userId }, select: { adventureId: true } }),
    prisma.tripEvent.findMany({
      where: { userId, adventureId: { not: null } },
      select: { adventureId: true },
    }),
    getTasteProfile(userId),
  ]);

  const bookmarked = new Set(bookmarks.map((b) => b.adventureId));
  const voted = new Set(votes.map((v) => v.adventureId));
  const viewed = new Set(views.map((v) => v.adventureId));
  const alreadyDone = new Set(done.map((t) => t.adventureId as string));

  const signalIds = [...new Set([...bookmarked, ...voted, ...viewed])].filter(
    (id) => !alreadyDone.has(id),
  );
  const topCategories = topEntries(taste.categories, 3);

  const difficultyCeiling = maxDifficulty
    ? DIFFICULTY_ORDER.slice(0, DIFFICULTY_ORDER.indexOf(maxDifficulty) + 1)
    : undefined;

  // Candidates: the user's own saved/engaged adventures in season, topped up
  // with taste-profile matches when their own list is thin.
  const candidates = await prisma.adventure.findMany({
    where: {
      published: true,
      bestMonths: { hasSome: monthsInWindow },
      id: { notIn: [...alreadyDone] },
      ...(difficultyCeiling ? { difficulty: { in: difficultyCeiling as never } } : {}),
      OR: [
        { id: { in: signalIds } },
        ...(topCategories.length > 0 ? [{ category: { in: topCategories as never } }] : []),
      ],
    },
    select: {
      id: true,
      category: true,
      estimatedCost: true,
      viewCount: true,
      voteCount: true,
      bestMonths: true,
    },
    take: 400,
  });

  const scored = candidates
    .map((adventure) => {
      const reasons: string[] = [];
      let score = 0;
      if (bookmarked.has(adventure.id)) {
        score += 3;
        reasons.push("bookmarked");
      }
      if (voted.has(adventure.id)) {
        score += 2;
        reasons.push("voted");
      }
      if (viewed.has(adventure.id)) {
        score += 1;
        reasons.push("viewed");
      }
      if (adventure.bestMonths.some((m) => monthsInWindow.includes(m))) {
        score += 2;
        reasons.push(`bestMonth:${monthsInWindow[1]}`);
      }
      if (topCategories.includes(adventure.category)) {
        score += 1;
        reasons.push(`matches:${adventure.category}`);
      }
      if (
        budgetBandPence &&
        adventure.estimatedCost !== null &&
        adventure.estimatedCost <= budgetBandPence
      ) {
        score += 1;
        reasons.push("budgetFit");
      }
      return { adventure, score, reasons };
    })
    .filter((c) => c.score > 2) // seasonal match alone is not a recommendation
    .sort((a, b) => b.score - a.score)
    .slice(0, RECS_PER_USER);

  if (scored.length === 0) return 0;

  await prisma.cadenceRecommendation.createMany({
    data: scored.map((c) => ({
      userId,
      adventureId: c.adventure.id,
      score: c.score,
      reasons: c.reasons,
      windowStart,
      status: "PENDING",
    })),
    skipDuplicates: true,
  });

  return scored.length;
}
