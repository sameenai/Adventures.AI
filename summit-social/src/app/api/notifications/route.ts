import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ userId }) => {
  // unreadCount must be a real DB count — deriving it from the 50 fetched rows
  // undercounts as soon as unread notifications fall outside the page.
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
});
