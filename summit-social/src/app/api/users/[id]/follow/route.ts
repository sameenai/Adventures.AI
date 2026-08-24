import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: followingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `follow:${session.user.id}`,
    RATE_LIMITS.follow.limit,
    RATE_LIMITS.follow.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  if (session.user.id === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself", code: "INVALID" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId } },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: session.user.id, followingId } },
    create: { followerId: session.user.id, followingId },
    update: {},
  });

  // Only notify on new follows (not re-follows)
  if (!existing) {
    const follower = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "NEW_FOLLOWER",
        message: `${follower?.name ?? "Someone"} started following you`,
        linkUrl: `/profile/${session.user.id}`,
      },
    });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: followingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `follow:${session.user.id}`,
    RATE_LIMITS.follow.limit,
    RATE_LIMITS.follow.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, followingId },
  });

  return NextResponse.json({ following: false });
}
