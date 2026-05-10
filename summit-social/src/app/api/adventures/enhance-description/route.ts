import { openai } from "@/lib/ai/openai";
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

  const { title, description, location, category, difficulty, highlights } = parsed.data;

  const prompt = `You are a passionate adventure travel writer. Rewrite the following adventure description to be compelling, vivid, and inspiring while keeping all factual content accurate.

Adventure: ${title}
Location: ${location}
Category: ${category.replace(/_/g, " ")}
Difficulty: ${difficulty.toLowerCase()}
${highlights.length > 0 ? `Highlights: ${highlights.join(", ")}` : ""}

Current description:
${description}

Write an improved description (150–400 words). Be evocative and specific. Do not add information that wasn't implied by the original. Output only the improved description text, no headings or metadata.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });
    const enhanced = response.choices[0]?.message?.content?.trim() ?? description;
    return NextResponse.json({ enhanced });
  } catch (err) {
    logger.error("OpenAI enhance-description failed", err);
    return NextResponse.json({ enhanced: description });
  }
}
