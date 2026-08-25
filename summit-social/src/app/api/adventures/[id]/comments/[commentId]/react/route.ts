import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const POST = withApi(
  { rateLimit: { name: "commentReact", prefix: "comment-react" } },
  async ({ userId, params }) => {
    const { commentId } = params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const existing = await prisma.commentReaction.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentReaction.delete({ where: { id: existing.id } });
      const count = await prisma.commentReaction.count({ where: { commentId } });
      return NextResponse.json({ reacted: false, count });
    }

    await prisma.commentReaction.create({ data: { userId, commentId } });
    const count = await prisma.commentReaction.count({ where: { commentId } });
    return NextResponse.json({ reacted: true, count }, { status: 201 });
  },
);
