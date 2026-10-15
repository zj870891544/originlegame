import { describe, expect, it } from "vitest";
import type { PuzzleSummary } from "@/lib/db/puzzles";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { puzzleAnswerSummary } from "@/lib/seo/puzzle";
import { buildSitemap } from "@/lib/seo/sitemap";

const summary: PuzzleSummary = {
  number: 10,
  gameDate: "2026-10-14",
  slug: "testa",
  guestName: "Testa",
  countryCode: "KE",
  updatedAt: "2026-10-14T04:01:00.000Z",
};

describe("dated answer SEO", () => {
  it("includes the puzzle date, country and guest in a self-contained answer", () => {
    expect(puzzleAnswerSummary(summary)).toBe(
      "The Originle #10 answer for October 14, 2026 is Kenya. The guest is Testa.",
    );
  });

  it("ties article dates and attribution to the provided record", () => {
    const article = articleJsonLd({
      headline: "Originle #10 answer and hints (October 14, 2026)",
      path: "/archive/10",
      description: puzzleAnswerSummary(summary),
      citation: "https://originle.io/testa/day.js",
      published: "2026-10-14T04:00:00.000Z",
      modified: summary.updatedAt,
    });
    expect(article).toMatchObject({
      "@id": "https://originlegame.app/archive/10#article",
      description: "The Originle #10 answer for October 14, 2026 is Kenya. The guest is Testa.",
      citation: "https://originle.io/testa/day.js",
      datePublished: "2026-10-14T04:00:00.000Z",
      dateModified: summary.updatedAt,
    });
  });
});

describe("sitemap content dates", () => {
  const entry = (puzzles: PuzzleSummary[], path: string) =>
    buildSitemap(puzzles, "2026-10-15").find((page) => page.url === `https://originlegame.app${path}`);

  it("preserves the archive's actual change date after midnight", () => {
    expect(entry([summary], "/archive")?.lastModified).toBe(summary.updatedAt);
    expect(entry([summary], "/archive/10")?.lastModified).toBe(summary.updatedAt);
    expect(entry([summary], "/today")).not.toHaveProperty("lastModified");
  });

  it("does not give today's answer a historical correction's newer timestamp", () => {
    const today = { ...summary, number: 11, gameDate: "2026-10-15", updatedAt: "2026-10-15T04:01:00.000Z" };
    const correction = { ...summary, updatedAt: "2026-10-15T09:00:00.000Z" };
    expect(entry([today, correction], "/today")?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/hints")?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/archive")?.lastModified).toBe(correction.updatedAt);
  });

  it("omits unknown change dates when the database is unavailable", () => {
    expect(entry([], "/")).not.toHaveProperty("lastModified");
    expect(entry([], "/archive")).not.toHaveProperty("lastModified");
  });
});
