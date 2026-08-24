import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate for a consumer product that explicitly serves novices:
 * serious axe violations on the core public pages fail the build.
 */
const PAGES = ["/", "/adventures", "/login", "/privacy", "/terms"];

for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious,
      serious
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes — ${v.help}`)
        .join("\n"),
    ).toEqual([]);
  });
}
