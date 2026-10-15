import { SITE, absoluteUrl } from "./site";

type JsonLd = Record<string, unknown>;

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    name: SITE.name,
    alternateName: ["OriginleGame", "originlegame.app"],
    url: `${SITE.origin}/`,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": `${SITE.origin}/#organization` },
  };
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.origin}/#organization`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    logo: absoluteUrl("/icon-512.png"),
    email: SITE.contactEmail,
    description: "An independent fan guide to the Originle daily geography game. Not affiliated with or endorsed by Originle.",
  };
}

/** The original game, described as what it is: someone else's free browser game. */
export function originleGameJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "Originle",
    url: SITE.officialGameUrl,
    description:
      "A free daily geography game: meet one guest in eight short video clues and guess the country they represent in three tries.",
    genre: ["Geography", "Puzzle", "Daily game"],
    gamePlatform: "Web browser",
    applicationCategory: "Game",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export interface DatedPage {
  headline: string;
  path: string;
  description?: string;
  /** The public primary source used for this page's factual claims. */
  citation?: string;
  /** ISO instants taken from the stored record, never from the clock. */
  published: string;
  modified: string;
}

export function articleJsonLd(page: DatedPage): JsonLd {
  const url = absoluteUrl(page.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: page.headline,
    ...(page.description ? { description: page.description } : {}),
    ...(page.citation ? { citation: page.citation } : {}),
    url,
    mainEntityOfPage: url,
    datePublished: page.published,
    dateModified: page.modified,
    inLanguage: "en",
    isAccessibleForFree: true,
    image: absoluteUrl("/og.png"),
    about: { "@type": "VideoGame", name: "Originle", url: SITE.officialGameUrl },
    author: { "@id": `${SITE.origin}/#organization` },
    publisher: { "@id": `${SITE.origin}/#organization` },
  };
}

export interface FaqEntry {
  question: string;
  /** Plain-text answer; must match what is visibly rendered on the page. */
  answer: string;
}

export function faqJsonLd(entries: FaqEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function itemListJsonLd(name: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: /^https?:\/\//.test(item.path) ? item.path : absoluteUrl(item.path) })),
  };
}
