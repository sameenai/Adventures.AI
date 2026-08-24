import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/db/redis";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const saveKeySchema = z.object({
  key: z
    .string()
    .min(20, "Key is too short")
    .max(200, "Key is too long")
    .regex(/^sk-/, "Must be a valid OpenAI API key starting with sk-"),
});

/** Returns whether the current user has a key saved (never returns the key itself). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openAiApiKey: true },
  });

  const stored = user?.openAiApiKey;
  if (!stored) {
    return NextResponse.json({ hasKey: false, hint: null });
  }

  const raw = decrypt(stored);
  const hint = raw?.startsWith("sk-") ? `${raw.slice(0, 7)}…${raw.slice(-4)}` : "sk-…****";
  return NextResponse.json({ hasKey: true, hint });
}

/** Saves or replaces the user's OpenAI API key (encrypted at rest). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `api-key:${session.user.id}`,
    RATE_LIMITS.apiKeyUpdate.limit,
    RATE_LIMITS.apiKeyUpdate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const parsed = saveKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid key", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const key = parsed.data.key;
  const encrypted = encrypt(key);
  if (!encrypted) {
    // Fail closed: never store a user's API key as plaintext.
    return NextResponse.json(
      {
        error: "Key storage is not available: server-side encryption is not configured",
        code: "ENCRYPTION_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { openAiApiKey: encrypted },
  });

  return NextResponse.json({
    hasKey: true,
    hint: `${key.slice(0, 7)}…${key.slice(-4)}`,
  });
}

/** Removes the user's stored OpenAI API key. */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rl = await rateLimit(
    `api-key:${session.user.id}`,
    RATE_LIMITS.apiKeyUpdate.limit,
    RATE_LIMITS.apiKeyUpdate.windowSeconds,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { openAiApiKey: null },
  });

  return NextResponse.json({ hasKey: false, hint: null });
}
