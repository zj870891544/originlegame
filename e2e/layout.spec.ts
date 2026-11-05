import { expect, test } from "@playwright/test";
import { gameDateAt, puzzleNumberOn } from "../src/lib/time/game-day";

const number = puzzleNumberOn(gameDateAt(new Date()));
const PATHS = [
  "/", "/today", "/hints", "/archive", `/archive/${number}`, "/how-to-play", "/originle-score-calculator", "/guess-where-im-from-game",
  "/games-like-originle", "/originle-solver", "/about",
];

for (const path of PATHS) {
  test(`${path} has one h1 and no sideways scrolling`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("archive starts with a released puzzle and random selection leads to its official replay", async ({ page }) => {
  await page.goto("/archive");
  const first = number - 2;
  await expect(page.getByRole("link", { name: first === 1 ? "Start at #1" : `Start with #${first}` }))
    .toHaveAttribute("href", `/archive/${first}`);
  await page.getByRole("button", { name: "Random puzzle" }).click();
  await expect(page).toHaveURL(new RegExp(`/archive/(?:${first}|${number - 1}|${number})$`));
  const selected = new URL(page.url()).pathname.split("/").at(-1);
  const replay = page.getByRole("link", { name: "Replay this puzzle on Originle" });
  await expect(replay).toHaveAttribute("href", new RegExp(`^https://originle\\.io/fixture-${selected}/\\?day=${selected}&`));
  await expect(page.locator('details[data-ga-event="answer_reveal"] .stamp')).toBeHidden();
});

test("Pattern Hacker opens the game with referral tags from the archive", async ({ page }) => {
  await page.route("https://playweird.fun/pattern-hacker/**", (route) => route.fulfill({ body: "Pattern Hacker test destination" }));
  await page.goto("/archive");
  const link = page.getByRole("link", { name: "Play Pattern Hacker" });
  await expect(link).toHaveAttribute("data-ga-event", "pattern_hacker_click");
  await link.click();
  await expect(page).toHaveURL("https://playweird.fun/pattern-hacker/?utm_source=originlegame.app&utm_medium=referral&utm_campaign=originle_hiatus&utm_content=archive");
});
