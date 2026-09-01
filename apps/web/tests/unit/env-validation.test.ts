import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("env validation", () => {
  const VALID_REQUIRED = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "a-very-long-secret-that-is-at-least-16-chars",
  };

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PHASE", "");
    vi.stubEnv("NODE_ENV", "production");
    // Set required vars for all tests
    for (const [k, v] of Object.entries(VALID_REQUIRED)) {
      vi.stubEnv(k, v);
    }
    // Clear all optional vars
    for (const key of [
      "REDIS_URL", "OPENAI_API_KEY", "ENCRYPTION_KEY", "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRO_PRICE_ID", "AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET",
      "AMADEUS_BASE_URL", "SKYSCANNER_API_KEY", "SKYSCANNER_BASE_URL",
      "SKYSCANNER_AFFILIATE_ID", "ADMIN_EMAILS", "JOBS_SECRET", "ENABLE_DEV_LOGIN",
    ]) {
      vi.stubEnv(key, "");
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw when optional env vars are absent", async () => {
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("does not throw when optional env vars are set to 'placeholder'", async () => {
    vi.stubEnv("OPENAI_API_KEY", "placeholder");
    vi.stubEnv("STRIPE_SECRET_KEY", "placeholder");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "placeholder");
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "placeholder");
    vi.stubEnv("REDIS_URL", "placeholder");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("does not throw when optional env vars are empty strings", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("does not throw when optional env vars use 'changeme' placeholder", async () => {
    vi.stubEnv("OPENAI_API_KEY", "changeme");
    vi.stubEnv("STRIPE_SECRET_KEY", "changeme");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("throws when DATABASE_URL is missing in production", async () => {
    delete process.env.DATABASE_URL;
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("@/lib/env")).rejects.toThrow(/DATABASE_URL/);
  });

  it("throws when NEXTAUTH_SECRET is too short in production", async () => {
    vi.stubEnv("NEXTAUTH_SECRET", "short");
    await expect(import("@/lib/env")).rejects.toThrow(/NEXTAUTH_SECRET/);
  });

  it("throws when NEXTAUTH_URL is not a valid URL in production", async () => {
    vi.stubEnv("NEXTAUTH_URL", "not-a-url");
    await expect(import("@/lib/env")).rejects.toThrow(/NEXTAUTH_URL/);
  });

  it("accepts valid OPENAI_API_KEY format", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-proj-abc123def456");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("accepts valid STRIPE_SECRET_KEY format", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("accepts valid REDIS_URL with redis:// scheme", async () => {
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("accepts valid REDIS_URL with rediss:// scheme", async () => {
    vi.stubEnv("REDIS_URL", "rediss://user:pass@host:6380");
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("does not throw during build phase", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.NEXTAUTH_SECRET;
    await expect(import("@/lib/env")).resolves.not.toThrow();
  });

  it("warns in development instead of throwing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXTAUTH_SECRET", "short");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await import("@/lib/env");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
