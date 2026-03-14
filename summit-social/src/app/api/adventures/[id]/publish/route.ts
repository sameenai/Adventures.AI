import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// POST /api/adventures/[id]/publish — toggle published for the owner
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { userId: true, published: true },
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

  return NextResponse.json(updated);
}
