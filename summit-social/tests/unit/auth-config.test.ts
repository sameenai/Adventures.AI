// Guards the dev-login gate and session policy in src/lib/auth/config.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { upsert: vi.fn() } },
}));

type ProviderLike = { id: string };
type AuthModule = {
  authOptions: {
    providers: ProviderLike[];
    session: { strategy: string; maxAge?: number };
    callbacks: {
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
