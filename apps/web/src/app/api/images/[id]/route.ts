import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const imageCache = new Map<string, { data: Buffer; contentType: string; etag: string }>();
const MAX_CACHE_SIZE = 200;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let entry = imageCache.get(id);
  if (!entry) {
    const image = await prisma.coverImage.findUnique({
      where: { adventureId: id },
    });

    if (!image) {
      return new NextResponse(null, { status: 404 });
    }

    const data = Buffer.from(image.data);
    const etag = `"${createHash("md5").update(data).digest("hex")}"`;
    entry = { data, contentType: image.contentType, etag };

    if (imageCache.size >= MAX_CACHE_SIZE) {
      const oldest = imageCache.keys().next().value;
      if (oldest) imageCache.delete(oldest);
    }
    imageCache.set(id, entry);
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === entry.etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: entry.etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new NextResponse(new Uint8Array(entry.data), {
    headers: {
      "Content-Type": entry.contentType,
      "Content-Length": String(entry.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: entry.etag,
    },
  });
}
