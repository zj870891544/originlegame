/**
 * vinext skips its blocking-metadata regex for an empty User-Agent. Our HTML
 * cache is shared across agents, so even that request must render a full head.
 */
export function metadataRequest(request: Request): Request {
  if (request.headers.get("user-agent")?.trim()) return request;
  const headers = new Headers(request.headers);
  headers.set("user-agent", "OriginleGame/1.0");
  return new Request(request, { headers });
}
