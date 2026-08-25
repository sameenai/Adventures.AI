import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";

describe("buildCsp", () => {
  it("embeds the per-request nonce in script-src with strict-dynamic", () => {
    const csp = buildCsp("abc123", false);
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "));
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).toContain("https://js.stripe.com");
  });

  it("never allows unsafe-inline or unsafe-eval scripts in production", () => {
    const csp = buildCsp("abc123", false);
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("allows unsafe-eval only in dev (React Refresh)", () => {
    const dev = buildCsp("abc123", true);
    const devScriptSrc = dev.split("; ").find((d) => d.startsWith("script-src "));
    expect(devScriptSrc).toContain("'unsafe-eval'");
    expect(devScriptSrc).not.toContain("'unsafe-inline'");
  });

  it("locks down injection-adjacent directives", () => {
    const csp = buildCsp("n", false);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it("keeps the media and connect allowlists the app depends on", () => {
    const csp = buildCsp("n", false);
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).toContain("https://*.tile.openstreetmap.org");
    expect(csp).toContain("connect-src 'self' https://api.stripe.com");
    expect(csp).toContain("frame-src https://js.stripe.com https://hooks.stripe.com");
    expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
  });

  it("produces distinct policies for distinct nonces (no caching hazard)", () => {
    expect(buildCsp("one", false)).not.toEqual(buildCsp("two", false));
  });
});
