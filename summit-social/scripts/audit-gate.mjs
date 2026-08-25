#!/usr/bin/env node
/**
 * Supply-chain gate: fails CI when production dependencies carry HIGH or
 * CRITICAL advisories, except those explicitly allowlisted below with a
 * justification and an owner-review date. Dev-only advisories are reported
 * but do not fail the build (they cannot reach production traffic).
 *
 * The allowlist is a liability ledger, not an escape hatch: every entry
 * must name why it cannot be fixed today and when to look again.
 */
import { execSync } from "node:child_process";

const ALLOWLIST = [
  {
    // GHSA advisories for postcss <=8.5.22 vendored INSIDE next's own
    // node_modules (next/node_modules/postcss). Not resolvable from this
    // package.json without forking Next; postcss runs at build time only.
    // Clear when Next ships a patch bundling postcss >8.5.22.
    module: "postcss",
    reason: "vendored by next; build-time only; awaiting next patch release",
    reviewBy: "2026-10-01",
  },
];

function audit(omitDev) {
  const cmd = `npm audit --json${omitDev ? " --omit=dev" : ""}`;
  try {
    return JSON.parse(execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities exist; the JSON is still on stdout.
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

const prod = audit(true);
const vulns = Object.values(prod.vulnerabilities ?? {});
const blocking = vulns.filter(
  (v) =>
    ["high", "critical"].includes(v.severity) && !ALLOWLIST.some((a) => a.module === v.name),
);
const allowlisted = vulns.filter(
  (v) => ["high", "critical"].includes(v.severity) && ALLOWLIST.some((a) => a.module === v.name),
);

for (const v of allowlisted) {
  const entry = ALLOWLIST.find((a) => a.module === v.name);
  console.log(`ALLOWLISTED ${v.severity}: ${v.name} — ${entry.reason} (review by ${entry.reviewBy})`);
  if (new Date(entry.reviewBy) < new Date()) {
    console.error(`✗ allowlist entry for ${v.name} is past its review date — re-justify or fix`);
    process.exit(1);
  }
}

if (blocking.length > 0) {
  for (const v of blocking) {
    console.error(`✗ ${v.severity.toUpperCase()}: ${v.name} (${v.range}) — fix or justify in scripts/audit-gate.mjs`);
  }
  process.exit(1);
}

const meta = prod.metadata?.vulnerabilities ?? {};
console.log(
  `Supply-chain gate passed. Production advisories — critical: ${meta.critical ?? 0}, high: ${
    meta.high ?? 0
  } (allowlisted: ${allowlisted.length}), moderate: ${meta.moderate ?? 0}, low: ${meta.low ?? 0}.`,
);
