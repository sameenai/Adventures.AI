import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true, bio: true, instagramUrl: true },
      },
      tags: true,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
      votes: { select: { userId: true } },
    },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(adventure);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, adventure] = await Promise.all([
    getServerSession(authOptions),
    prisma.adventure.findUnique({ where: { id }, select: { userId: true } }),
  ]);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (adventure.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.adventure.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
