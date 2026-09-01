import { expect, test } from "@playwright/test";

// NOTE: the previous version of this spec asserted pre-redesign copy and
// only ever "ran" in the dead nested CI workflow — it had been failing
// silently since the v6 design landed. Kept aligned with the real page now
// that e2e actually gates merges.
test.describe("Landing Page", () => {
  test("displays the hero with primary CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("adventure");
    await expect(page.getByRole("link", { name: "Start exploring" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start planning →" })).toBeVisible();
  });

  test("shows live catalog stats", async ({ page }) => {
    await page.goto("/");
    // Seeded database: the adventures stat must be a real non-zero number.
    const stat = page.locator("section span.font-display").first();
    await expect(stat).not.toHaveText("0");
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Log in" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
