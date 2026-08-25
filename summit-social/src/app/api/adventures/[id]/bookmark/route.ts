import { track } from "@/lib/analytics/track";
import { authOptions } from "@/lib/auth/config";
import { PLANS, RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `bookmark:${session.user.id}`,
    RATE_LIMITS.bookmark.limit,
    RATE_LIMITS.bookmark.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId, published: true },
    select: { id: true },
  });
  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Enforce bookmark limit for free users
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const limit = user?.plan === "PRO" ? PLANS.PRO.bookmarkLimit : PLANS.FREE.bookmarkLimit;
  if (Number.isFinite(limit)) {
    const existing = await prisma.bookmark.count({ where: { userId: session.user.id } });
    if (existing >= limit) {
      return NextResponse.json(
        { error: "Bookmark limit reached", code: "UPGRADE_REQUIRED", limit },
        { status: 402 },
      );
    }
  }

  track("bookmark_added", { userId: session.user.id, props: { adventureId } });
  await prisma.bookmark.upsert({
    where: { userId_adventureId: { userId: session.user.id, adventureId } },
    create: { userId: session.user.id, adventureId },
    update: {},
  });

  return NextResponse.json({ bookmarked: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `bookmark:${session.user.id}`,
    RATE_LIMITS.bookmark.limit,
    RATE_LIMITS.bookmark.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  await prisma.bookmark.deleteMany({
    where: { userId: session.user.id, adventureId },
  });

  return NextResponse.json({ bookmarked: false });
}
