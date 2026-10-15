import { expect, test } from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";

test("source-only ChatGPT entry reaches GA once without a referrer and stays scoped to the entry page", async ({ page }) => {
  // Serve the built Worker on the production origin so the real host guard and
  // client integration run, but stub Google's script to keep test traffic local.
  await page.route("https://originlegame.app/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await page.request.get(`${E2E_ORIGIN}${url.pathname}${url.search}`);
    await route.fulfill({ response });
  });
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "",
  }));
  const entry = "https://originlegame.app/today?utm_source=chatgpt.com&token=private#answer";
  await page.goto(entry);

  const pageViews = () => page.evaluate(() => {
    const queue = (window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [];
    return queue.filter((item) => item[0] === "event" && item[1] === "page_view").map((item) => item[2]);
  });
  await expect.poll(pageViews).toEqual([expect.objectContaining({
    page_location: "https://originlegame.app/today?utm_source=chatgpt.com&utm_medium=ai-assistant",
    page_referrer: "",
    send_to: "G-C5F3XYH0N1",
  })]);
  await expect(page).toHaveURL(entry);
  await expect(page.locator('script[src^="https://www.googletagmanager.com/gtag/js"]')).toHaveCount(1);

  await page.locator('header a[href="/hints"]').click();
  await expect(page).toHaveURL("https://originlegame.app/hints");
  // Site navigation loads a new document, so this page has its own GA queue.
  await expect.poll(pageViews).toEqual([
    expect.objectContaining({ page_location: "https://originlegame.app/hints", page_referrer: "https://originlegame.app/today" }),
  ]);
});
