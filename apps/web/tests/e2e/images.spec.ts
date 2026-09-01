import { expect, test } from "@playwright/test";

/**
 * Images have to actually resolve.
 *
 * This is a real gap in the suite rather than a regression guard: nothing else
 * asserts that an image loads. Page tests wait on text and headings, and a
 * failed <Image> is a background request the page never blocks on — so a rotted
 * cover URL, a broken optimizer config, or an upstream host refusing us would
 * leave every existing test green while the product renders empty boxes.
 *
 * It found one: every avatar in the product is a DiceBear SVG, and the image
 * optimizer answers a vector with a 400 rather than passing it through. See
 * src/components/ui/avatar.tsx.
 */

/** Every failed image request the browser made while on the page. */
function watchImages(page: import("@playwright/test").Page): string[] {
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "image" && r.status() >= 400) {
      failed.push(`${r.status()} ${r.url()}`);
    }
  });
  return failed;
}

test.describe("images resolve", () => {
  test("the cover photo of a real adventure loads through the optimizer", async ({ request }) => {
    // Walk the actual catalogue rather than hard-coding a URL, so this follows
    // the data wherever covers are hosted — our own route today, object storage
    // after M6.
    const list = await request.get("/api/adventures?limit=1");
    expect(list.ok(), "catalogue API did not respond").toBe(true);
    const { items } = (await list.json()) as { items: Array<{ coverImageUrl: string }> };
    expect(items.length, "catalogue returned no adventures to check").toBeGreaterThan(0);

    const cover = items[0].coverImageUrl;
    const url = `/_next/image?url=${encodeURIComponent(cover)}&w=640&q=75`;
    const response = await request.get(url);
    expect(response.status(), `cover image failed to load: ${cover}`).toBe(200);
    expect(Number(response.headers()["content-length"] ?? "1")).toBeGreaterThan(0);
  });

  test("the catalogue renders with no failed image requests", async ({ page }) => {
    // Cards carry both a cover and an author avatar, so this one page exercises
    // the optimized and the unoptimized path at once.
    const failed = watchImages(page);

    await page.goto("/adventures");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(failed, `images failed to load:\n${failed.join("\n")}`).toEqual([]);
  });

  test("an adventure detail page issues no failed image requests", async ({ page }) => {
    const failed = watchImages(page);

    await page.goto("/adventures");
    const card = page
      .locator("a[href^='/adventures/']:not([href='/adventures/new']):visible")
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(failed, `images failed to load:\n${failed.join("\n")}`).toEqual([]);
  });
});
