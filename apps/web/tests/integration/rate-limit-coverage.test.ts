// Every mutating route must deny with 429 when its rate limiter rejects.
// Guards the "no mutating handler ships without a limiter" rule.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn(),
  getCached: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
}));
// The limiter must fire before any database work, so an empty client suffices:
// any prisma access in a 429 path is itself a bug this test should expose.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import { getServerSession } from "next-auth";
import { rateLimit } from "@/lib/db/redis";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockRateLimit = rateLimit as ReturnType<typeof vi.fn>;

const params = (id = "target-1") => ({ params: Promise.resolve({ id }) });
const req = (method: string, body?: object) =>
  new NextRequest("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe("mutating routes deny with 429 when rate limited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 });
  });

  const cases: Array<{
    name: string;
    load: () => Promise<Record<string, (...args: never[]) => Promise<Response>>>;
    method: string;
    withParams?: boolean;
    paramsId?: string;
    body?: object;
  }> = [
    {
      name: "POST /api/adventures/[id]/duplicate",
      load: () => import("@/app/api/adventures/[id]/duplicate/route"),
      method: "POST",
      withParams: true,
    },
    {
      name: "POST /api/adventures/[id]/publish",
      load: () => import("@/app/api/adventures/[id]/publish/route"),
      method: "POST",
      withParams: true,
    },
    {
      name: "PATCH /api/adventures/[id]",
      load: () => import("@/app/api/adventures/[id]/route"),
      method: "PATCH",
      withParams: true,
      body: { title: "x" },
    },
    {
      name: "DELETE /api/adventures/[id]",
      load: () => import("@/app/api/adventures/[id]/route"),
      method: "DELETE",
      withParams: true,
    },
    {
      name: "PATCH /api/itineraries/[id]",
      load: () => import("@/app/api/itineraries/[id]/route"),
      method: "PATCH",
      withParams: true,
      body: { title: "x" },
    },
    {
      name: "DELETE /api/itineraries/[id]",
      load: () => import("@/app/api/itineraries/[id]/route"),
      method: "DELETE",
      withParams: true,
    },
    {
      name: "PATCH /api/users/[id]",
      load: () => import("@/app/api/users/[id]/route"),
      method: "PATCH",
      withParams: true,
      paramsId: "user-1",
      body: { name: "x" },
    },
    {
      name: "DELETE /api/users/[id]/follow",
      load: () => import("@/app/api/users/[id]/follow/route"),
      method: "DELETE",
      withParams: true,
    },
    {
      name: "DELETE /api/collections/[id]",
      load: () => import("@/app/api/collections/[id]/route"),
      method: "DELETE",
      withParams: true,
    },
    {
      name: "POST /api/collections/[id]/items",
      load: () => import("@/app/api/collections/[id]/items/route"),
      method: "POST",
      withParams: true,
      body: { adventureId: "a1" },
    },
    {
      name: "POST /api/notifications/read-all",
      load: () => import("@/app/api/notifications/read-all/route"),
      method: "POST",
    },
    {
      name: "POST /api/adventures/[id]/bookmark",
      load: () => import("@/app/api/adventures/[id]/bookmark/route"),
      method: "POST",
      withParams: true,
    },
    {
      name: "DELETE /api/adventures/[id]/bookmark",
      load: () => import("@/app/api/adventures/[id]/bookmark/route"),
      method: "DELETE",
      withParams: true,
    },
    {
      name: "POST /api/user/openai-key",
      load: () => import("@/app/api/user/openai-key/route"),
      method: "POST",
      body: { apiKey: "sk-test-1234567890abcdef" },
    },
    {
      name: "DELETE /api/user/openai-key",
      load: () => import("@/app/api/user/openai-key/route"),
      method: "DELETE",
    },
  ];

  for (const c of cases) {
    it(`${c.name} returns 429`, async () => {
      const mod = await c.load();
      const handler = mod[c.method];
      expect(handler, `${c.name} handler missing`).toBeDefined();

      const args: unknown[] = [req(c.method, c.body)];
      if (c.withParams) args.push(params(c.paramsId));
      const response = await handler(...(args as never[]));

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("120");
      const data = await response.json();
      expect(data.code).toBe("RATE_LIMITED");
    });
  }

  it("user PATCH limiter only applies to the profile owner (403 first)", async () => {
    mockSession.mockResolvedValue({ user: { id: "someone-else" } });
    const mod = await import("@/app/api/users/[id]/route");
    const response = await mod.PATCH(req("PATCH", { name: "x" }) as never, params() as never);
    expect(response.status).toBe(403);
    expect(mockRateLimit).not.toHaveBeenCalled();
  });
});
