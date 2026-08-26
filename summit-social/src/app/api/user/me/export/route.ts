import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/**
 * Data portability export (UK GDPR Art 20): everything Basecamper holds about
 * the caller, as a single JSON document. The encrypted BYOK key is never
 * exported — only whether one is stored.
 */
export const GET = withApi(
  { rateLimit: { name: "profileUpdate", prefix: "account-export" } },
  async ({ userId }) => {
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

    const [
      adventures,
      comments,
      votes,
      itineraries,
      bookmarks,
      collections,
      follows,
      notifications,
      messageFeedback,
    ] = await Promise.all([
      prisma.adventure.findMany({ where: { userId }, include: { tags: true } }),
      prisma.comment.findMany({ where: { userId } }),
      prisma.vote.findMany({ where: { userId } }),
      prisma.itinerary.findMany({ where: { userId }, include: { days: true } }),
      prisma.bookmark.findMany({ where: { userId } }),
      prisma.collection.findMany({ where: { userId }, include: { items: true } }),
      prisma.follow.findMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
      prisma.notification.findMany({ where: { userId } }),
      // AI answer feedback, including the conversation snapshot a thumbs-down
      // stores (it survives itinerary deletion, so it must be exported here).
      prisma.messageFeedback.findMany({
        where: { userId },
        select: {
          id: true,
          rating: true,
          comment: true,
          transcript: true,
          itineraryId: true,
          createdAt: true,
        },
      }),
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
      messageFeedback,
    };

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="basecamper-export.json"',
      },
    });
  },
);
