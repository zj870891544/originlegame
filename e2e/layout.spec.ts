import { expect, test } from "@playwright/test";
import { gameDateAt, puzzleNumberOn } from "../src/lib/time/game-day";

const PATHS = [
  "/", "/today", "/hints", "/archive", `/archive/${puzzleNumberOn(gameDateAt(new Date()))}`, "/how-to-play", "/originle-score-calculator", "/guess-where-im-from-game",
  "/games-like-originle", "/about",
];

for (const path of PATHS) {
  test(`${path} has one h1 and no sideways scrolling`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
