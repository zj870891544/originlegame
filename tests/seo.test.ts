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
  const entry = (puzzles: PuzzleSummary[], path: string, today = "2026-10-19") =>
    buildSitemap(puzzles, today).find((page) => page.url === `https://originlegame.app${path}`);

  it("preserves a dated puzzle's actual change date after midnight", () => {
    expect(entry([summary], "/archive/10")?.lastModified).toBe(summary.updatedAt);
    expect(entry([summary], "/today")).not.toHaveProperty("lastModified");
    expect(entry([summary], "/hints")).not.toHaveProperty("lastModified");
  });

  it("does not give today's answer a historical correction's newer timestamp", () => {
    const today = { ...summary, number: 15, gameDate: "2026-10-19", updatedAt: "2026-10-19T04:01:00.000Z" };
    const correction = { ...summary, updatedAt: "2026-10-19T09:00:00.000Z" };
    expect(entry([today, correction], "/today")?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/hints")?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/archive")?.lastModified).toBe(correction.updatedAt);
  });

  it("keeps known editorial dates when the database is unavailable, without inventing daily dates", () => {
    for (const path of ["/", "/archive", "/how-to-play", "/guess-where-im-from-game"]) {
      expect(entry([], path)?.lastModified).toBe("2026-10-19");
    }
    expect(entry([], "/originle-score-calculator")?.lastModified).toBe("2026-10-16");
    expect(entry([], "/games-like-originle")?.lastModified).toBe("2026-10-16");
    expect(entry([], "/about")?.lastModified).toBe("2026-10-15");
    expect(entry([], "/today")).not.toHaveProperty("lastModified");
    expect(entry([], "/hints")).not.toHaveProperty("lastModified");
  });

  it("does not advance editorial or record dates just because the day changes", () => {
    for (const path of ["/", "/archive", "/how-to-play", "/guess-where-im-from-game", "/archive/10"]) {
      expect(entry([summary], path, "2026-10-20")?.lastModified).toBe(entry([summary], path)?.lastModified);
    }
  });

  it("advertises listing edits even when their puzzle records are older", () => {
    for (const path of ["/", "/archive"]) {
      expect(entry([summary], path)?.lastModified).toBe("2026-10-19");
    }
  });

  it("uses newer puzzle changes over the listing pages' editorial dates", () => {
    const newer = { ...summary, number: 16, gameDate: "2026-10-20", updatedAt: "2026-10-20T04:01:00.000Z" };
    for (const path of ["/", "/archive"]) {
      expect(entry([newer, summary], path, "2026-10-20")?.lastModified).toBe(newer.updatedAt);
    }
  });
});
