import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          adventure: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
              tags: true,
              _count: { select: { comments: true } },
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json(collection);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `collection:create:${session.user.id}`,
    RATE_LIMITS.collectionCreate.limit,
    RATE_LIMITS.collectionCreate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.collection.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
