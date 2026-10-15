import { SITE, absoluteUrl } from "./site";

/**
 * IndexNow: tells Bing (and the other engines that share the protocol) which
 * pages have just changed, so a new guest's answer page is fetched within
 * minutes. The key is public by design: engines read it back from `/<key>.txt`.
 */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function isIndexNowKey(key: string | undefined): key is string {
  return typeof key === "string" && /^[A-Za-z0-9-]{8,128}$/.test(key);
}

/** The pages whose content changes when these puzzles are stored or corrected. */
export function urlsChangedByPuzzles(numbers: number[]): string[] {
  return [...new Set(["/", "/today", "/hints", "/archive", ...numbers.map((number) => `/archive/${number}`)])].map(absoluteUrl);
}

/** Submits the URLs. Resolves to the HTTP status; 200 and 202 both mean accepted. */
export async function submitIndexNow(fetchImpl: typeof fetch, key: string, urls: string[]): Promise<number> {
  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: SITE.host, key, keyLocation: absoluteUrl(`/${key}.txt`), urlList: urls }),
  });
  return response.status;
}
