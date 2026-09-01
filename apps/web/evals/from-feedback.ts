/**
 * Production feedback → eval candidates.
 *
 * Selects thumbs-DOWN MessageFeedback rows not yet exported (exportedAt IS
 * NULL), shapes each conversation snapshot into an EvalTranscript-shaped
 * scaffold (see feedback-transcript.ts), writes it to
 * evals/transcripts/candidates/feedback-<id>.json, and stamps the row
 * exportedAt so the next run only picks up new complaints.
 *
 * Candidates are TRIAGE INPUT, deliberately not loaded by `npm run eval`
 * (run.ts reads only golden/ and adversarial/). Review each one: a genuinely
 * bad reply becomes an adversarial transcript with expectedFailures; a good
 * reply the user misjudged can be promoted into golden/ under a real caseId.
 * Snapshots contain user conversation text — scrub before committing anything.
 *
 * Usage: npm run eval:candidates   (or: npx tsx evals/from-feedback.ts)
 * Requires DATABASE_URL — this connects to the real database.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db/prisma";
import { feedbackToCandidateTranscript } from "./feedback-transcript";

const CANDIDATES_DIR = join(__dirname, "transcripts", "candidates");

async function main(): Promise<void> {
  const rows = await prisma.messageFeedback.findMany({
    where: { rating: "DOWN", exportedAt: null },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) {
    console.log("No unexported thumbs-down feedback — nothing to do.");
    return;
  }

  mkdirSync(CANDIDATES_DIR, { recursive: true });
  for (const row of rows) {
    const candidate = feedbackToCandidateTranscript(row);
    const fileName = `feedback-${row.id}.json`;
    writeFileSync(join(CANDIDATES_DIR, fileName), `${JSON.stringify(candidate, null, 2)}\n`);
    // Stamp AFTER the file exists: a crash mid-run leaves unwritten rows
    // unexported, so the next run picks them up again.
    await prisma.messageFeedback.update({
      where: { id: row.id },
      data: { exportedAt: new Date() },
    });
    console.log(
      `✓ evals/transcripts/candidates/${fileName}` +
        `${row.comment ? ` — "${row.comment}"` : " (no comment)"}`,
    );
  }

  console.log(
    [
      "",
      `${rows.length} candidate(s) written. Triage each one:`,
      "  - bad reply confirmed → craft an adversarial transcript with expectedFailures",
      "  - reply was fine      → consider promoting into transcripts/golden/ under a real caseId",
      "Candidates are never loaded by the replay run and may contain user text — scrub before committing.",
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
