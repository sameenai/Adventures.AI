import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { allowed, retryAfter } = await rateLimit(
    `vote:${session.user.id}`,
    RATE_LIMITS.vote.limit,
    RATE_LIMITS.vote.windowSeconds,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // Toggle without a read-then-write race: two concurrent taps previously
  // both observed "no vote", both created, and the loser threw a raw P2002
  // 500 while voteCount drifted. Delete-first decides the direction
  // atomically — deleteMany reports whether a vote actually existed.
  const removed = await prisma.$transaction(async (tx) => {
    const deleted = await tx.vote.deleteMany({
      where: { userId: session.user.id, adventureId },
    });
    if (deleted.count > 0) {
      await tx.adventure.update({
        where: { id: adventureId },
        data: { voteCount: { decrement: 1 } },
      });
      return true;
    }
    return false;
  });

  if (removed) {
    return NextResponse.json({ voted: false });
  }

  let updatedAdventure: { userId: string; title: string; voteCount: number };
  try {
    [, updatedAdventure] = await prisma.$transaction([
      prisma.vote.create({
        data: { userId: session.user.id, adventureId },
      }),
      prisma.adventure.update({
        where: { id: adventureId },
        data: { voteCount: { increment: 1 } },
        select: { userId: true, title: true, voteCount: true },
      }),
    ]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // A concurrent request created the vote first — the toggle already
      // landed; report the state instead of a raw 500.
      return NextResponse.json({ voted: true });
    }
    throw err;
  }

  // Notify owner at milestone vote counts
  const MILESTONES = [10, 50, 100];
  if (
    MILESTONES.includes(updatedAdventure.voteCount) &&
    updatedAdventure.userId !== session.user.id
  ) {
    await prisma.notification.create({
      data: {
        userId: updatedAdventure.userId,
        type: "NEW_VOTE",
        message: `Your adventure "${updatedAdventure.title}" reached ${updatedAdventure.voteCount} votes!`,
        linkUrl: `/adventures/${adventureId}`,
      },
    });
  }

  return NextResponse.json({ voted: true });
}
