import { defineConfig, devices } from "@playwright/test";

const PORT = 8789;
export const E2E_ORIGIN = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end tests run against the production build inside the real Workers
 * runtime (`wrangler dev` on the built output), with a throwaway local D1
 * database seeded with made-up guests. Build first: `npm run build && npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: E2E_ORIGIN, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["iPhone SE"], defaultBrowserType: "chromium" }, testMatch: /(?:layout|solver)\.spec\.ts/ },
  ],
  webServer: {
    command: `npx tsx e2e/prepare-db.ts && npx wrangler dev --config dist/server/wrangler.json --port ${PORT} --persist-to .wrangler/e2e-state --var PAGE_CACHE:off --var HTTPS_ONLY:off --var INDEXNOW_KEY:off`,
    url: `${E2E_ORIGIN}/about`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
