import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const POST = withApi(
  { rateLimit: { name: "notificationsMutate", prefix: "notifications:mutate" } },
  async ({ userId }) => {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  },
);
