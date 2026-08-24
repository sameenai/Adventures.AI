import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cap the publish notification fan-out at the author's first 500 followers. */
const PUBLISH_NOTIFY_FOLLOWER_CAP = 500;

// POST /api/adventures/[id]/publish — toggle published for the owner
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `adventure:mutate:${session.user.id}`,
    RATE_LIMITS.adventureMutate.limit,
    RATE_LIMITS.adventureMutate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { userId: true, published: true, title: true, user: { select: { name: true } } },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (adventure.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const updated = await prisma.adventure.update({
    where: { id },
    data: { published: !adventure.published },
    select: { id: true, published: true },
  });

  // Fan out ADVENTURE_PUBLISHED to the author's followers — only on the
  // unpublished → published transition, never on unpublish, and capped at
  // the first 500 followers.
  if (!adventure.published && updated.published) {
    const followers = await prisma.follow.findMany({
      where: { followingId: session.user.id },
      select: { followerId: true },
      orderBy: { createdAt: "asc" },
      take: PUBLISH_NOTIFY_FOLLOWER_CAP,
    });

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          type: "ADVENTURE_PUBLISHED" as const,
          message: `${adventure.user?.name ?? "Someone"} published "${adventure.title}"`,
          linkUrl: `/adventures/${id}`,
        })),
      });
    }
  }

  return NextResponse.json(updated);
}
