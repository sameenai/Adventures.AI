import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const PATCH = withApi({}, async ({ request, userId, params }) => {
  const { commentId } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (comment.userId !== userId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const rawBody = typeof body?.body === "string" ? body.body.trim() : "";

  if (!rawBody || rawBody.length > 10000) {
    return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body: rawBody },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json(updated);
});

export const DELETE = withApi({}, async ({ userId, params }) => {
  const { commentId } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (comment.userId !== userId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return new NextResponse(null, { status: 204 });
});
