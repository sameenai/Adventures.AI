import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const POST = withApi({ rateLimit: { name: "vote" } }, async ({ userId, params }) => {
  const adventureId = params.id;

  // Toggle without a read-then-write race: two concurrent taps previously
  // both observed "no vote", both created, and the loser threw a raw P2002
  // 500 while voteCount drifted. Delete-first decides the direction
  // atomically — deleteMany reports whether a vote actually existed.
  const removed = await prisma.$transaction(async (tx) => {
    const deleted = await tx.vote.deleteMany({
      where: { userId, adventureId },
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
        data: { userId, adventureId },
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
  if (MILESTONES.includes(updatedAdventure.voteCount) && updatedAdventure.userId !== userId) {
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
});
