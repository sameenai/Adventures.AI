import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays hero section with CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Your next adventure starts here")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start Planning" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Adventures" })).toBeVisible();
  });

  test("displays feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("AI Trip Planner")).toBeVisible();
    await expect(page.getByText("Community Adventures")).toBeVisible();
    await expect(page.getByText("Flight Comparison")).toBeVisible();
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
