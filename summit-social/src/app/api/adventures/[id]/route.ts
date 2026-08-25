import { withApi } from "@/lib/api/handler";
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

// GET stays hand-rolled: the detail page is public for published adventures,
// so it must not sit behind the envelope's auth gate.
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
    },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Adventure not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Unpublished adventures are drafts: visible only to their owner or an
  // admin. The public detail page enforces this; the API must match it.
  if (!adventure.published) {
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === adventure.userId;
    if (!isOwner && !isAdmin(session?.user?.email)) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
  }

  return NextResponse.json(adventure);
}

export const DELETE = withApi(
  { rateLimit: { name: "adventureMutate", prefix: "adventure:mutate" } },
  async ({ userId, params }) => {
    const { id } = params;

    const adventure = await prisma.adventure.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!adventure) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (adventure.userId !== userId) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    await prisma.adventure.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  },
);

export const PATCH = withApi(
  { rateLimit: { name: "adventureMutate", prefix: "adventure:mutate" } },
  async ({ request, userId, params }) => {
    const { id } = params;

    const adventure = await prisma.adventure.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!adventure) {
      return NextResponse.json(
        { error: "Adventure not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // Admin-only: toggle published status. The envelope only carries the user
    // id, so the admin check re-reads the session for the caller's email.
    if ("published" in body) {
      const session = await getServerSession(authOptions);
      if (isAdmin(session?.user?.email)) {
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
    }

    // Owner: edit adventure content
    if (adventure.userId !== userId) {
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
  },
);
