import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const allowed = await rateLimit(
    `vote:${session.user.id}`,
    RATE_LIMITS.vote.limit,
    RATE_LIMITS.vote.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMITED" }, { status: 429 });
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_adventureId: {
        userId: session.user.id,
        adventureId,
      },
    },
  });

  if (existingVote) {
    await prisma.$transaction([
      prisma.vote.delete({ where: { id: existingVote.id } }),
      prisma.adventure.update({
        where: { id: adventureId },
        data: { voteCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ voted: false });
  }

  await prisma.$transaction([
    prisma.vote.create({
      data: { userId: session.user.id, adventureId },
    }),
    prisma.adventure.update({
      where: { id: adventureId },
      data: { voteCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ voted: true });
}
