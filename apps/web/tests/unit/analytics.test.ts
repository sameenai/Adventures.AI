// Observability + product analytics: PII discipline, consent signals, and
// error reporting are structural guarantees, so they get structural tests.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { analyticsEvent: { create: vi.fn().mockResolvedValue({}) } },
}));

import { POST as collect } from "@/app/api/analytics/collect/route";
import { track } from "@/lib/analytics/track";
import { rateLimit } from "@/lib/db/redis";
import { reportError } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const createEvent = vi.mocked(prisma.analyticsEvent.create);
const mockSession = getServerSession as ReturnType<typeof vi.fn>;

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue(null);
});

describe("track — PII discipline", () => {
  it("drops email-shaped and oversized string props", () => {
    track("flight_saved", {
      userId: "u1",
      props: {
        route: "LHR-KTM",
        email: "sam@example.com",
        essay: "x".repeat(200),
        count: 3,
        ok: true,
      },
    });
    const data = createEvent.mock.calls[0][0].data;
    expect(data.props).toEqual({ route: "LHR-KTM", count: 3, ok: true });
  });

  it("never throws — even when the client is broken", () => {
    createEvent.mockImplementationOnce(() => {
      throw new Error("client exploded");
    });
    expect(() => track("signup", { userId: "u1" })).not.toThrow();
  });
});

describe("POST /api/analytics/collect", () => {
  it("honours Do-Not-Track: 204, nothing recorded", async () => {
    const res = await collect(req({ name: "page_view", path: "/adventures" }, { dnt: "1" }));
    expect(res.status).toBe(204);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("honours Global Privacy Control the same way", async () => {
    const res = await collect(
      req({ name: "page_view", path: "/adventures" }, { "sec-gpc": "1" }),
    );
    expect(res.status).toBe(204);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("rejects non-allowlisted events and junk paths silently", async () => {
    for (const body of [
      { name: "credential_stuffing", path: "/x" },
      { name: "page_view", path: "https://evil.example" },
      { name: "page_view", path: "/a?token=secret" },
      "garbage",
    ]) {
      const res = await collect(req(body));
      expect(res.status).toBe(204);
    }
    expect(createEvent).not.toHaveBeenCalled();
  });

  it("records anonymous page views under the salted rotating key, not the IP", async () => {
    const res = await collect(
      req({ name: "page_view", path: "/adventures/[id]" }, { "x-forwarded-for": "203.0.113.9" }),
    );
    expect(res.status).toBe(204);
    const data = createEvent.mock.calls[0][0].data;
    expect(data.userId).toBeNull();
    expect(data.anonId).toMatch(/^anon:[0-9a-f]{32}$/);
    expect(JSON.stringify(data)).not.toContain("203.0.113.9");
  });

  it("attributes signed-in views to the user with no anon key", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    await collect(req({ name: "page_view", path: "/next-trip" }));
    const data = createEvent.mock.calls[0][0].data;
    expect(data.userId).toBe("u1");
    expect(data.anonId).toBeNull();
  });

  it("sheds load silently when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, retryAfter: 60 });
    const res = await collect(req({ name: "page_view", path: "/adventures" }));
    expect(res.status).toBe(204);
    expect(createEvent).not.toHaveBeenCalled();
  });
});

describe("reportError — GCP Error Reporting shape", () => {
  it("emits a scrubbed ReportedErrorEvent entry in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    reportError(new Error("boom sk-abcdef1234567890 happened"), {
      route: "POST /api/bookings/[id]/checkout",
      requestId: "req-123",
    });

    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.severity).toBe("ERROR");
    expect(entry["@type"]).toContain("ReportedErrorEvent");
    expect(entry.message).toContain("boom");
    expect(entry.message).not.toContain("sk-abcdef1234567890");
    expect(entry.requestId).toBe("req-123");
    expect(entry.context.httpRequest.url).toBe("POST /api/bookings/[id]/checkout");

    spy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("accepts non-Error throwables", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => reportError("string failure", {})).not.toThrow();
    spy.mockRestore();
  });
});
