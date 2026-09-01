import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { createCommentSchema } from "@/lib/validators/comment";
import { NextResponse } from "next/server";

export const POST = withApi(
  { rateLimit: { name: "commentCreate", prefix: "comment" } },
  async ({ request, userId, params }) => {
    const adventureId = params.id;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
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
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const comment = await prisma.comment.create({
      data: {
        body: parsed.data.body,
        parentId: parsed.data.parentId,
        userId,
        adventureId,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify adventure owner (unless commenter is the owner)
    if (adventure.userId !== userId) {
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
        .filter((id) => id !== userId && id !== adventure.userId);
      if (notifyIds.length > 0) {
        await prisma.notification.createMany({
          data: notifyIds.map((mentionedId) => ({
            userId: mentionedId,
            type: "NEW_COMMENT" as const,
            message: `${comment.user.name ?? "Someone"} mentioned you in a comment`,
            linkUrl: `/adventures/${adventureId}`,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  },
);
