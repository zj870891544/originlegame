import { NextResponse, type NextRequest } from "next/server";
import { SITE, isIndexableHost } from "@/lib/seo/site";

/**
 * Runs before every page request.
 *  - www is folded into the apex domain with a permanent redirect.
 *  - Any host other than the production domain (workers.dev previews,
 *    localhost) is served with a noindex header so previews never compete
 *    with the real site in search results.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (host?.toLowerCase() === `www.${SITE.host}`) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, SITE.origin);
    return NextResponse.redirect(target, 301);
  }

  const response = NextResponse.next();
  if (!isIndexableHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon|icon-|apple-touch-icon|og.png|manifest.webmanifest).*)"],
};
