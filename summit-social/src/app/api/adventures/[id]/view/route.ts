import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const session = await getServerSession(authOptions);

  const body = await request.json().catch(() => ({}));
  const rawFp = typeof body.fingerprint === "string" ? body.fingerprint : null;
  const fingerprint = rawFp && rawFp.length <= 200 ? rawFp : null;

  if (!fingerprint) {
    return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
  }

  await prisma.adventureView.upsert({
    where: { adventureId_fingerprint: { adventureId, fingerprint } },
    create: { adventureId, fingerprint, userId: session?.user?.id ?? null },
    update: {},
  });

  const count = await prisma.adventureView.count({ where: { adventureId } });
  return NextResponse.json({ count });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: adventureId } = await params;
  const count = await prisma.adventureView.count({ where: { adventureId } });
  return NextResponse.json({ count });
}
