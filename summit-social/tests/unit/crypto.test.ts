import { afterEach, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";

describe("crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns plaintext when no ENCRYPTION_KEY is set", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    const text = "sk-test-key-12345678";
    expect(encrypt(text)).toBe(text);
    expect(decrypt(text)).toBe(text);
  });

  it("encrypts and decrypts correctly with a valid key", () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    const plaintext = "sk-proj-realkey123456789abcdef";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).not.toBeNull();
    const decrypted = decrypt(encrypted!);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    vi.stubEnv("ENCRYPTION_KEY", "b".repeat(64));
    const plaintext = "sk-test-repeated";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
    expect(decrypt(a!)).toBe(plaintext);
    expect(decrypt(b!)).toBe(plaintext);
  });

  it("returns original string if decryption fails (e.g. legacy unencrypted key)", () => {
    vi.stubEnv("ENCRYPTION_KEY", "c".repeat(64));
    const legacy = "sk-legacy-plaintext-key";
    const result = decrypt(legacy);
    expect(result).toBe(legacy);
  });
});
