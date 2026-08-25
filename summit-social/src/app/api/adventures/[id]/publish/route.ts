import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/** Cap the publish notification fan-out at the author's first 500 followers. */
const PUBLISH_NOTIFY_FOLLOWER_CAP = 500;

// POST /api/adventures/[id]/publish — toggle published for the owner
export const POST = withApi(
  { rateLimit: { name: "adventureMutate", prefix: "adventure:mutate" } },
  async ({ userId, params }) => {
    const { id } = params;

    const adventure = await prisma.adventure.findUnique({
      where: { id },
      select: { userId: true, published: true, title: true, user: { select: { name: true } } },
    });

    if (!adventure) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (adventure.userId !== userId) {
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
        where: { followingId: userId },
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
  },
);
