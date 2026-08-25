/**
 * Server-side environment variable validation.
 * Imported once from the root layout — never runs in the browser or tests.
 * In production, throws immediately on startup if required vars are missing
 * or malformed. In development, logs a warning so the dev server still starts.
 */
import { z } from "zod";

const PLACEHOLDER_VALUES = new Set(["placeholder", "", "changeme", "todo", "none", "xxx"]);

function isPlaceholder(v: unknown): boolean {
  return typeof v !== "string" || PLACEHOLDER_VALUES.has(v.toLowerCase());
}

function secretWithPrefix(prefix: string) {
  return z
    .string()
    .optional()
    .refine((v) => !v || isPlaceholder(v) || v.startsWith(prefix), {
      message: `must start with "${prefix}"`,
    });
}

function secretWithPattern(pattern: RegExp, message: string) {
  return z
    .string()
    .optional()
    .refine((v) => !v || isPlaceholder(v) || pattern.test(v), { message });
}

// Required everywhere the server runs.
const required = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
});

// Optional, but validated for shape when present so a typo fails loudly at
// boot instead of surfacing as a confusing runtime error mid-request.
// Placeholder values ("placeholder", "", "changeme") are treated as unset.
const optional = z.object({
  REDIS_URL: secretWithPrefix("redis"),
  OPENAI_API_KEY: secretWithPrefix("sk-"),
  ENCRYPTION_KEY: secretWithPattern(
    /^[0-9a-fA-F]{64}$/,
    "expected 64 hex chars (openssl rand -hex 32)",
  ),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: secretWithPrefix("sk_"),
  STRIPE_WEBHOOK_SECRET: secretWithPrefix("whsec_"),
  STRIPE_PRO_PRICE_ID: secretWithPrefix("price_"),
  AMADEUS_CLIENT_ID: z.string().optional(),
  AMADEUS_CLIENT_SECRET: z.string().optional(),
  AMADEUS_BASE_URL: z.string().url().optional(),
  SKYSCANNER_API_KEY: z.string().optional(),
  SKYSCANNER_BASE_URL: z.string().url().optional(),
  SKYSCANNER_AFFILIATE_ID: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  JOBS_SECRET: z.string().min(16).optional(),
  ENABLE_DEV_LOGIN: z.enum(["true", "false"]).optional(),
});

// Capabilities a production deployment almost certainly wants; their absence
// degrades the product (demo AI, no BYOK, no billing) rather than breaking it,
// so warn loudly instead of refusing to boot.
const PRODUCTION_RECOMMENDED = [
  "REDIS_URL",
  "OPENAI_API_KEY",
  "ENCRYPTION_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

function report(problem: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(problem);
  }
  console.warn(`[startup] ${problem}`);
}

function validate() {
  // Skip during `next build` — env vars are injected at runtime by Cloud Run
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const requiredResult = required.safeParse(process.env);
  if (!requiredResult.success) {
    const missing = requiredResult.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    report(
      `Missing/invalid required environment variables:\n${missing}\nSee .env.example for the full list.`,
    );
  }

  const optionalResult = optional.safeParse(process.env);
  if (!optionalResult.success) {
    const bad = optionalResult.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    report(`Malformed optional environment variables:\n${bad}`);
  }

  if (process.env.NODE_ENV === "production") {
    const absent = PRODUCTION_RECOMMENDED.filter((name) => !process.env[name]);
    if (absent.length > 0) {
      console.warn(
        `[startup] Production is running without: ${absent.join(", ")} — AI, BYOK key storage, billing and/or rate limiting are degraded.`,
      );
    }
  }
}

validate();
