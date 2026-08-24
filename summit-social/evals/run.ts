/**
 * Basecamper AI eval harness runner.
 *
 * Modes:
 *   npm run eval                 — replay mode (default): re-grades the committed
 *     golden + adversarial transcripts with the current graders and gates on
 *     baseline.json. Fully offline and deterministic — safe for CI.
 *   npm run eval:live            — live mode: runs the golden dataset against the
 *     real OpenAI model using the exact production prompt + tools, records
 *     transcripts under evals/results/, and prints a scorecard.
 *
 * Flags:
 *   --update-baseline   rewrite evals/baseline.json from this replay run
 *   --update-snapshot   accept a changed AI surface (prompt/tools/model) hash
 *   --case <id>         run a single case
 *   --judge             (live only) add the LLM-judge grader
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gradeCase } from "./graders/index";
import { judgeTranscript } from "./judge";
import { runLiveCase } from "./live";
import { computePromptSnapshotHash } from "./snapshot";
import type { Baseline, CaseResult, EvalCase, EvalTranscript, Scorecard } from "./types";

const EVALS_DIR = __dirname;
const CASES_PATH = join(EVALS_DIR, "datasets", "itinerary-cases.json");
const SNAPSHOT_PATH = join(EVALS_DIR, "prompt-snapshot.json");
const BASELINE_PATH = join(EVALS_DIR, "baseline.json");
const RESULTS_DIR = join(EVALS_DIR, "results");

/** Replay score drops beyond this against baseline fail the run. */
const REGRESSION_TOLERANCE = 0.005;

interface CliArgs {
  mode: "replay" | "live";
  updateBaseline: boolean;
  updateSnapshot: boolean;
  caseFilter?: string;
  judge: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    mode: "replay",
    updateBaseline: false,
    updateSnapshot: false,
    judge: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mode") args.mode = argv[++i] === "live" ? "live" : "replay";
    else if (arg === "--update-baseline") args.updateBaseline = true;
    else if (arg === "--update-snapshot") args.updateSnapshot = true;
    else if (arg === "--case") args.caseFilter = argv[++i];
    else if (arg === "--judge") args.judge = true;
  }
  return args;
}

function loadCases(): EvalCase[] {
  return JSON.parse(readFileSync(CASES_PATH, "utf8")) as EvalCase[];
}

function loadTranscripts(dir: string): Array<{ name: string; transcript: EvalTranscript }> {
  const full = join(EVALS_DIR, "transcripts", dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({
      name: `${dir}/${f}`,
      transcript: JSON.parse(readFileSync(join(full, f), "utf8")) as EvalTranscript,
    }));
}

