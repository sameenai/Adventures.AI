import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findUnique: vi.fn() },
  },
}));
vi.mock("next/og", () => ({
  ImageResponse: vi.fn().mockImplementation((element: unknown) => ({ element })),
}));

import { prisma } from "@/lib/db/prisma";
import { ImageResponse } from "next/og";

const mockPrisma = prisma as typeof prisma & Record<string, ReturnType<typeof vi.fn>>;

describe("opengraph-image", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns an ImageResponse for a published adventure", async () => {
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "Nepal Trek",
      location: "Nepal",
      country: "Nepal",
      category: "TREKKING",
      difficulty: "CHALLENGING",
      durationDays: 14,
      coverImageUrl: "https://example.com/img.jpg",
    });

    const { default: Image } = await import(
      "@/app/(dashboard)/adventures/[id]/opengraph-image"
    );
    const result = await Image({ params: Promise.resolve({ id: "adv-1" }) });

    expect(ImageResponse).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("returns a fallback ImageResponse when adventure not found", async () => {
    (mockPrisma.adventure.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { default: Image } = await import(
      "@/app/(dashboard)/adventures/[id]/opengraph-image"
    );
    const result = await Image({ params: Promise.resolve({ id: "missing" }) });

    expect(result).toBeDefined();
    expect(ImageResponse).toHaveBeenCalled();
  });
});
