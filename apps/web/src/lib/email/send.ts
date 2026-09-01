import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * Transactional email with a full audit trail. Provider is Resend over plain
 * HTTPS (no SDK dependency); when RESEND_API_KEY is unset every send is
 * recorded as SKIPPED so dev/preview environments never fail and the EmailLog
 * answers "why did nothing arrive".
 *
 * sendEmail never throws: a failed confirmation email must not fail the
 * payment webhook or the nightly job that triggered it.
 */

export interface SendEmailInput {
  to: string;
  userId?: string | null;
  template: string;
  subject: string;
  html: string;
  text: string;
  meta?: Record<string, unknown>;
}

export type SendEmailResult = { status: "SENT" | "FAILED" | "SKIPPED"; error?: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Basecamper <noreply@basecamper.ai>";
}

async function record(
  input: SendEmailInput,
  status: "SENT" | "FAILED" | "SKIPPED",
  providerId?: string,
  error?: string,
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        userId: input.userId ?? null,
        toEmail: input.to,
        template: input.template,
        subject: input.subject,
        status,
        providerId: providerId ?? null,
        error: error ?? null,
        meta: (input.meta ?? undefined) as never,
      },
    });
  } catch (err) {
    logger.error("EmailLog write failed", err);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info(`email skipped (no RESEND_API_KEY): ${input.template}`);
    await record(input, "SKIPPED", undefined, "RESEND_API_KEY not configured");
    return { status: "SKIPPED" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = `Resend ${response.status}: ${detail.slice(0, 300)}`;
      logger.error(`email send failed: ${input.template}`, error);
      await record(input, "FAILED", undefined, error);
      return { status: "FAILED", error };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    await record(input, "SENT", data.id);
    return { status: "SENT" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "unknown error";
    logger.error(`email send failed: ${input.template}`, err);
    await record(input, "FAILED", undefined, error);
    return { status: "FAILED", error };
  }
}
