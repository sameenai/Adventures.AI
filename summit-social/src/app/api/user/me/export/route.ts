import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Data portability export (UK GDPR Art 20): everything Basecamper holds about
 * the caller, as a single JSON document. The encrypted BYOK key is never
 * exported — only whether one is stored.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `account-export:${session.user.id}`,
    RATE_LIMITS.profileUpdate.limit,
    RATE_LIMITS.profileUpdate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      bio: true,
      instagramUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      plan: true,
      openAiApiKey: true,
      marketingConsent: true,
      marketingConsentAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const [adventures, comments, votes, itineraries, bookmarks, collections, follows, notifications] =
    await Promise.all([
      prisma.adventure.findMany({ where: { userId }, include: { tags: true } }),
      prisma.comment.findMany({ where: { userId } }),
      prisma.vote.findMany({ where: { userId } }),
      prisma.itinerary.findMany({ where: { userId }, include: { days: true } }),
      prisma.bookmark.findMany({ where: { userId } }),
      prisma.collection.findMany({ where: { userId }, include: { items: true } }),
      prisma.follow.findMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
      prisma.notification.findMany({ where: { userId } }),
    ]);

  const { openAiApiKey, ...profile } = user;
  const bundle = {
    exportedAt: new Date().toISOString(),
    format: "basecamper-export/v1",
    profile: { ...profile, hasStoredOpenAiKey: Boolean(openAiApiKey) },
    adventures,
    comments,
    votes,
    itineraries,
    bookmarks,
    collections,
    follows,
    notifications,
  };

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="basecamper-export.json"',
    },
  });
}
