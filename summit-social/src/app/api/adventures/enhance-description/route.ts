import { CHAT_MODEL } from "@/lib/ai/model";
import { getOpenAI } from "@/lib/ai/openai";
import { buildEnhanceDescriptionPrompt } from "@/lib/ai/prompts";
import { authOptions } from "@/lib/auth/config";
import { RATE_LIMITS } from "@/lib/constants";
import { rateLimit } from "@/lib/db/redis";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const enhanceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  location: z.string().min(1).max(200),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  highlights: z.array(z.string()).max(20).default([]),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { allowed, retryAfter } = await rateLimit(
    `enhance:${session.user.id}`,
    RATE_LIMITS.adventureCreate.limit,
    RATE_LIMITS.adventureCreate.windowSeconds,
    { failClosed: true },
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = enhanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { description } = parsed.data;
  const prompt = buildEnhanceDescriptionPrompt(parsed.data);

  try {
    const response = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });
    const enhanced = response.choices[0]?.message?.content?.trim() ?? description;
    return NextResponse.json({ enhanced });
  } catch (err) {
    logger.error("OpenAI enhance-description failed", err);
    return NextResponse.json(
      { enhanced: description, warning: "AI enhancement unavailable — original returned" },
      { status: 200 },
    );
  }
}
