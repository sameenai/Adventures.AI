import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One-tap unsubscribe tokens: HMAC-signed user ids, so the link in every
 * marketing email works without a session and without storing tokens.
 * Signed with NEXTAUTH_SECRET — rotating that secret invalidates old links,
 * which is acceptable (the preference toggle in settings always works).
 */

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required for unsubscribe tokens");
  return s;
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url");
}

export function unsubscribeToken(userId: string): string {
  return `${Buffer.from(userId).toString("base64url")}.${sign(userId)}`;
}

/** Returns the userId when the token verifies, null otherwise. */
export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  let userId: string;
  try {
    userId = Buffer.from(token.slice(0, dot), "base64url").toString();
  } catch {
    return null;
  }
  if (!userId) return null;
  const expected = Buffer.from(sign(userId));
  const provided = Buffer.from(token.slice(dot + 1));
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? userId : null;
}
