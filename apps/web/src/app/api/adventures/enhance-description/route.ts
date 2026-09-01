import { CHAT_MODEL } from "@/lib/ai/model";
import { getOpenAI } from "@/lib/ai/openai";
import { buildEnhanceDescriptionPrompt } from "@/lib/ai/prompts";
import { withApi } from "@/lib/api/handler";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";

const enhanceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  location: z.string().min(1).max(200),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  highlights: z.array(z.string()).max(20).default([]),
});

export const POST = withApi(
  {
    rateLimit: { name: "adventureCreate", prefix: "enhance", failClosed: true },
    schema: enhanceSchema,
  },
  async ({ body }) => {
    const { description } = body;
    const prompt = buildEnhanceDescriptionPrompt(body);

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
  },
);
