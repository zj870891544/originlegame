/**
 * Cloudflare Worker entry. Page requests go to vinext through the edge page
 * cache; the cron trigger (see `triggers` in wrangler.jsonc) keeps the puzzles
 * in step with the official game and tells search engines what changed.
 */
import handler from "vinext/server/fetch-handler";
import { ADMIN_SYNC_PATH, handleAdminSync } from "../src/lib/admin/sync-endpoint";
import { d1PuzzleStore } from "../src/lib/db/puzzles";
import { httpsRedirect } from "../src/lib/edge/https";
import { metadataRequest } from "../src/lib/edge/metadata-request";
import { FAST_TTL_SECONDS, servePage } from "../src/lib/edge/page-cache";
import { changedNumbers, describeSync, syncOfficial } from "../src/lib/official/sync";
import { isIndexNowKey, submitIndexNow, urlsChangedByPuzzles } from "../src/lib/seo/indexnow";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    const host = new URL(env.SITE_URL).hostname;
    // HTTPS_ONLY=off (used by the end-to-end tests, which reach the site over plain HTTP) skips this.
    const secure = (env.HTTPS_ONLY as string) === "off" ? null : httpsRedirect(request, host);
    if (secure) return Promise.resolve(Response.redirect(secure, 301));
    if (new URL(request.url).pathname === ADMIN_SYNC_PATH) return handleAdminSync(request, env);
    const render = () => handler.fetch(metadataRequest(request), env, ctx);
    const edge = (caches as unknown as { default: Cache }).default;
    if ((env.PAGE_CACHE as string) === "off") return render();
    return servePage(
      request,
      render,
      { match: (key) => edge.match(key), put: (key, response) => edge.put(key, response) },
      (work) => ctx.waitUntil(work),
      { host, version: env.CF_VERSION_METADATA.id || "dev", now: new Date() },
    );
  },

  async scheduled(_controller: ScheduledController, env: Cloudflare.Env): Promise<void> {
    try {
      const report = await syncOfficial(d1PuzzleStore(env.DB), fetch, new Date());
      console.log(`[sync] ${describeSync(report)}`);
      const changed = changedNumbers(report);
      const key = env.INDEXNOW_KEY as string | undefined;
      if (changed.length === 0 || !isIndexNowKey(key)) return;
      // Search engines fetch soon after they are told; wait until no cached copy of the old pages is left.
      await new Promise((resolve) => setTimeout(resolve, (FAST_TTL_SECONDS + 5) * 1000));
      const status = await submitIndexNow(fetch, key, urlsChangedByPuzzles(changed));
      console.log(`[indexnow] #${changed.join(", #")}: HTTP ${status}`);
    } catch (error) {
      // A failed sync leaves the stored data as it was; the next trigger tries again.
      console.error(`[sync] ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};
