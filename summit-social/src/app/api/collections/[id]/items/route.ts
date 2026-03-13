import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getOwnedCollection(id: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!collection) return { error: "Not found", status: 404 };
  if (collection.userId !== userId) return { error: "Forbidden", status: 403 };
  return { collection };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await getOwnedCollection(id, session.user.id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.status === 404 ? "NOT_FOUND" : "FORBIDDEN" },
      { status: result.status },
    );
  }

  const body = await request.json();
  const adventureId = typeof body?.adventureId === "string" ? body.adventureId : null;
  if (!adventureId) {
    return NextResponse.json(
      { error: "adventureId required", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const item = await prisma.collectionItem.upsert({
    where: { collectionId_adventureId: { collectionId: id, adventureId } },
    create: { collectionId: id, adventureId },
    update: {},
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await getOwnedCollection(id, session.user.id);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.status === 404 ? "NOT_FOUND" : "FORBIDDEN" },
      { status: result.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const adventureId = searchParams.get("adventureId");
  if (!adventureId) {
    return NextResponse.json(
      { error: "adventureId required", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  await prisma.collectionItem.deleteMany({
    where: { collectionId: id, adventureId },
  });

  return new Response(null, { status: 204 });
}
