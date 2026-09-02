import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coverImage: { findUnique: mockFindUnique },
  },
}));

import { GET } from "@/app/api/images/[id]/route";

describe("GET /api/images/[id]", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("returns image data with correct headers when CoverImage exists", async () => {
    const imageData = Buffer.from("fake-png-data");
    mockFindUnique.mockResolvedValue({
      data: imageData,
      contentType: "image/png",
      sourceUrl: "https://example.com/img.png",
    });

    const res = await GET(
      new Request("http://localhost/api/images/test-id"),
      { params: Promise.resolve({ id: "test-id" }) },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(res.headers.get("ETag")).toBeTruthy();
    const body = Buffer.from(await res.arrayBuffer());
    expect(body).toEqual(imageData);
  });

  it("returns 404 when CoverImage not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/images/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(res.status).toBe(404);
  });

  it("looks up by adventureId", async () => {
    mockFindUnique.mockResolvedValue(null);

    await GET(
      new Request("http://localhost/api/images/adv-123"),
      { params: Promise.resolve({ id: "adv-123" }) },
    );

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { adventureId: "adv-123" },
    });
  });

  it("returns 304 when ETag matches If-None-Match", async () => {
    const imageData = Buffer.from("fake-etag-data");
    mockFindUnique.mockResolvedValue({
      data: imageData,
      contentType: "image/jpeg",
      sourceUrl: "https://example.com/img.jpg",
    });

    const first = await GET(
      new Request("http://localhost/api/images/etag-test"),
      { params: Promise.resolve({ id: "etag-test" }) },
    );
    const etag = first.headers.get("ETag")!;
    expect(etag).toBeTruthy();

    const second = await GET(
      new Request("http://localhost/api/images/etag-test", {
        headers: { "If-None-Match": etag },
      }),
      { params: Promise.resolve({ id: "etag-test" }) },
    );

    expect(second.status).toBe(304);
  });
});
