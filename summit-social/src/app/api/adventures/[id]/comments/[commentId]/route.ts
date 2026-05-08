import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
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
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { commentId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return new NextResponse(null, { status: 204 });
}
