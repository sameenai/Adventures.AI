/**
 * Server-side environment variable validation.
 * Imported once from the root layout — never runs in the browser or tests.
 * In production, throws immediately on startup if required vars are missing.
 * In development, logs a warning so the dev server still starts.
 */
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
});

function validate() {
  // Skip during `next build` — env vars are injected at runtime by Cloud Run
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const result = schema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}`).join("\n");
    const message = `Missing required environment variables:\n${missing}\nSee .env.example for the full list.`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.warn(`[startup] ${message}`);
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.warn(
      "[startup] ENCRYPTION_KEY is not set — user API key storage (BYOK) is disabled. " +
        "Generate one with: openssl rand -hex 32",
    );
  } else if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    console.warn(
      "[startup] ENCRYPTION_KEY is malformed (expected 64 hex chars) — treated as unset; " +
        "user API key storage (BYOK) is disabled.",
    );
  }
}

validate();
