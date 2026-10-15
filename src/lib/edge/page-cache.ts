import { nextResetAt } from "@/lib/time/game-day";

/**
 * Edge cache for rendered pages.
 *
 * Rendering a page takes tens of milliseconds of CPU and a few hundred of
 * waiting on the database; answering from the cache takes about ten in all.
 * So each page is rendered once and then served from the data centre's cache
 * until it goes stale. Every page on this site is the same for every visitor
 * (no accounts, no cookies), which is what makes that safe; anything that
 * isn't is listed in `UNCACHED` below.
 */

/** Pages that change as soon as a new guest is published; kept only briefly. */
const FAST_PATHS = new Set(["/", "/today", "/hints", "/archive", "/sitemap.xml", "/llms.txt"]);
const RECORD_PATHS = /^\/archive\//;
export const FAST_TTL_SECONDS = 120;
export const SLOW_TTL_SECONDS = 3600;

/** Paths whose response depends on the query string or changes state. */
const UNCACHED = [/^\/api\//];

const CACHEABLE_TYPES = ["text/html", "text/x-component", "application/xml", "text/xml", "text/plain"];
/** Headers replaced on the stored copy, and put back before a visitor sees it. */
const STASHED = ["cache-control", "vary"];
const STASH_PREFIX = "x-og-stash-";
export const CACHE_STATUS_HEADER = "x-og-cache";

export interface CachePlan {
  /** URL the response is stored under. */
  key: string;
  ttlSeconds: number;
}

export interface PageCacheOptions {
  /** Only requests for this host are cached: previews and local servers always render. */
  host: string;
  /** Identifies the deployment, so a new one never serves pages built by the last. */
  version: string;
  now: Date;
}

/** Decides whether a request may be answered from the cache, and under what key. */
export function planCache(request: Request, options: PageCacheOptions): CachePlan | null {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.hostname !== options.host) return null;
  if (UNCACHED.some((pattern) => pattern.test(url.pathname))) return null;

  // A navigation inside the site asks for the page as data, at a URL whose `_rsc`
  // value already encodes everything that payload varies by. A data request
  // without it is about to be redirected to one that has it.
  const rsc = url.searchParams.get("_rsc");
  if (!rsc && request.headers.has("rsc")) return null;

  // No page here reads its query string, so tracking parameters share one copy.
  const key = new URL(`https://${options.host}${url.pathname}`);
  key.searchParams.set("v", options.version);
  if (rsc) key.searchParams.set("rsc", rsc);

  // Nothing outlives the daily reset: the whole site turns over with the game day.
  const untilReset = Math.floor((nextResetAt(options.now).getTime() - options.now.getTime()) / 1000);
  const followsRecords = FAST_PATHS.has(url.pathname) || RECORD_PATHS.test(url.pathname);
  const ttlSeconds = Math.min(followsRecords ? FAST_TTL_SECONDS : SLOW_TTL_SECONDS, untilReset);
  if (ttlSeconds < 5) return null;
  return { key: key.toString(), ttlSeconds };
}

function isCacheable(response: Response): boolean {
  if (response.status !== 200 || response.headers.has("set-cookie")) return false;
  const type = response.headers.get("content-type") ?? "";
  return CACHEABLE_TYPES.some((allowed) => type.startsWith(allowed));
}

/** The copy that goes into the cache: same page, with a lifetime the cache will honour. */
function forStorage(response: Response, ttlSeconds: number): Response {
  const stored = new Response(response.body, response);
  for (const name of STASHED) {
    const value = stored.headers.get(name);
    if (value !== null) stored.headers.set(STASH_PREFIX + name, value);
    stored.headers.delete(name);
  }
  stored.headers.set("cache-control", `public, s-maxage=${ttlSeconds}`);
  return stored;
}

/** A cached copy as the visitor should receive it: the headers the page was rendered with. */
function fromStorage(cached: Response): Response {
  const response = new Response(cached.body, cached);
  for (const name of STASHED) {
    const value = response.headers.get(STASH_PREFIX + name);
    response.headers.delete(name);
    if (value !== null) response.headers.set(name, value);
    response.headers.delete(STASH_PREFIX + name);
  }
  response.headers.delete("age");
  response.headers.set(CACHE_STATUS_HEADER, "hit");
  return response;
}

/** The parts of the Workers Cache API this needs; lets tests supply their own. */
export interface PageCacheStore {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

/**
 * Answers from the cache when it can; otherwise renders, and stores the result
 * for the next visitor. A cache that fails is treated as a cache that is empty.
 */
export async function servePage(
  request: Request,
  render: () => Promise<Response>,
  store: PageCacheStore,
  defer: (work: Promise<unknown>) => void,
  options: PageCacheOptions,
): Promise<Response> {
  const plan = planCache(request, options);
  if (!plan) return render();

  const cached = await store.match(plan.key).catch(() => undefined);
  if (cached) return fromStorage(cached);

  const rendered = await render();
  if (!isCacheable(rendered)) return rendered;
  const response = new Response(rendered.body, rendered);
  response.headers.set(CACHE_STATUS_HEADER, "miss");
  defer(store.put(plan.key, forStorage(response.clone(), plan.ttlSeconds)).catch(() => undefined));
  return response;
}
