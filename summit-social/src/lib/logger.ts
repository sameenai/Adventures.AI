const isProd = process.env.NODE_ENV === "production";

type LogLevel = "info" | "warn" | "error";

// Secrets and PII must never reach Cloud Logging. Call sites often pass
// third-party error objects whose shapes this codebase does not control
// (OpenAI/Stripe/flight SDK rejections can embed request URLs, headers or
// response bodies), so every logged value is scrubbed, not just our own.
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{8,}/g, // OpenAI-style API keys
  /sk_(?:live|test)_[A-Za-z0-9]{8,}/g, // Stripe secret keys
  /whsec_[A-Za-z0-9]{8,}/g, // Stripe webhook secrets
  /Bearer\s+[A-Za-z0-9._~+/-]{8,}=*/gi, // Authorization headers
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // email addresses
];

const SENSITIVE_KEYS = /^(authorization|apikey|api_key|openaiapikey|token|secret|password)$/i;

const MAX_STRING_LENGTH = 2_000;
const MAX_DEPTH = 4;

function scrubString(value: string): string {
  let out = value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}

export function scrub(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return { name: value.name, message: scrubString(value.message), stack: scrubStack(value) };
  }
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.test(key) ? "[REDACTED]" : scrub(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

function scrubStack(err: Error): string | undefined {
  if (!err.stack) return undefined;
  // Top frames identify the failure; deep frames just bloat log lines.
  return scrubString(err.stack.split("\n").slice(0, 8).join("\n"));
}

function serialize(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  try {
    return JSON.stringify(scrub(data));
  } catch {
    return scrubString(String(data));
  }
}

function log(level: LogLevel, message: string, data?: unknown) {
  if (isProd) {
    const entry: Record<string, unknown> = {
      severity: level.toUpperCase(),
      message: scrubString(message),
      timestamp: new Date().toISOString(),
    };
    if (data !== undefined) {
      entry.data = scrub(data);
    }
    console[level](JSON.stringify(entry));
  } else {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    const extra = serialize(data);
    console[level](extra ? `${prefix} ${message} ${extra}` : `${prefix} ${message}`);
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
