import { createHash } from "node:crypto";
import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getClientIp } from "@/lib/request";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Privacy-preserving view identifier. Nothing is stored on the visitor's
 * device (PECR: no consent banner needed). Signed-in views key on the user
 * id; anonymous views key on a salted hash of network data that rotates
 * daily, so anonymous browsing history cannot be reassembled across days.
 */
function viewerKey(request: NextRequest, userId: string | undefined | null): string {
  if (userId) return `user:${userId}`;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.NEXTAUTH_SECRET ?? "dev-salt";
  const ua = request.headers.get("user-agent") ?? "";
  const digest = createHash("sha256")
    .update(`${salt}:${day}:${getClientIp(request)}:${ua}`)
    .digest("hex");
  return `anon:${digest.slice(0, 32)}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  const ip = getClientIp(request);
  const rl = await rateLimit(
    `adventure-view:${ip}`,
    RATE_LIMITS.adventureView.limit,
    RATE_LIMITS.adventureView.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const fingerprint = `${viewerKey(request, session?.user?.id)}:${adventureId}`;

  // Denormalized counter (mirrors voteCount): increment only when this viewer
  // key is new, so the hottest read path never runs COUNT(*) over view rows —
  // which also lets the retention job prune old rows without losing totals.
  try {
    await prisma.adventureView.create({
      data: { adventureId, fingerprint, userId: session?.user?.id ?? null },
    });
    const adventure = await prisma.adventure.update({
      where: { id: adventureId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return NextResponse.json({ count: adventure.viewCount });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Repeat view within this key's window — count unchanged.
      const adventure = await prisma.adventure.findUnique({
        where: { id: adventureId },
        select: { viewCount: true },
      });
      return NextResponse.json({ count: adventure?.viewCount ?? 0 });
    }
    throw err;
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { viewCount: true },
  });
  return NextResponse.json({ count: adventure?.viewCount ?? 0 });
}
