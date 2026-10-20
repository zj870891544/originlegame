import { describe, expect, it } from "vitest";
import { articleJsonLd, organizationJsonLd, originleGameJsonLd, websiteJsonLd, webToolJsonLd } from "@/lib/seo/jsonld";
import { SITE } from "@/lib/seo/site";

describe("guide and official game entities", () => {
  it("keeps the independent site and the game it discusses as distinct entities", () => {
    const website = websiteJsonLd();
    const organization = organizationJsonLd();
    const game = originleGameJsonLd();

    expect(website).toMatchObject({
      "@id": "https://originlegame.app/#website",
      url: "https://originlegame.app/",
      description: SITE.identityDescription,
      publisher: { "@id": "https://originlegame.app/#organization" },
      about: { "@id": "https://originle.io/#game", "@type": "VideoGame", url: "https://originle.io/" },
    });
    expect(organization).toMatchObject({ "@id": "https://originlegame.app/#organization", description: SITE.identityDescription });
    expect(game).toMatchObject({ "@id": "https://originle.io/#game", "@type": "VideoGame", name: "Originle", url: "https://originle.io/" });
    expect(game).not.toHaveProperty("publisher");
    for (const entity of [website, organization, game]) expect(entity).not.toHaveProperty("sameAs");
  });

  it("attributes a sourced answer to this guide without claiming authorship of the official game", () => {
    const article = articleJsonLd({
      headline: "Originle #15 answer and hints",
      path: "/archive/15",
      citation: "https://originle.io/leena/day.js",
      published: "2026-10-19T04:00:40.756Z",
      modified: "2026-10-20T01:55:00.000Z",
    });

    expect(article).toMatchObject({
      "@id": "https://originlegame.app/archive/15#article",
      url: "https://originlegame.app/archive/15",
      citation: "https://originle.io/leena/day.js",
      isPartOf: { "@id": "https://originlegame.app/#website" },
      about: { "@id": "https://originle.io/#game" },
      author: { "@id": "https://originlegame.app/#organization" },
      publisher: { "@id": "https://originlegame.app/#organization" },
    });
    expect(article).not.toHaveProperty("sameAs");
  });

  it("identifies a guide tool's subject without presenting the tool as the official game", () => {
    const tool = webToolJsonLd({ name: "Originle score calculator", path: "/originle-score-calculator", description: "Calculate a score." });
    expect(tool).toMatchObject({
      "@type": "WebApplication",
      url: "https://originlegame.app/originle-score-calculator",
      isPartOf: { "@id": "https://originlegame.app/#website" },
      about: { "@id": "https://originle.io/#game" },
      publisher: { "@id": "https://originlegame.app/#organization" },
    });
    expect(tool).not.toHaveProperty("sameAs");
  });
});
