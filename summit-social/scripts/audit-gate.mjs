#!/usr/bin/env node
/**
 * Supply-chain gate: fails CI when production dependencies carry HIGH or
 * CRITICAL advisories, except those explicitly allowlisted below. The audit
 * always runs with `--omit=dev`, so dev-only dependency trees are never
 * inspected here — this gate is about what can reach production traffic.
 *
 * The allowlist is a liability ledger, not an escape hatch: every entry must
 * pin the exact GHSA advisory ids it accepts, name why they cannot be fixed
 * today, and say when to look again. Pinning by advisory id (never by bare
 * package name) means a NEW advisory against an allowlisted package still
 * fails the gate until someone reviews and pins it deliberately.
 */
import { execSync } from "node:child_process";

const ALLOWLIST = [
  {
    // GHSA advisories for postcss <=8.5.22 vendored INSIDE next's own
    // node_modules (next/node_modules/postcss). Not resolvable from this
    // package.json without forking Next; postcss runs at build time only.
    // Clear when Next ships a patch bundling postcss >8.5.22.
    module: "postcss",
    advisories: [
      "GHSA-qx2v-qp2m-jg93", // XSS via unescaped </style> in stringify output
      "GHSA-6g55-p6wh-862q", // arbitrary file read via attacker-controlled sourceMappingURL
      "GHSA-fxqj-rqcc-2cmp", // incomplete fix of GHSA-6g55-p6wh-862q
      "GHSA-r28c-9q8g-f849", // path traversal in source-map auto-loading
    ],
    reason: "vendored by next; build-time only; awaiting next patch release",
    reviewBy: "2026-10-01",
  },
];

function audit() {
  try {
    return JSON.parse(
      execSync("npm audit --json --omit=dev", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities exist; the JSON is still on stdout.
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

/** GHSA ids named by a vulnerability's `via` entries (transitive string refs carry none). */
function advisoryIds(vuln) {
  const ids = new Set();
  for (const via of vuln.via ?? []) {
    if (typeof via !== "object" || via === null) continue;
    const match = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i.exec(via.url ?? "");
    if (match) ids.add(match[0]);
  }
  return [...ids];
}

/**
 * A vulnerability is allowlisted only when an entry for its package pins
 * EVERY advisory id npm currently reports for it. Anything less — no entry,
 * an entry without pins, an unpinned or brand-new advisory, or a
 * transitive-only vulnerability with no advisory ids to match — blocks.
 * Returns null when allowlisted, otherwise the reason it blocks.
 */
function blockReason(vuln) {
  const entry = ALLOWLIST.find((a) => a.module === vuln.name);
  if (!entry) return "fix or justify in scripts/audit-gate.mjs";
  if (!Array.isArray(entry.advisories) || entry.advisories.length === 0) {
    return "allowlist entry has no pinned advisory ids — name-only matching is not accepted; pin the GHSA ids";
  }
  const ids = advisoryIds(vuln);
  if (ids.length === 0) {
    return "no GHSA advisory ids to match against the allowlist pins — cannot verify, treating as unallowlisted";
  }
  const unpinned = ids.filter((id) => !entry.advisories.includes(id));
  if (unpinned.length > 0) {
    return `advisory ids not pinned in the allowlist: ${unpinned.join(", ")} — review and pin deliberately`;
  }
  return null;
}

const prod = audit();
const vulns = Object.values(prod.vulnerabilities ?? {}).filter((v) =>
  ["high", "critical"].includes(v.severity),
);
const blocking = [];
const allowlisted = [];
for (const v of vulns) {
  const reason = blockReason(v);
  if (reason === null) allowlisted.push(v);
  else blocking.push({ vuln: v, reason });
}

for (const v of allowlisted) {
  const entry = ALLOWLIST.find((a) => a.module === v.name);
  console.log(
    `ALLOWLISTED ${v.severity}: ${v.name} [${advisoryIds(v).join(", ")}] — ${entry.reason} (review by ${entry.reviewBy})`,
  );
  if (new Date(entry.reviewBy) < new Date()) {
    console.error(`✗ allowlist entry for ${v.name} is past its review date — re-justify or fix`);
    process.exit(1);
  }
}

if (blocking.length > 0) {
  for (const { vuln, reason } of blocking) {
    console.error(`✗ ${vuln.severity.toUpperCase()}: ${vuln.name} (${vuln.range}) — ${reason}`);
  }
  process.exit(1);
}

const meta = prod.metadata?.vulnerabilities ?? {};
console.log(
  `Supply-chain gate passed. Production advisories — critical: ${meta.critical ?? 0}, high: ${
    meta.high ?? 0
  } (allowlisted: ${allowlisted.length}), moderate: ${meta.moderate ?? 0}, low: ${meta.low ?? 0}.`,
);