function checkSnapshot(updateSnapshot: boolean): string {
  const currentHash = computePromptSnapshotHash();
  if (!existsSync(SNAPSHOT_PATH) || updateSnapshot) {
    writeFileSync(
      SNAPSHOT_PATH,
      `${JSON.stringify({ hash: currentHash, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    );
    console.log(
      `Prompt snapshot ${updateSnapshot ? "updated" : "initialised"}: ${currentHash.slice(0, 12)}…`,
    );
    return currentHash;
  }
  const stored = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as { hash: string };
  if (stored.hash !== currentHash) {
    console.error(
      [
        "✗ AI surface changed: the system prompt, tool definitions or model differ from the",
        "  snapshot the committed transcripts were recorded against.",
        "",
        "  The replay baseline no longer reflects production behaviour. To re-certify:",
        "    1. OPENAI_API_KEY=… npm run eval:live       # record fresh transcripts + scorecard",
        "    2. Review the live scorecard for regressions caused by your prompt/tool change.",
        "    3. npm run eval -- --update-snapshot        # accept the new surface hash",
      ].join("\n"),
    );
    process.exit(1);
  }
  return currentHash;
}

function printScorecard(results: CaseResult[]): void {
  console.log("");
  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    console.log(`${icon} ${r.caseId.padEnd(32)} ${r.score.toFixed(3)}  [${r.transcript}]`);
    for (const g of r.grades) {
      if (!g.passed) console.log(`    ✗ ${g.grader}: ${g.details}`);
    }
  }
  console.log("");
}

function aggregate(results: CaseResult[]): number {
  if (results.length === 0) return 0;
  return Number((results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(4));
}

function writeResults(scorecard: Scorecard): void {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const path = join(RESULTS_DIR, `latest-${scorecard.mode}.json`);
  writeFileSync(path, `${JSON.stringify(scorecard, null, 2)}\n`);
  console.log(`Scorecard written to evals/results/latest-${scorecard.mode}.json`);
}

async function replay(args: CliArgs, hash: string): Promise<void> {
  const cases = loadCases();
  const byId = new Map(cases.map((c) => [c.id, c]));
  let failed = false;

  // 1. Golden transcripts: known-good exchanges must keep passing.
  const golden = loadTranscripts("golden").filter(
    (t) => !args.caseFilter || t.transcript.caseId === args.caseFilter,
  );
  const results: CaseResult[] = [];
  for (const { name, transcript } of golden) {
    const evalCase = byId.get(transcript.caseId);
    if (!evalCase) {
      console.error(`✗ ${name}: unknown caseId "${transcript.caseId}"`);
      failed = true;
      continue;
    }
    const result = gradeCase(evalCase, transcript, name);
    results.push(result);
    if (!result.passed) failed = true;
  }

  // 2. Adversarial transcripts: deliberately flawed outputs must be CAUGHT.
  //    This proves the graders have teeth — a grader change that stops
  //    detecting duplicate days or teleporting fails here.
  const adversarial = loadTranscripts("adversarial").filter(
    (t) => !args.caseFilter || t.transcript.caseId === args.caseFilter,
  );
  for (const { name, transcript } of adversarial) {
    const evalCase = byId.get(transcript.caseId);
    if (!evalCase) {
      console.error(`✗ ${name}: unknown caseId "${transcript.caseId}"`);
      failed = true;
      continue;
    }
    const result = gradeCase(evalCase, transcript, name);
    const expected = new Set(transcript.expectedFailures ?? []);
    for (const graderName of expected) {
      const grade = result.grades.find((g) => g.grader === graderName);
      if (!grade) {
        console.error(`✗ ${name}: expected failure in "${graderName}" but grader did not run`);
        failed = true;
      } else if (grade.passed) {
        console.error(
          `✗ ${name}: grader "${graderName}" PASSED a transcript it must reject — the harness lost its teeth`,
        );
        failed = true;
      }
    }
    for (const g of result.grades) {
      if (!g.passed && !expected.has(g.grader)) {
        console.error(`✗ ${name}: unexpected failure in "${g.grader}": ${g.details}`);
        failed = true;
      }
    }
  }
  console.log(
    `Adversarial teeth-check: ${adversarial.length} flawed transcripts, all expected detections ${failed ? "NOT " : ""}confirmed.`,
  );

  printScorecard(results);
  const aggregateScore = aggregate(results);
  console.log(`Aggregate (golden replay): ${aggregateScore.toFixed(4)}`);

  // 3. Baseline gate.
  if (existsSync(BASELINE_PATH) && !args.updateBaseline) {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
    if (!args.caseFilter && aggregateScore < baseline.aggregateScore - REGRESSION_TOLERANCE) {
      console.error(
        `✗ Aggregate regression: ${aggregateScore.toFixed(4)} < baseline ${baseline.aggregateScore.toFixed(4)}`,
      );
      failed = true;
    }
    for (const entry of baseline.cases) {
      const current = results.find((r) => r.transcript === entry.transcript);
      if (current && current.score < entry.score - REGRESSION_TOLERANCE) {
        console.error(
          `✗ Case regression ${entry.caseId}: ${current.score.toFixed(4)} < baseline ${entry.score.toFixed(4)}`,
        );
        failed = true;
      }
    }
  }

  if (args.updateBaseline && !args.caseFilter) {
    const baseline: Baseline = {
      promptSnapshotHash: hash,
      aggregateScore,
      updatedAt: new Date().toISOString(),
      cases: results.map((r) => ({ caseId: r.caseId, transcript: r.transcript, score: r.score })),
    };
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log("Baseline updated.");
  }

  writeResults({
    mode: "replay",
    generatedAt: new Date().toISOString(),
    promptSnapshotHash: hash,
    aggregateScore,
    cases: results,
  });

  if (failed) {
    console.error("\nEval replay FAILED.");
    process.exit(1);
  }
  console.log("\nEval replay passed.");
}

async function live(args: CliArgs, hash: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("✗ Live mode requires OPENAI_API_KEY.");
    process.exit(1);
  }
  const cases = loadCases().filter((c) => !args.caseFilter || c.id === args.caseFilter);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(RESULTS_DIR, `live-${stamp}`);
  mkdirSync(runDir, { recursive: true });

  const results: CaseResult[] = [];
  for (const evalCase of cases) {
    console.log(`→ ${evalCase.id}…`);
    try {
      const transcript = await runLiveCase(evalCase, { judge: args.judge });
      const file = `${evalCase.id}.json`;
      writeFileSync(join(runDir, file), `${JSON.stringify(transcript, null, 2)}\n`);
      const result = gradeCase(evalCase, transcript, `live/${file}`);
      if (args.judge) {
        const judgeGrade = await judgeTranscript(evalCase, transcript);
        result.grades.push(judgeGrade);
        result.score = Number(
          (result.grades.reduce((s, g) => s + g.score, 0) / result.grades.length).toFixed(4),
        );
        result.passed = result.grades.every((g) => g.passed);
      }
      results.push(result);
    } catch (error) {
      console.error(`  ✗ live run failed: ${error instanceof Error ? error.message : error}`);
      results.push({
        caseId: evalCase.id,
        transcript: "live/(errored)",
        source: "live",
        grades: [],
        score: 0,
        passed: false,
      });
    }
  }

  printScorecard(results);
  const aggregateScore = aggregate(results);
  console.log(`Aggregate (live): ${aggregateScore.toFixed(4)}`);
  console.log(`Transcripts recorded in evals/results/live-${stamp}/`);
  console.log(
    "Promote good transcripts into evals/transcripts/golden/ to extend the replay regression set.",
  );

  writeResults({
    mode: "live",
    generatedAt: new Date().toISOString(),
    promptSnapshotHash: hash,
    aggregateScore,
    cases: results,
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const hash = checkSnapshot(args.updateSnapshot);
  if (args.mode === "live") await live(args, hash);
  else await replay(args, hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
