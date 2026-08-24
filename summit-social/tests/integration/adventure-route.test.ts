// Tests for GET/DELETE/PATCH /api/adventures/[id]
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    adventure: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { GET, DELETE, PATCH } from "@/app/api/adventures/[id]/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockAdventure = prisma.adventure as unknown as Record<string, ReturnType<typeof vi.fn>>;

function mockSession(userId = "user-1", email = "user@test.com") {
  mockGetSession.mockResolvedValue({ user: { id: userId, email } });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(body: object) {
  return new Request("http://localhost/api/adventures/adv-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_EMAILS;
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe("GET /api/adventures/[id]", () => {
  it("returns 404 when adventure not found", async () => {
    mockAdventure.findUnique.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("returns adventure data when found", async () => {
    const adv = {
      id: "adv-1",
      title: "Nepal Trek",
      published: true,
      userId: "u-1",
      user: { id: "u-1" },
      comments: [],
    };
    mockAdventure.findUnique.mockResolvedValue(adv);
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("adv-1");
  });

  it("does not select voter userIds", async () => {
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", published: true, userId: "u-1" });
    await GET(new Request("http://localhost"), makeParams("adv-1"));
    const include = mockAdventure.findUnique.mock.calls[0][0].include;
    expect(include.votes).toBeUndefined();
  });

  it("hides unpublished adventures from anonymous callers (404)", async () => {
    mockGetSession.mockResolvedValue(null);
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", published: false, userId: "u-1" });
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("hides unpublished adventures from other users (404)", async () => {
    mockSession("someone-else");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", published: false, userId: "u-1" });
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("returns unpublished adventures to their owner", async () => {
    mockSession("u-1");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", published: false, userId: "u-1" });
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(200);
  });

  it("returns unpublished adventures to admins", async () => {
    process.env.ADMIN_EMAILS = "admin@basecamper.ai";
    mockSession("someone-else", "admin@basecamper.ai");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", published: false, userId: "u-1" });
    const res = await GET(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
describe("DELETE /api/adventures/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession();
    mockAdventure.findUnique.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the owner", async () => {
    mockSession("user-2");
    mockAdventure.findUnique.mockResolvedValue({ userId: "user-1" });
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(403);
  });

  it("deletes and returns 204 for owner", async () => {
    mockSession("user-1");
    mockAdventure.findUnique.mockResolvedValue({ userId: "user-1" });
    mockAdventure.delete.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost"), makeParams("adv-1"));
    expect(res.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// PATCH — admin published toggle (lines 89-103)
// ---------------------------------------------------------------------------
describe("PATCH /api/adventures/[id] — admin published toggle", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = "admin@test.com";
  });

  it("allows admin to toggle published status", async () => {
    mockSession("admin-1", "admin@test.com");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "other-user" });
    mockAdventure.update.mockResolvedValue({ id: "adv-1", published: true });
    const res = await PATCH(patchRequest({ published: true }), makeParams("adv-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.published).toBe(true);
    expect(mockAdventure.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { published: true } }),
    );
  });

  it("returns 400 when published is not boolean for admin", async () => {
    mockSession("admin-1", "admin@test.com");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "other-user" });
    const res = await PATCH(patchRequest({ published: "yes" }), makeParams("adv-1"));
    expect(res.status).toBe(400);
  });

  it("non-admin owner cannot use admin published toggle — uses owner path instead", async () => {
    mockSession("user-1", "user@test.com");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "user-1" });
    mockAdventure.update.mockResolvedValue({ id: "adv-1", tags: [] });
    // Non-admin with published field: falls through to owner edit path (published is stripped)
    const res = await PATCH(patchRequest({ published: true }), makeParams("adv-1"));
    // Owner path doesn't include `published` in the update data
    expect(res.status).toBe(200);
    const updateCall = mockAdventure.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("published");
  });
});

// ---------------------------------------------------------------------------
// PATCH — owner adventure update with tags (lines 118-135)
// ---------------------------------------------------------------------------
describe("PATCH /api/adventures/[id] — owner update", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PATCH(patchRequest({ title: "New Title" }), makeParams("adv-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when adventure not found", async () => {
    mockSession("user-1");
    mockAdventure.findUnique.mockResolvedValue(null);
    const res = await PATCH(patchRequest({ title: "New Title" }), makeParams("adv-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the owner", async () => {
    mockSession("user-2");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "user-1" });
    const res = await PATCH(patchRequest({ title: "New" }), makeParams("adv-1"));
    expect(res.status).toBe(403);
  });

  it("updates adventure and returns 200", async () => {
    mockSession("user-1");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "user-1" });
    mockAdventure.update.mockResolvedValue({
      id: "adv-1",
      title: "Updated Title",
      tags: [],
    });
    const res = await PATCH(
      patchRequest({ title: "Updated Title", location: "Nepal" }),
      makeParams("adv-1"),
    );
    expect(res.status).toBe(200);
  });

  it("includes tag connectOrCreate when tags provided", async () => {
    mockSession("user-1");
    mockAdventure.findUnique.mockResolvedValue({ id: "adv-1", userId: "user-1" });
    mockAdventure.update.mockResolvedValue({ id: "adv-1", title: "Trek", tags: [] });
    await PATCH(
      patchRequest({ title: "Trek", location: "Nepal", tags: ["trekking", "himalaya"] }),
      makeParams("adv-1"),
    );
    expect(mockAdventure.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: expect.objectContaining({
            connectOrCreate: expect.any(Array),
          }),
        }),
      }),
    );
  });
});
