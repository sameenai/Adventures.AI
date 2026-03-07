import { NextResponse } from "next/server";

export async function GET() {
  // OAuth callback handler — NextAuth handles this via its own routes
  return NextResponse.json({ status: "ok" });
}
