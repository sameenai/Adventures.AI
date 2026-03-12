import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { updateAdventureSchema } from "@/lib/validators/adventure";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];
  return adminEmails.includes(email);
}

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const body = await request.json();

  // Admin-only: toggle published status
  if ("published" in body && isAdmin(session.user.email)) {
    const published = typeof body.published === "boolean" ? body.published : undefined;
    if (published === undefined) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const updated = await prisma.adventure.update({
      where: { id },
      data: { published },
      select: { id: true, published: true },
    });
    return NextResponse.json(updated);
  }

  // Owner: edit adventure content
  if (adventure.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = updateAdventureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tags, ...fields } = parsed.data;

  const updated = await prisma.adventure.update({
    where: { id },
    data: {
      ...fields,
      ...(tags !== undefined && {
        tags: {
          set: [],
          connectOrCreate: tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      }),
    },
    include: { tags: true },
  });

  return NextResponse.json(updated);
}
