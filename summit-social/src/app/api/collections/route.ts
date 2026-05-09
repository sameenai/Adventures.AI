import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 1,
        include: {
          adventure: { select: { coverImageUrl: true } },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  return NextResponse.json(collections);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `collection-create:${session.user.id}`,
    RATE_LIMITS.collectionCreate.limit,
    RATE_LIMITS.collectionCreate.windowSeconds,
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

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name || name.length < 1 || name.length > 100) {
    return NextResponse.json(
      { error: "Name must be 1–100 characters", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.create({
    data: { name, userId: session.user.id },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json(collection, { status: 201 });
}
