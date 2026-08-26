#!/usr/bin/env node
// Bundle budget gate — run after `next build`.
//
// Reads .next/app-build-manifest.json, sums the on-disk size of each route's
// client JS chunks plus the shared baseline (chunks every route loads), and
// compares them against the checked-in bundle-budget.json. Fails naming the
// offending route and the delta, so client-weight regressions surface in CI
// instead of in production waterfalls.
//
// Re-baseline (current measurements + 10% headroom, 8 heaviest routes):
//   node scripts/check-bundle-budget.mjs --update
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = join(appDir, ".next");
const budgetPath = join(appDir, "bundle-budget.json");

const HEADROOM = 1.1;
const TRACKED_ROUTES = 8;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(path, missingMessage) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fail(missingMessage);
  }
}

const manifest = readJson(
  join(nextDir, "app-build-manifest.json"),
  "bundle-budget: .next/app-build-manifest.json not found — run `npm run build` first.",
);

/** "/(dashboard)/adventures/page" → "/adventures"; "/page" → "/". */
function routeName(entry) {
  const route = entry.replace(/\/page$/, "").replaceAll(/\/\([^)]+\)/g, "");
  return route === "" ? "/" : route;
}

const sizeCache = new Map();
function sizeOf(file) {
  if (!sizeCache.has(file)) {
    let bytes = 0;
    try {
      bytes = statSync(join(nextDir, file)).size;
    } catch {
      // A manifest entry without a file on disk contributes nothing.
    }
    sizeCache.set(file, bytes);
  }
  return sizeCache.get(file);
}

const jsChunks = (files) => [...new Set(files.filter((file) => file.endsWith(".js")))];
const sumBytes = (files) => files.reduce((sum, file) => sum + sizeOf(file), 0);
const toKB = (bytes) => Math.ceil(bytes / 1024);

// Only real page entries count — the manifest also lists layouts, error
// boundaries, and API `/route` handlers, which ship no page-level client JS.
const entries = Object.entries(manifest.pages ?? {}).filter(([entry]) => entry.endsWith("/page"));
if (entries.length === 0) fail("bundle-budget: app-build-manifest.json lists no pages.");

// Shared baseline: client chunks that every route loads.
let shared = null;
for (const [, files] of entries) {
  const chunkSet = new Set(jsChunks(files));
  shared = shared === null ? chunkSet : new Set([...shared].filter((file) => chunkSet.has(file)));
}
const sharedKB = toKB(sumBytes([...(shared ?? [])]));

// Total client JS per route (shared chunks included). Parallel route entries
// that normalise to the same path keep the heaviest measurement.
const routeKB = new Map();
for (const [entry, files] of entries) {
  const route = routeName(entry);
  const kb = toKB(sumBytes(jsChunks(files)));
  routeKB.set(route, Math.max(routeKB.get(route) ?? 0, kb));
}

if (process.argv.includes("--update")) {
  const heaviest = [...routeKB.entries()].sort((a, b) => b[1] - a[1]).slice(0, TRACKED_ROUTES);
  const budget = {
    sharedKB: Math.ceil(sharedKB * HEADROOM),
    routes: Object.fromEntries(heaviest.map(([route, kb]) => [route, Math.ceil(kb * HEADROOM)])),
  };
  writeFileSync(budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
  console.log(`bundle-budget: wrote ${budgetPath} (measured + 10% headroom).`);
  process.exit(0);
}

const budget = readJson(
  budgetPath,
  "bundle-budget: bundle-budget.json not found — baseline with `node scripts/check-bundle-budget.mjs --update` after a build.",
);

const failures = [];
if (sharedKB > budget.sharedKB) {
  failures.push(
    `shared client JS is ${sharedKB} KB — budget ${budget.sharedKB} KB (+${sharedKB - budget.sharedKB} KB)`,
  );
}
for (const [route, budgetedKB] of Object.entries(budget.routes ?? {})) {
  const measuredKB = routeKB.get(route);
  if (measuredKB === undefined) {
    console.warn(`bundle-budget: tracked route ${route} not in this build — re-baseline?`);
    continue;
  }
  if (measuredKB > budgetedKB) {
    failures.push(
      `${route} ships ${measuredKB} KB of client JS — budget ${budgetedKB} KB (+${measuredKB - budgetedKB} KB)`,
    );
  }
}

if (failures.length > 0) {
  console.error("bundle-budget: FAILED");
  for (const line of failures) console.error(`  ✗ ${line}`);
  console.error(
    "Trim the offending route (dynamic imports, lighter deps) or, if the growth is justified, " +
      "re-baseline with `node scripts/check-bundle-budget.mjs --update` and commit bundle-budget.json.",
  );
  process.exit(1);
}

console.log(
  `bundle-budget: OK — shared ${sharedKB}/${budget.sharedKB} KB, ` +
    `${Object.keys(budget.routes ?? {}).length} tracked routes within budget.`,
);
