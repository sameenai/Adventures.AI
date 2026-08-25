import { withApi } from "@/lib/api/handler";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const saveKeySchema = z.object({
  key: z
    .string()
    .min(20, "Key is too short")
    .max(200, "Key is too long")
    .regex(/^sk-/, "Must be a valid OpenAI API key starting with sk-"),
});

/** Returns whether the current user has a key saved (never returns the key itself). */
export const GET = withApi({}, async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openAiApiKey: true, openAiApiKeyHint: true },
  });

  if (!user?.openAiApiKey) {
    return NextResponse.json({ hasKey: false, hint: null });
  }

  // The hint is precomputed at save time; the stored key is never decrypted
  // just to render a settings page. Legacy rows (saved before the hint
  // column existed) are backfilled once here.
  let hint = user.openAiApiKeyHint;
  if (!hint) {
    const raw = decrypt(user.openAiApiKey);
    hint = raw ? `sk-…${raw.slice(-4)}` : "sk-…????";
    await prisma.user.update({
      where: { id: userId },
      data: { openAiApiKeyHint: hint },
    });
  }
  return NextResponse.json({ hasKey: true, hint });
});

/** Saves or replaces the user's OpenAI API key (encrypted at rest). */
export const POST = withApi(
  { rateLimit: { name: "apiKeyUpdate", prefix: "api-key" } },
  async ({ request, userId }) => {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
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

    // Last-4 only: enough for the owner to recognise their key, minimal
    // identifying material if the hint ever leaks.
    const hint = `sk-…${key.slice(-4)}`;
    await prisma.user.update({
      where: { id: userId },
      data: { openAiApiKey: encrypted, openAiApiKeyHint: hint },
    });

    return NextResponse.json({ hasKey: true, hint });
  },
);

/** Removes the user's stored OpenAI API key. */
export const DELETE = withApi(
  { rateLimit: { name: "apiKeyUpdate", prefix: "api-key" } },
  async ({ userId }) => {
    await prisma.user.update({
      where: { id: userId },
      data: { openAiApiKey: null, openAiApiKeyHint: null },
    });

    return NextResponse.json({ hasKey: false, hint: null });
  },
);
