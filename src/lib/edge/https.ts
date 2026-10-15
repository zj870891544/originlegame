/**
 * Where a request for the production site made over plain HTTP should go instead:
 * the same page on HTTPS, on the apex domain. Null when the request is fine as it is,
 * or is for another host (previews and local servers have no certificate to send people to).
 */
export function httpsRedirect(request: Request, host: string): string | null {
  const url = new URL(request.url);
  if (url.protocol !== "http:") return null;
  if (url.hostname !== host && url.hostname !== `www.${host}`) return null;
  return `https://${host}${url.pathname}${url.search}`;
}
