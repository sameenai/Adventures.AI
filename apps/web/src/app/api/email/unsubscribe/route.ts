import { prisma } from "@/lib/db/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * One-tap unsubscribe from marketing email. GET because it must work from a
 * plain email link with no session; the token authorises exactly this action
 * for exactly this user. Always redirects to the confirmation page — an
 * invalid token shows the same page with an error, never a JSON wall.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const userId = token ? verifyUnsubscribeToken(token) : null;
  if (!userId) {
    return NextResponse.redirect(`${base}/unsubscribed?status=invalid`);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { marketingConsent: false },
    });
  } catch (err) {
    // Deleted account: the address is gone from our systems anyway.
    logger.warn("unsubscribe for unknown user", err);
  }

  return NextResponse.redirect(`${base}/unsubscribed?status=done`);
}
