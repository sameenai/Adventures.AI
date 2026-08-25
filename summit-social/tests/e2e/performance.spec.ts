import { expect, test } from "@playwright/test";

test.describe("Page performance — content renders within budget", () => {
  test("landing page renders hero content within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForSelector("text=Basecamper", { timeout: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
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

  test("adventures page loads within 5 second budget", async ({ page }) => {
    const start = Date.now();
    await page.goto("/adventures");
    await page.waitForSelector('a[href*="/adventures/"]', { timeout: 5000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("leaderboard page renders user data within 5 seconds", async ({ page }) => {
    await page.goto("/leaderboard");
    // Wait for any user name from seed data to appear
    await page.waitForSelector('text=/Alex Summit|Maya Trails|James Explorer/', {
      timeout: 5000,
    });
  });

  test("login page is interactive within 2 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/login");
    await page.waitForSelector('input[type="email"], button:has-text("Sign")', {
      timeout: 2000,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
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

  test("static pages (privacy, terms) load instantly", async ({ page }) => {
    for (const path of ["/privacy", "/terms"]) {
      const start = Date.now();
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - start;
      expect(elapsed, `${path} took ${elapsed}ms`).toBeLessThan(2000);
    }
  });
});
