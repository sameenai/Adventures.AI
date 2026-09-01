import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const image = await prisma.coverImage.findUnique({
    where: { adventureId: id },
  });

  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.data.byteLength),
    },
  });
}
