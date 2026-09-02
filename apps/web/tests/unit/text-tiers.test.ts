// The palette's own rule, enforced mechanically.
//
// src/styles/globals.css defines stone-400..600 as the muted TEXT tiers — each
// holds >=4.5:1 on the paper background and on stone-900 cards, in both themes
// — and says of the rest: "700+ are decorative (borders, fills) and must never
// carry text."
//
// Nothing checked that. Nineteen call sites had drifted onto text-stone-700,
// which is #d4cec8 in light mode: about 1.5:1 on paper, a serious WCAG AA
// failure that reads as almost-invisible grey. The axe gate did not catch them
// because it covers five pages and those labels live on others.
//
// A grep is the right shape of test here: it is exhaustive over the source, it
// costs nothing, and it fails at the moment someone types the class rather than
// whenever a page happens to be in the axe list.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../../src");

/** Decorative tiers: fine for borders and fills, never for text. */
const DECORATIVE_TEXT = /\btext-stone-(700|800|900|950)\b/;

function tsxFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...tsxFiles(full));
    else if (entry.endsWith(".tsx")) found.push(full);
  }
  return found;
}

describe("text never uses a decorative stone tier", () => {
  it("no component sets text-stone-700 or darker", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC)) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        const hit = DECORATIVE_TEXT.exec(line);
        if (hit) offenders.push(`${relative(SRC, file)}:${i + 1} — ${hit[0]}`);
      });
    }
    expect(
      offenders,
      `stone-700+ are borders and fills, not text (see globals.css). Use a text tier — 400, 500 or 600 — instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("the rule it enforces is still written down in globals.css", () => {
    // If the palette is ever restructured this test should be revisited, not
    // silently left guarding a rule that no longer exists.
    const css = readFileSync(join(SRC, "styles/globals.css"), "utf8");
    expect(css).toContain("must never carry text");
  });
});
