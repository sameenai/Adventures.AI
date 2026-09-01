#!/usr/bin/env node
/**
 * The CSP script nonce is minted per request in middleware and stamped by
 * Next during SSR — a statically prerendered document would ship nonce-less
 * scripts that the production strict-dynamic policy blocks entirely (the
 * page's JS simply never runs; login/signup would be dead). The root layout
 * therefore forces dynamic rendering, and THIS gate fails the build if any
 * document route slips back into the prerender manifest.
 *
 * Run after `next build` (CI build job does).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Scriptless metadata routes are safe to prerender — they carry no <script>.
const SCRIPTLESS = [/^\/robots\.txt$/, /^\/sitemap(?:-\d+)?\.xml$/, /^\/favicon\.ico$/, /opengraph-image/, /twitter-image/, /^\/manifest\.webmanifest$/];

const manifestPath = resolve(process.cwd(), ".next/prerender-manifest.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  console.error("check-csp-prerender: cannot read .next/prerender-manifest.json — run `next build` first.");
  process.exit(1);
}

const offenders = Object.keys(manifest.routes ?? {}).filter(
  (route) => !SCRIPTLESS.some((re) => re.test(route)),
);

if (offenders.length > 0) {
  console.error(
    "check-csp-prerender: FAIL — these routes are statically prerendered, so their scripts",
  );
  console.error(
    "carry no CSP nonce and the strict-dynamic policy will block ALL their JavaScript in production:",
  );
  for (const r of offenders) console.error(`  - ${r}`);
  console.error(
    "\nA page opts out of the root layout's force-dynamic only by exporting its own `dynamic`",
  );
  console.error("segment config — remove that, or extend middleware with a fallback policy first.");
  process.exit(1);
}

console.log("check-csp-prerender: OK — no document route is statically prerendered.");
