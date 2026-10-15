import { expect, test } from "@playwright/test";

for (const path of ["/", "/today", "/hints", "/archive", "/how-to-play", "/games-like-originle", "/about"]) {
  test(`${path} has one h1 and no sideways scrolling`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
