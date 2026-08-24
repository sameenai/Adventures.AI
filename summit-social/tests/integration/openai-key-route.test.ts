// Tests for GET/POST/DELETE /api/user/openai-key
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("ioredis", () => {
  const Redis = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  }));
  return { default: Redis };
});
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import {
  GET,
  POST,
  DELETE,
} from "@/app/api/user/openai-key/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const mockGetSession = getServerSession as ReturnType<typeof vi.fn>;
const mockUser = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;

function mockSession(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

function postRequest(body: object) {
  return new NextRequest("http://localhost/api/user/openai-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
describe("GET /api/user/openai-key", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns hasKey=false when no key is stored", async () => {
    mockSession();
    mockUser.findUnique.mockResolvedValue({ openAiApiKey: null });
    const res = await GET();
    const data = await res.json();
    expect(data.hasKey).toBe(false);
    expect(data.hint).toBeNull();
  });

  it("returns hasKey=true and hint when key is stored", async () => {
    mockSession();
    mockUser.findUnique.mockResolvedValue({
      openAiApiKey: "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234",
    });
    const res = await GET();
    const data = await res.json();
    expect(data.hasKey).toBe(true);
    expect(data.hint).toMatch(/^sk-proj.*1234$/);
  });

  it("never returns the raw key", async () => {
    const rawKey = "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234";
    mockSession();
    mockUser.findUnique.mockResolvedValue({ openAiApiKey: rawKey });
    const res = await GET();
    const body = await res.text();
    expect(body).not.toContain(rawKey);
  });
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
describe("POST /api/user/openai-key", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(postRequest({ key: "sk-validkeyabcdefghijk" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a key that doesn't start with sk-", async () => {
    mockSession();
    const res = await POST(postRequest({ key: "invalid-key-aaaaaaaaaaaaa" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for a key that is too short", async () => {
    mockSession();
    const res = await POST(postRequest({ key: "sk-short" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 and stores nothing when encryption is not configured", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    mockSession();
    const res = await POST(postRequest({ key: "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe("ENCRYPTION_UNAVAILABLE");
    expect(mockUser.update).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("saves the key encrypted (never plaintext) and returns hint on success", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    mockSession();
    mockUser.update.mockResolvedValue({});
    const key = "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234";
    const res = await POST(postRequest({ key }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hasKey).toBe(true);
    expect(data.hint).toMatch(/sk-proj/);
    expect(data.hint).toMatch(/1234/);
    const updateArg = mockUser.update.mock.calls[0][0] as {
      data: { openAiApiKey: string };
    };
    expect(updateArg.data.openAiApiKey).toBeTruthy();
    expect(updateArg.data.openAiApiKey).not.toBe(key);
    expect(updateArg.data.openAiApiKey).not.toContain("sk-");
    vi.unstubAllEnvs();
  });

  it("hint does not contain the full key", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    mockSession();
    mockUser.update.mockResolvedValue({});
    const key = "sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaa1234";
    const res = await POST(postRequest({ key }));
    const data = await res.json();
    expect(data.hint).not.toBe(key);
    expect(data.hint.length).toBeLessThan(key.length);
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
describe("DELETE /api/user/openai-key", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("clears the key and returns hasKey=false", async () => {
    mockSession();
    mockUser.update.mockResolvedValue({});
    const res = await DELETE();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hasKey).toBe(false);
    expect(data.hint).toBeNull();
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { openAiApiKey: null },
      }),
    );
  });
});
