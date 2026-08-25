import { createHash } from "node:crypto";
import { getClientIp } from "@/lib/request";
import type { NextRequest } from "next/server";

/**
 * Privacy-preserving visitor identity, shared by view counting and product
 * analytics. Nothing is stored on the visitor's device (PECR: no consent
 * banner needed). Signed-in activity keys on the user id; anonymous activity
 * keys on a salted hash of network data that rotates daily, so anonymous
 * behaviour cannot be reassembled across days.
 */
export function viewerKey(request: NextRequest, userId: string | undefined | null): string {
  if (userId) return `user:${userId}`;
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.NEXTAUTH_SECRET ?? "dev-salt";
  const ua = request.headers.get("user-agent") ?? "";
  const digest = createHash("sha256")
    .update(`${salt}:${day}:${getClientIp(request)}:${ua}`)
    .digest("hex");
  return `anon:${digest.slice(0, 32)}`;
}
