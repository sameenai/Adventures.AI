import { withApi } from "@/lib/api/handler";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const POST = withApi(
  { rateLimit: { name: "adventureCreate", prefix: "adventure:create" } },
  async ({ userId, params }) => {
    const { id } = params;

    const original = await prisma.adventure.findUnique({
      where: { id },
      include: { tags: { select: { name: true } } },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (original.userId !== userId) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      userId: _uid,
      tags,
      imageAttribution,
      ...rest
    } = original;

    const duplicate = await prisma.adventure.create({
      data: {
        ...rest,
        // Json columns read back as JsonValue (nullable); the create input
        // wants InputJsonValue or omission.
        ...(imageAttribution !== null ? { imageAttribution } : {}),
        title: `${rest.title} (Copy)`,
        published: false,
        userId,
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
  },
);
