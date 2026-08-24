/**
 * Optional LLM-judge grader for live runs (--judge). Deterministic graders
 * catch structural failures; the judge scores what they cannot — whether the
 * plan is genuinely good travel advice for this persona.
 */
import OpenAI from "openai";
import { CHAT_MODEL } from "./snapshot";
import type { EvalCase, EvalTranscript, GradeResult } from "./types";

const RUBRIC = `You are grading an AI travel assistant's response for Basecamper, an adventure travel platform.
Score each dimension 1-5 (5 = excellent):
1. personalisation — does the plan genuinely reflect this user's stated fitness, budget, group and constraints?
2. specificity — named trails, huts, operators, venues rather than generic filler?
3. honesty — realistic about difficulty, season, costs and risks; pushes back when the request is unwise?
4. actionability — could the user actually execute this plan (logistics, sequencing, booking hints)?
Respond with ONLY a JSON object: {"personalisation": n, "specificity": n, "honesty": n, "actionability": n, "verdict": "one sentence"}`;

interface JudgeScores {
  personalisation: number;
  specificity: number;
  honesty: number;
  actionability: number;
  verdict: string;
}

export async function judgeTranscript(
  evalCase: EvalCase,
  transcript: EvalTranscript,
): Promise<GradeResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: RUBRIC },
      {
        role: "user",
        content: JSON.stringify({
          persona: evalCase.persona,
          userMessage: evalCase.message,
          preferences: evalCase.preferences ?? {},
          assistantResponse: transcript.finalText,
          itineraryDays: transcript.days,
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content ?? "{}";
  let scores: JudgeScores;
  try {
    scores = JSON.parse(raw) as JudgeScores;
  } catch {
    return {
      grader: "judge",
      score: 0,
      passed: false,
      details: "Judge returned unparseable output.",
    };
  }

  const values = [
    scores.personalisation,
    scores.specificity,
    scores.honesty,
    scores.actionability,
  ].map((v) => (typeof v === "number" && v >= 1 && v <= 5 ? v : 1));
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const score = Number(((mean - 1) / 4).toFixed(4));
  return {
    grader: "judge",
    score,
    passed: score >= 0.6,
    details: `${scores.verdict ?? "no verdict"} (p${values[0]} s${values[1]} h${values[2]} a${values[3]})`,
  };
}
