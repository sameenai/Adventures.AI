// The transactional email layer: audit-trail writes, env gating, token safety.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { emailLog: { create: vi.fn().mockResolvedValue({}) } },
}));

import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmedEmail, escapeHtml, tripDueEmail } from "@/lib/email/templates";
import { unsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

const emailLogCreate = vi.mocked(prisma.emailLog.create);

const input = {
  to: "sam@example.com",
  userId: "user-1",
  template: "trip-due",
  subject: "Test",
  html: "<p>hi</p>",
  text: "hi",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  it("records SKIPPED and sends nothing when no provider is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await sendEmail(input);
    expect(result.status).toBe("SKIPPED");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SKIPPED" }) }),
    );
  });

  it("sends via the provider and records SENT with the provider id", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "prov-123" }), { status: 200 }),
      ),
    );

    const result = await sendEmail(input);
    expect(result.status).toBe("SENT");
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SENT", providerId: "prov-123" }),
      }),
    );
  });

  it("records FAILED on provider rejection and never throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("invalid from address", { status: 422 })),
    );

    const result = await sendEmail(input);
    expect(result.status).toBe("FAILED");
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );
  });

  it("records FAILED on network error and never throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await sendEmail(input);
    expect(result.status).toBe("FAILED");
  });
});

describe("unsubscribe tokens", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "a-test-secret-that-is-long-enough");
  });

  it("round-trips a user id", () => {
    const token = unsubscribeToken("user-abc-123");
    expect(verifyUnsubscribeToken(token)).toBe("user-abc-123");
  });

  it("rejects a tampered payload", () => {
    const token = unsubscribeToken("user-abc-123");
    const [, sig] = token.split(".");
    const forged = `${Buffer.from("victim-user").toString("base64url")}.${sig}`;
    expect(verifyUnsubscribeToken(forged)).toBeNull();
  });

  it("rejects a tampered signature and garbage", () => {
    const token = unsubscribeToken("user-abc-123");
    expect(verifyUnsubscribeToken(`${token.slice(0, -2)}xx`)).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
    expect(verifyUnsubscribeToken("")).toBeNull();
  });
});

describe("templates", () => {
  it("escapes user-controlled strings", () => {
    expect(escapeHtml(`<img src=x onerror="x">'&`)).not.toMatch(/[<>"']/);

    const email = tripDueEmail({
      name: `<script>alert(1)</script>`,
      monthLabel: "March",
      recommendations: [
        { title: `<b>Injected</b>`, location: "X", country: "Y", url: "https://x" },
      ],
      nextTripUrl: "https://basecamper.ai/next-trip",
      unsubscribeUrl: "https://basecamper.ai/api/email/unsubscribe?token=t",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>Injected</b>");
    expect(email.html).toContain("unsubscribe?token=t");
  });

  it("booking confirmation carries route, flight, price and no unsubscribe link", () => {
    const email = bookingConfirmedEmail({
      name: "Sam",
      airline: "British Airways",
      flightNumber: "BA143",
      origin: "LHR",
      destination: "KTM",
      departureAt: new Date("2026-10-02T08:30:00Z"),
      priceGBP: 45600,
      itineraryUrl: "https://basecamper.ai/itinerary/it-1",
    });
    expect(email.subject).toContain("LHR → KTM");
    expect(email.html).toContain("BA143");
    expect(email.html).toContain("£456.00");
    expect(email.html).not.toContain("Unsubscribe");
    expect(email.text).toContain("LHR → KTM");
  });
});
