import { track } from "@/lib/analytics/track";
import { withApi } from "@/lib/api/handler";
import { PLANS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const POST = withApi({ rateLimit: { name: "bookmark" } }, async ({ userId, params }) => {
  const adventureId = params.id;

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId, published: true },
    select: { id: true },
  });
  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Enforce bookmark limit for free users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const limit = user?.plan === "PRO" ? PLANS.PRO.bookmarkLimit : PLANS.FREE.bookmarkLimit;
  if (Number.isFinite(limit)) {
    const existing = await prisma.bookmark.count({ where: { userId } });
    if (existing >= limit) {
      return NextResponse.json(
        { error: "Bookmark limit reached", code: "UPGRADE_REQUIRED", limit },
        { status: 402 },
      );
    }
  }

  track("bookmark_added", { userId, props: { adventureId } });
  await prisma.bookmark.upsert({
    where: { userId_adventureId: { userId, adventureId } },
    create: { userId, adventureId },
    update: {},
  });

  return NextResponse.json({ bookmarked: true });
});

export const DELETE = withApi({ rateLimit: { name: "bookmark" } }, async ({ userId, params }) => {
  await prisma.bookmark.deleteMany({
    where: { userId, adventureId: params.id },
  });

  return NextResponse.json({ bookmarked: false });
});
