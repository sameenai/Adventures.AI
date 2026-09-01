import { expect, test } from "@playwright/test";

/**
 * Render-and-never-hang gates for the pages a first-time visitor hits.
 *
 * This tier runs against `next dev` on arbitrary CI/dev machines, so
 * wall-clock here measures the machine and the dev compiler, not the
 * product — tight budgets were a coin-flip (a warm mobile-emulated landing
 * render took 3.9s on a loaded runner). Each test therefore warms the route
 * once, then asserts a GENEROUS budget that only a genuinely hung page
 * (blocking service call, stuck skeleton, dead stream) can breach.
 * Real latency requirements are enforced where they mean something: the
 * pre-deploy smoke against the production build (see CLAUDE.md) and k6.
 */
const HANG_BUDGET_MS = 10_000;

async function warm(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

test.describe("Page performance — content renders within budget", () => {
  test("landing page renders hero content without hanging", async ({ page }) => {
    await warm(page, "/");
    const start = Date.now();
    await page.goto("/");
    await page.waitForSelector("text=Basecamper", { timeout: HANG_BUDGET_MS });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(HANG_BUDGET_MS);
  });

  test("adventures page shows real adventure content, not just skeletons", async ({ page }) => {
    await page.goto("/adventures");
    // Wait for actual adventure content — either a card link or heading text
    await page.waitForSelector('a[href*="/adventures/seed-"], h1:has-text("Adventures")', {
      timeout: 5000,
    });
    // Verify at least the page heading rendered
    await expect(page.locator("h1")).toContainText("Adventures");
    // After content loads, skeletons should be gone
    const pulseCount = await page.locator(".animate-pulse").count();
    expect(pulseCount).toBe(0);
  });

  test("adventures page loads without hanging", async ({ page }) => {
    await warm(page, "/adventures");
    const start = Date.now();
    await page.goto("/adventures");
    // :visible — the catalog also renders `hidden sm:block` links that stay
    // hidden on the mobile viewport; waitForSelector takes the first match.
    await page.waitForSelector('a[href*="/adventures/"]:visible', { timeout: HANG_BUDGET_MS });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(HANG_BUDGET_MS);
  });

  test("leaderboard page renders ranked adventures without hanging", async ({ page }) => {
    await warm(page, "/leaderboard");
    await page.goto("/leaderboard");
    // The leaderboard ranks ADVENTURES (the original assertion waited for
    // seed user names, which never render on this page). Real content =
    // ranked rows linking to adventure pages.
    await page.waitForSelector('table a[href*="/adventures/"]', { timeout: HANG_BUDGET_MS });
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThan(0);
  });

  test("login page becomes interactive without hanging", async ({ page }) => {
    await warm(page, "/login");
    const start = Date.now();
    await page.goto("/login");
    await page.waitForSelector('input[type="email"], button:has-text("Sign")', {
      timeout: HANG_BUDGET_MS,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(HANG_BUDGET_MS);
  });

  test("no persistent loading state on key pages", async ({ page }) => {
    const pages = ["/adventures", "/leaderboard"];
    for (const path of pages) {
      await page.goto(path, { waitUntil: "networkidle" });
      // After network settles, no skeleton loaders should remain
      const skeletons = await page.locator(".animate-pulse").count();
      expect(skeletons, `${path} still has loading skeletons after networkidle`).toBe(0);
    }
  });

  test("static pages (privacy, terms) load without hanging", async ({ page }) => {
    for (const path of ["/privacy", "/terms"]) {
      await warm(page, path);
      const start = Date.now();
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - start;
      expect(elapsed, `${path} took ${elapsed}ms`).toBeLessThan(HANG_BUDGET_MS);
    }
  });
});
