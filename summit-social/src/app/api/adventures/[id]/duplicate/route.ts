import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const original = await prisma.adventure.findUnique({
    where: { id },
    include: { tags: { select: { name: true } } },
  });

  if (!original) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (original.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const { id: _id, createdAt: _c, updatedAt: _u, userId: _uid, tags, ...rest } = original;

  const duplicate = await prisma.adventure.create({
    data: {
      ...rest,
      title: `${rest.title} (Copy)`,
      published: false,
      userId: session.user.id,
      tags: {
        connectOrCreate: tags.map((t) => ({
          where: { name: t.name },
          create: { name: t.name },
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      tags: true,
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
