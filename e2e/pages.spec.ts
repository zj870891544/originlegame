import { expect, test } from "@playwright/test";
import { gameDateAt, puzzleNumberOn } from "../src/lib/time/game-day";

const number = puzzleNumberOn(gameDateAt(new Date()));

test.describe("daily pages", () => {
  test("home shows today's guest with the answer folded away", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Originle game");
    await expect(page.getByRole("heading", { name: `Where is Fixture ${number} from?` })).toBeVisible();
    const answer = page.locator("details", { hasText: `Originle #${number} answer` });
    await expect(answer).not.toHaveAttribute("open", "");
    await expect(answer.locator(".stamp")).toBeHidden();
    await answer.locator("summary").click();
    await expect(answer.locator(".stamp")).toContainText("KENYA");
  });

  test("the answer is in the served HTML for search engines", async ({ request }) => {
    const html = (await (await request.get("/today")).text()).replace(/<!-- -->/g, "");
    expect(html).toContain(`Originle answer today: #${number}`);
    expect(html).toContain("represents Kenya");
    expect(html).toContain(`The Originle #${number} answer for`);
    expect(html).toContain("is Kenya. The guest is Fixture");
    expect(html).toContain(`href="/archive/${number}"`);
    expect(html).toContain(`"citation":"https://originle.io/fixture-${number}/day.js"`);
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('<link rel="canonical" href="https://originlegame.app/today"');
  });

  test("opening every hint leaves the answer and clue titles folded", async ({ page }) => {
    await page.goto("/hints");
    const hints = page.locator('details[data-ga-event="hint_open"]');
    const answer = page.locator('details[data-ga-event="answer_reveal"]');
    const roadmap = page.locator('details[data-ga-event="roadmap_open"]');
    await page.getByRole("button", { name: "Open every hint" }).click();
    await expect(hints).toHaveCount(3);
    for (const hint of await hints.all()) await expect(hint).toHaveAttribute("open", "");
    await expect(page.getByText('starts with "K" and has 5 letters')).toBeVisible();
    await expect(answer).not.toHaveAttribute("open", "");
    await expect(answer.locator(".stamp")).toBeHidden();
    await expect(roadmap).not.toHaveAttribute("open", "");
    await page.getByRole("button", { name: "Fold everything away" }).click();
    for (const hint of await hints.all()) await expect(hint).not.toHaveAttribute("open", "");
  });

  test("archive lists every stored puzzle and links to its page", async ({ page }) => {
    await page.goto("/archive");
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await page.getByRole("link", { name: "Hints & answer" }).nth(1).click();
    await expect(page).toHaveURL(new RegExp(`/archive/${number - 1}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Originle #${number - 1} answer and hints`);
    await page.getByText("Show the nearby countries").click();
    await expect(page.getByRole("cell", { name: /Rwanda/ })).toBeVisible();
  });

  test("future and unknown puzzles are 404s", async ({ request }) => {
    expect((await request.get(`/archive/${number + 1}`)).status()).toBe(404);
    expect((await request.get("/archive/abc")).status()).toBe(404);
  });

  test("old addresses redirect to the canonical page", async ({ request }) => {
    const response = await request.get("/originle-answer-today", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toMatch(/\/today$/);
  });
});

test.describe("site files", () => {
  test("sitemap lists the puzzle pages", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`https://originlegame.app/archive/${number}`);
    expect(xml).toContain("https://originlegame.app/how-to-play");
  });

  test("previews are closed to crawlers", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /");
    expect((await request.get("/")).headers()["x-robots-tag"]).toContain("noindex");
  });

  test("llms.txt names today's puzzle", async ({ request }) => {
    const text = await (await request.get("/llms.txt")).text();
    expect(text).toContain(`Originle #${number}`);
    expect(text).toContain(`Permanent page for this date: https://originlegame.app/archive/${number}`);
    expect(text).toContain(`Public source: https://originle.io/fixture-${number}/day.js`);
  });

  test("the admin sync refuses requests without the token", async ({ request }) => {
    // .dev.vars gives the local server a token, so the route exists and must say 401.
    expect((await request.post("/api/admin/sync")).status()).toBe(401);
    expect((await request.post("/api/admin/sync", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
    expect((await request.get("/api/admin/sync")).status()).toBe(404);
  });
});
