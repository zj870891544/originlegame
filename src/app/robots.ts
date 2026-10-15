import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { absoluteUrl, isIndexableHost } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

/**
 * Crawlers behind AI search and assistants, named so that their access is a
 * stated decision and not an accident of the wildcard rule: search indexes
 * (OAI-SearchBot is what puts a site in ChatGPT's answers), fetchers that act
 * for a person asking a question, and the crawlers that gather training text.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "DuckAssistBot",
  "meta-externalagent",
  "MistralAI-User",
  "CCBot",
];

/** Open on the production domain; closed everywhere else (previews, localhost). */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (!isIndexableHost(host)) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // A crawler that finds a group of its own ignores the wildcard group, so both carry the same rules.
  const open = { allow: "/", disallow: ["/api/"] };
  return {
    rules: [
      { userAgent: "*", ...open },
      { userAgent: AI_CRAWLERS, ...open },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
