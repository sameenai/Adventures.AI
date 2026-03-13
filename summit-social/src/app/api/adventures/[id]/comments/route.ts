import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { createCommentSchema } from "@/lib/validators/comment";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const allowed = await rateLimit(
    `comment:${session.user.id}`,
    RATE_LIMITS.commentCreate.limit,
    RATE_LIMITS.commentCreate.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true, userId: true, title: true },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      parentId: parsed.data.parentId,
      userId: session.user.id,
      adventureId,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Notify adventure owner (unless commenter is the owner)
  if (adventure.userId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: adventure.userId,
        type: "NEW_COMMENT",
        message: `${comment.user.name ?? "Someone"} commented on your adventure "${adventure.title}"`,
        linkUrl: `/adventures/${adventureId}`,
      },
    });
  }

  // Notify users @mentioned in the comment body
  const mentions = parsed.data.body.match(/@(\w+)/g);
  if (mentions) {
    const usernames = [...new Set(mentions.map((m) => m.slice(1)))];
    const mentionedUsers = await prisma.user.findMany({
      where: { name: { in: usernames } },
      select: { id: true },
    });
    const notifyIds = mentionedUsers
      .map((u) => u.id)
      .filter((id) => id !== session.user.id && id !== adventure.userId);
    if (notifyIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyIds.map((userId) => ({
          userId,
          type: "NEW_COMMENT" as const,
          message: `${comment.user.name ?? "Someone"} mentioned you in a comment`,
          linkUrl: `/adventures/${adventureId}`,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
