import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const GET = withApi({}, async ({ userId }) => {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 1,
        include: {
          adventure: { select: { coverImageUrl: true } },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  return NextResponse.json(collections);
});

export const POST = withApi(
  { rateLimit: { name: "collectionCreate", prefix: "collection-create" } },
  async ({ request, userId }) => {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be 1–100 characters", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const collection = await prisma.collection.create({
      data: { name, userId },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(collection, { status: 201 });
  },
);
