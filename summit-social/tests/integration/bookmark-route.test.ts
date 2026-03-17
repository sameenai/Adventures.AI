// Tests for POST/DELETE /api/adventures/[id]/bookmark
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: { findUnique: vi.fn() },
    bookmark: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import {
  POST,
  DELETE,
} from "@/app/api/adventures/[id]/bookmark/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockAdventure = prisma.adventure as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBookmark = prisma.bookmark as unknown as Record<string, ReturnType<typeof vi.fn>>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST (add bookmark)
// ---------------------------------------------------------------------------
describe("POST /api/adventures/[id]/bookmark", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when adventure does not exist", async () => {
    mockSession();
    mockAdventure.findUnique.mockResolvedValue(null);
    const res = await POST(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("upserts bookmark and returns bookmarked=true", async () => {
    mockSession();
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1" });
    mockBookmark.upsert.mockResolvedValue({});
    const res = await POST(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookmarked).toBe(true);
    expect(mockBookmark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ adventureId: "adv-1", userId: "user-1" }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// DELETE (remove bookmark)
// ---------------------------------------------------------------------------
describe("DELETE /api/adventures/[id]/bookmark", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(401);
  });

  it("deletes bookmark and returns bookmarked=false", async () => {
    mockSession();
    mockBookmark.deleteMany.mockResolvedValue({ count: 1 });
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookmarked).toBe(false);
    expect(mockBookmark.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", adventureId: "adv-1" },
      }),
    );
  });
});
