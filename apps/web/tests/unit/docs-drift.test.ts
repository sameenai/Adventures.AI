// Docs stay true to the code, mechanically. This suite fails whenever an API
// route, Prisma model, chat tool, npm script, or env var exists that the
// READMEs (or the runbook, for ops-only concerns) don't mention — so "update
// the docs" happens in the same PR as the change, or the PR doesn't land.
// The fix for a failure here is a sentence of documentation, never a skip.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(__dirname, "../..");
// apps/web -> apps -> repo root. Two levels: this app is a workspace under
// apps/, and README.md/RUNBOOK.md sit at the root beside it.
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

const appReadme = readFileSync(join(APP_ROOT, "README.md"), "utf8");
const rootReadme = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
const runbook = readFileSync(join(REPO_ROOT, "RUNBOOK.md"), "utf8");
const appDocs = appReadme + runbook; // ops-only concerns may live in the runbook

function apiRoutePaths(): string[] {
  const base = join(APP_ROOT, "src/app/api");
  const found: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, `${rel}/${entry}`);
      } else if (entry === "route.ts") {
        found.push(`/api${rel}`);
      }
    }
  };
  walk(base, "");
  return found.sort();
}

function prismaModels(): string[] {
  const schema = readFileSync(join(APP_ROOT, "prisma/schema.prisma"), "utf8");
  return [...schema.matchAll(/^model (\w+)/gm)].map((m) => m[1]);
}

function chatToolNames(): string[] {
  const tools = readFileSync(join(APP_ROOT, "src/lib/ai/tools.ts"), "utf8");
  return [...tools.matchAll(/name: "(\w+)"/g)].map((m) => m[1]);
}

function npmScripts(): string[] {
  const pkg = JSON.parse(readFileSync(join(APP_ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  return Object.keys(pkg.scripts);
}

function envKeys(): string[] {
  const example = readFileSync(join(APP_ROOT, ".env.example"), "utf8");
  return [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
}

describe("docs drift — the READMEs describe the actual system", () => {
  it("documents every API route", () => {
    const missing = apiRoutePaths().filter((route) => !appReadme.includes(route));
    expect(missing, `Add to apps/web/README.md §4: ${missing.join(", ")}`).toEqual([]);
  });

  it("documents every Prisma model", () => {
    const missing = prismaModels().filter((model) => !new RegExp(`\\b${model}\\b`).test(appReadme));
    expect(missing, `Add to apps/web/README.md §3: ${missing.join(", ")}`).toEqual([]);
  });

  it("documents every chat tool", () => {
    const tools = chatToolNames();
    expect(tools.length).toBeGreaterThanOrEqual(6); // the loop really declares tools
    const missing = tools.filter((tool) => !appReadme.includes(tool));
    expect(missing, `Add to apps/web/README.md §5: ${missing.join(", ")}`).toEqual([]);
  });

  it("documents every npm script", () => {
    const missing = npmScripts().filter((script) => !appReadme.includes(script));
    expect(missing, `Add to apps/web/README.md §9/§10: ${missing.join(", ")}`).toEqual([]);
  });

  it("documents every environment variable (README or runbook)", () => {
    const missing = envKeys().filter((key) => !appDocs.includes(key));
    expect(missing, `Add to apps/web/README.md §10 or RUNBOOK.md: ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("root README maps every workspace", () => {
    for (const path of ["apps/web", "services/flight-search", "RUNBOOK.md"]) {
      expect(rootReadme, `Root README.md must mention ${path}`).toContain(path);
    }
  });

  it("root README quick start matches the real workflow (no resurrected Docker steps)", () => {
    expect(rootReadme).toContain("make setup");
    expect(rootReadme).not.toMatch(/docker-compose up|Docker \+ docker-compose/);
  });
});
