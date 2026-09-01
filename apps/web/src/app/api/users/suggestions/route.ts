import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ request, userId }) => {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? undefined;

  // Get IDs of users already followed
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = new Set([userId, ...following.map((f) => f.followingId)]);

  // Find active users in same category (most votes)
  const suggestions = await prisma.user.findMany({
    where: {
      id: { notIn: [...followingIds] },
      adventures: {
        some: {
          published: true,
          ...(category ? { category: category as never } : {}),
        },
      },
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      _count: { select: { adventures: { where: { published: true } } } },
    },
    orderBy: { adventures: { _count: "desc" } },
    take: 6,
  });

  return NextResponse.json(suggestions);
});
