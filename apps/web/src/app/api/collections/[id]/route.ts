import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ userId, params }) => {
  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          adventure: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
              tags: true,
              _count: { select: { comments: true } },
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (collection.userId !== userId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json(collection);
});

export const DELETE = withApi(
  { rateLimit: { name: "collectionCreate", prefix: "collection:create" } },
  async ({ userId, params }) => {
    const collection = await prisma.collection.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }

    if (collection.userId !== userId) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    await prisma.collection.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  },
);
