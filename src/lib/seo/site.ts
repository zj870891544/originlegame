/** Site-wide constants. The canonical origin is fixed: only this host is indexable. */
export const SITE = {
  name: "Originle Game",
  origin: "https://originlegame.app",
  host: "originlegame.app",
  tagline: "Daily Answer, Hints & Archive",
  description:
    "Today's Originle answer, three spoiler-free hints, nearby countries for close misses, and every past guest in one archive.",
  disclaimer:
    "Independent fan guide. Not affiliated with or endorsed by Originle or originle.io.",
  officialGameUrl: "https://originle.io/",
  officialArchiveUrl: "https://originle.io/?archive=1",
  contactEmail: "hello@originlegame.app",
  locale: "en_US",
} as const;

export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/today", label: "Answer" },
  { href: "/hints", label: "Hints" },
  { href: "/archive", label: "Archive" },
  { href: "/how-to-play", label: "How to play" },
  { href: "/games-like-originle", label: "Similar games" },
];

export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Daily puzzle",
    items: [
      { href: "/today", label: "Originle answer today" },
      { href: "/hints", label: "Originle hints" },
      { href: "/archive", label: "Originle archive" },
    ],
  },
  {
    heading: "Guides",
    items: [
      { href: "/", label: "The Originle game" },
      { href: "/how-to-play", label: "How to play Originle" },
      { href: "/originle-score-calculator", label: "Originle score calculator" },
      { href: "/guess-where-im-from-game", label: "Guess where someone is from" },
      { href: "/games-like-originle", label: "Games like Originle" },
    ],
  },
  {
    heading: "This site",
    items: [
      { href: "/about", label: "About and sources" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

/** Absolute URL on the canonical origin for a site path. */
export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return `${SITE.origin}/`;
  return `${SITE.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Only the production host may be indexed; previews and localhost never are. */
export function isIndexableHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return host.toLowerCase().replace(/:\d+$/, "") === SITE.host;
}

/** A link to the official game that says where the visit came from. */
export function officialUrl(path = "/", campaign = "guide"): string {
  const url = new URL(path, SITE.officialGameUrl);
  url.searchParams.set("utm_source", "originlegame.app");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
