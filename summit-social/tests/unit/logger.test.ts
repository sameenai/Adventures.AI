import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("in development (NODE_ENV !== 'production')", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("logs info messages", () => {
      logger.info("test info");
      expect(console.info).toHaveBeenCalledOnce();
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[INFO]");
      expect(call).toContain("test info");
    });

    it("logs warn messages", () => {
      logger.warn("test warning");
      expect(console.warn).toHaveBeenCalledOnce();
      const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[WARN]");
      expect(call).toContain("test warning");
    });

    it("logs error messages", () => {
      logger.error("test error");
      expect(console.error).toHaveBeenCalledOnce();
      const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("[ERROR]");
      expect(call).toContain("test error");
    });

    it("includes data argument when provided", () => {
      const data = { key: "value" };
      logger.info("with data", data);
      const args = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      const fullOutput = args.join(" ");
      expect(fullOutput).toContain("with data");
      expect(fullOutput).toContain("key");
    });

    it("does not include data argument when not provided", () => {
      logger.info("no data");
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toContain("no data");
      expect(call).not.toContain("undefined");
    });

    it("includes ISO timestamp in log output", () => {
      logger.info("timestamp test");
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("in production (NODE_ENV === 'production')", () => {
    it("logs warn in any environment", () => {
      logger.warn("prod warn");
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it("logs error in any environment", () => {
      logger.error("prod error");
      expect(console.error).toHaveBeenCalledOnce();
    });

    it("outputs structured JSON when NODE_ENV is production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();
      const { logger: prodLogger } = await import("@/lib/logger");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      prodLogger.warn("structured test");
      expect(warnSpy).toHaveBeenCalledOnce();
      const output = warnSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.severity).toBe("WARN");
      expect(parsed.message).toBe("structured test");
      expect(parsed.timestamp).toBeDefined();
      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });
});

// ---------------------------------------------------------------------------
// Redaction — secrets and PII must never reach log output
// ---------------------------------------------------------------------------
import { scrub } from "@/lib/logger";

describe("logger scrub", () => {
  it("redacts OpenAI-style keys inside strings", () => {
    expect(scrub("failed with key sk-proj-abcdef1234567890")).not.toContain("sk-proj");
    expect(scrub("failed with key sk-proj-abcdef1234567890")).toContain("[REDACTED]");
  });

  it("redacts Stripe secrets and webhook secrets", () => {
    expect(scrub("sk_live_abcdefgh12345678 whsec_zyxwvut987654321")).toBe(
      "[REDACTED] [REDACTED]",
    );
  });

  it("redacts bearer tokens", () => {
    expect(scrub("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig")).toContain(
      "[REDACTED]",
    );
  });

  it("redacts email addresses", () => {
    const out = scrub("user sameen.jalal@example.com hit an error") as string;
    expect(out).not.toContain("@example.com");
  });

  it("redacts sensitive keys in nested objects", () => {
    const out = scrub({
      request: { apiKey: "super-secret", ok: true },
      authorization: "Bearer abc",
    }) as Record<string, { apiKey: string; ok: boolean }> & { authorization: string };
    expect(out.request.apiKey).toBe("[REDACTED]");
    expect(out.authorization).toBe("[REDACTED]");
    expect(out.request.ok).toBe(true);
  });

  it("keeps Error name/message and truncates deep stacks", () => {
    const err = new Error("boom sk-abcdefgh87654321");
    const out = scrub(err) as { name: string; message: string; stack?: string };
    expect(out.name).toBe("Error");
    expect(out.message).toContain("[REDACTED]");
    expect((out.stack ?? "").split("\n").length).toBeLessThanOrEqual(8);
  });

  it("truncates very long strings", () => {
    const out = scrub("x".repeat(5000)) as string;
    expect(out.length).toBeLessThan(2100);
  });

  it("caps recursion depth", () => {
    const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    const out = JSON.stringify(scrub(deep));
    expect(out).toContain("[truncated]");
  });
});
