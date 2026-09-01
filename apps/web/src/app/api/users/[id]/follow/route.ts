import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const POST = withApi({ rateLimit: { name: "follow" } }, async ({ userId, params }) => {
  const followingId = params.id;

  if (userId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself", code: "INVALID" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId } },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: userId, followingId } },
    create: { followerId: userId, followingId },
    update: {},
  });

  // Only notify on new follows (not re-follows)
  if (!existing) {
    const follower = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "NEW_FOLLOWER",
        message: `${follower?.name ?? "Someone"} started following you`,
        linkUrl: `/profile/${userId}`,
      },
    });
  }

  return NextResponse.json({ following: true });
});

export const DELETE = withApi({ rateLimit: { name: "follow" } }, async ({ userId, params }) => {
  await prisma.follow.deleteMany({
    where: { followerId: userId, followingId: params.id },
  });

  return NextResponse.json({ following: false });
});
