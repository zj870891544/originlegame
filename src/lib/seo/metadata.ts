import type { Metadata } from "next";
import { SITE, absoluteUrl } from "./site";

interface PageMetaInput {
  /** Full <title>. The brand suffix is added when it fits. */
  title: string;
  description: string;
  /** Site path this page is canonical for, e.g. "/hints". */
  path: string;
  noindex?: boolean;
  ogType?: "website" | "article";
  /** ISO instants for dated pages: when the record was first published and last changed. */
  published?: string;
  modified?: string;
}

const INDEXABLE = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

/** Editorial budget for optional branding, not a search-engine display limit. */
export const TITLE_BUDGET = 60;

export function brandedTitle(title: string): string {
  const branded = `${title} | ${SITE.name}`;
  return branded.length > TITLE_BUDGET ? title : branded;
}

/** One place that builds title, description, canonical and social cards for a page. */
export function pageMetadata(input: PageMetaInput): Metadata {
  const title = brandedTitle(input.title);
  const url = absoluteUrl(input.path);
  const imageUrl = absoluteUrl("/og.png");
  return {
    title: { absolute: title },
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? "noindex, follow" : INDEXABLE,
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: SITE.name,
      type: input.ogType ?? "website",
      locale: SITE.locale,
      ...(input.published ? { publishedTime: input.published } : {}),
      ...(input.modified ? { modifiedTime: input.modified } : {}),
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
    },
    twitter: { card: "summary_large_image", title, description: input.description, images: [imageUrl] },
  };
}
