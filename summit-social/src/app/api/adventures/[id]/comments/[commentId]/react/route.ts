import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.commentReaction.findUnique({
    where: { userId_commentId: { userId: session.user.id, commentId } },
  });

  if (existing) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
    const count = await prisma.commentReaction.count({ where: { commentId } });
    return NextResponse.json({ reacted: false, count });
  }

  await prisma.commentReaction.create({ data: { userId: session.user.id, commentId } });
  const count = await prisma.commentReaction.count({ where: { commentId } });
  return NextResponse.json({ reacted: true, count }, { status: 201 });
}
