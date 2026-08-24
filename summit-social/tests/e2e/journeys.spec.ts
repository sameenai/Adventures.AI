import { expect, test } from "@playwright/test";

/**
 * Core user journeys, end to end against a real server + database.
 * Sign-in uses the dev credentials provider (ENABLE_DEV_LOGIN=true is set by
 * the Playwright webServer config; never in deployed environments).
 */

const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/adventures", { timeout: 20_000 });
}

test.describe("visitor journeys", () => {
  test("landing page presents the product and key CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Basecamper/i);
    await expect(page.locator("a[href='/adventures']").first()).toBeVisible();
  });

  test("legal pages exist and name the processors", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText("OpenAI", { exact: false }).first()).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByText(/inherently risky/i)).toBeVisible();
  });

  test("adventure browsing: catalog renders and detail page opens", async ({ page }) => {
    await page.goto("/adventures");
    const firstCard = page.locator("a[href^='/adventures/']").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("no horizontal scroll on key pages (mobile friendliness)", async ({ page }) => {
    for (const path of ["/", "/adventures", "/privacy", "/login"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("authenticated journeys", () => {
  test("sign in via dev login and reach the planner", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await page.goto("/itinerary");
    await expect(page.getByRole("heading", { name: /trip planner/i })).toBeVisible();
  });

  test("demo-mode chat: message streams a reply and creates an itinerary", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await page.goto("/itinerary");

    const input = page.locator("form input[type='text'], form textarea").first();
    await input.fill("Plan a trek in Nepal");
    await page.keyboard.press("Enter");

    // Demo mode streams a canned itinerary — assert real content arrives.
    await expect(page.getByText(/Day 1/i).first()).toBeVisible({ timeout: 30_000 });

    // The trip lands in My Trips.
    await page.goto("/itineraries");
    await expect(page.getByText(/Plan a trek in Nepal/i).first()).toBeVisible();
  });

  test("bucket list: bookmark an adventure and see it saved", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await page.goto("/adventures");
    const firstCard = page.locator("a[href^='/adventures/']").first();
    await firstCard.click();
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByRole("button", { name: /save|bucket/i }).first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    await page.goto("/bookmarks");
    await expect(page.locator("a[href^='/adventures/']").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("cadence: log a trip as done and see the next-trip countdown", async ({ page }) => {
    await signIn(page, uniqueEmail());
    await page.goto("/adventures");
    await page.locator("a[href^='/adventures/']").first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /i did this/i }).click();
    await expect(page.getByRole("button", { name: /logged/i })).toBeVisible();

    await page.goto("/next-trip");
    await expect(page.getByText(/month(s)? since/i)).toBeVisible();
  });
});
