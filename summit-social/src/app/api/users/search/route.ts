import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      _count: { select: { adventures: { where: { published: true } } } },
    },
    orderBy: { adventures: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json(users);
}
