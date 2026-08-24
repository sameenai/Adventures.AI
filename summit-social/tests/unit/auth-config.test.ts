// Guards the dev-login gate and session policy in src/lib/auth/config.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { upsert: vi.fn(), updateMany: vi.fn() } },
}));

type ProviderLike = { id: string };
type AuthModule = {
  authOptions: {
    providers: ProviderLike[];
    session: { strategy: string; maxAge?: number };
    events: {
      signIn: (args: { user: { email?: string | null } }) => Promise<void>;
    };
    callbacks: {
      signIn: (args: {
        user: { id: string; email?: string | null; name?: string | null; image?: string | null };
        account?: { provider: string } | null;
      }) => Promise<boolean>;
      session: (args: {
        session: { user?: { id?: string } };
        token: { sub?: string };
      }) => Promise<{ user?: { id?: string } }>;
      jwt: (args: {
        token: { sub?: string };
        user?: { id: string };
      }) => Promise<{ sub?: string }>;
    };
  };
};

async function loadAuthConfig(env: Record<string, string | undefined>): Promise<AuthModule> {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
  return (await import("@/lib/auth/config")) as unknown as AuthModule;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth config — dev login gate", () => {
  it("registers the credentials provider only with explicit ENABLE_DEV_LOGIN=true", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "development",
      ENABLE_DEV_LOGIN: "true",
    });
    expect(authOptions.providers.some((p) => p.id === "credentials")).toBe(true);
  });

  it("does NOT register the credentials provider without the opt-in flag", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "development",
      ENABLE_DEV_LOGIN: undefined,
    });
    expect(authOptions.providers.some((p) => p.id === "credentials")).toBe(false);
  });

  it("never registers the credentials provider in production, even with the flag", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "production",
      ENABLE_DEV_LOGIN: "true",
    });
    expect(authOptions.providers.some((p) => p.id === "credentials")).toBe(false);
  });
});

describe("auth config — session policy", () => {
  it("uses jwt sessions capped at 7 days", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "development",
      ENABLE_DEV_LOGIN: "true",
    });
    expect(authOptions.session.strategy).toBe("jwt");
    expect(authOptions.session.maxAge).toBe(7 * 24 * 60 * 60);
  });
});

describe("auth config — callbacks", () => {
  it("maps token.sub onto session.user.id", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "development",
      ENABLE_DEV_LOGIN: "true",
    });
    const session = await authOptions.callbacks.session({
      session: { user: {} },
      token: { sub: "user-123" },
    });
    expect(session.user?.id).toBe("user-123");
  });

  it("stores user.id into token.sub on sign-in", async () => {
    const { authOptions } = await loadAuthConfig({
      NODE_ENV: "development",
      ENABLE_DEV_LOGIN: "true",
    });
    const token = await authOptions.callbacks.jwt({ token: {}, user: { id: "user-9" } });
    expect(token.sub).toBe("user-9");
  });
});

describe("auth config — google user provisioning", () => {
  it("re-keys the session to the upserted database user id", async () => {
    const mod = await loadAuthConfig({ NODE_ENV: "development", ENABLE_DEV_LOGIN: "true" });
    const { prisma } = await import("@/lib/db/prisma");
    (prisma.user.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "db-user-1" });

    const user = {
      id: "google-oauth-sub-123",
      email: "hiker@example.com",
      name: "Hiker",
      image: "https://example.com/a.png",
    };
    const ok = await mod.authOptions.callbacks.signIn({
      user,
      account: { provider: "google" },
    });

    expect(ok).toBe(true);
    // Without this, every prisma lookup keyed on session.user.id misses.
    expect(user.id).toBe("db-user-1");
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "hiker@example.com" } }),
    );
  });

  it("rejects google sign-ins without an email", async () => {
    const mod = await loadAuthConfig({ NODE_ENV: "development", ENABLE_DEV_LOGIN: "true" });
    const ok = await mod.authOptions.callbacks.signIn({
      user: { id: "sub-1", email: null },
      account: { provider: "google" },
    });
    expect(ok).toBe(false);
  });

  it("leaves credentials sign-ins untouched (already database-keyed)", async () => {
    const mod = await loadAuthConfig({ NODE_ENV: "development", ENABLE_DEV_LOGIN: "true" });
    const { prisma } = await import("@/lib/db/prisma");
    (prisma.user.upsert as ReturnType<typeof vi.fn>).mockClear();
    const user = { id: "db-user-9", email: "dev@example.com" };
    const ok = await mod.authOptions.callbacks.signIn({
      user,
      account: { provider: "credentials" },
    });
    expect(ok).toBe(true);
    expect(user.id).toBe("db-user-9");
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});

describe("auth config — terms acceptance", () => {
  it("stamps termsAcceptedAt + version once on first sign-in", async () => {
    const mod = await loadAuthConfig({ NODE_ENV: "development", ENABLE_DEV_LOGIN: "true" });
    const { prisma } = await import("@/lib/db/prisma");
    (prisma.user.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

    await mod.authOptions.events.signIn({ user: { email: "hiker@example.com" } });

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { email: "hiker@example.com", termsAcceptedAt: null },
      data: expect.objectContaining({
        termsAcceptedAt: expect.any(Date),
        termsVersion: expect.any(String),
      }),
    });
  });
});
