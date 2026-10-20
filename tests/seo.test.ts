import { describe, expect, it } from "vitest";
import type { Puzzle, PuzzleSummary } from "@/lib/db/puzzles";
import type { TodayState } from "@/lib/puzzle/load";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { llmsText } from "@/lib/seo/llms";
import { PUZZLE_GUIDE_EDITED, puzzleAnswerSummary } from "@/lib/seo/puzzle";
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

describe("daily guide summary", () => {
  const puzzle: Puzzle = {
    ...summary,
    countryLabel: "Kenya",
    clues: [],
    outlineClue: null,
    distances: { KE: 0 },
    disabledGuesses: [],
    guessNote: null,
    hints: null,
    editorNote: null,
    sourceUrl: "https://originle.io/testa/",
    firstSeenAt: "2026-10-14T04:00:00.000Z",
  };
  const previous: Puzzle = {
    ...puzzle,
    number: 9,
    gameDate: "2026-10-13",
    guestName: "Previous",
    countryCode: "TZ",
    sourceUrl: "https://originle.io/previous/",
  };
  const state: TodayState = { today: puzzle.gameDate, number: puzzle.number, puzzle, yesterday: previous, ok: true };

  it("anchors the answer to New York's game date, stored timestamps and permanent source", () => {
    const text = llmsText(state);
    expect(text).toContain("Game date: 2026-10-14 (America/New_York)");
    expect(text).toContain("Today is Originle #10 (October 14, 2026). The guest is Testa, who represents Kenya.");
    expect(text).toContain("Guide record first stored: 2026-10-14T04:00:00.000Z");
    expect(text).toContain(`Guide record last changed: ${summary.updatedAt}`);
    expect(text).toContain("not the official game's publication time");
    expect(text).toContain("Permanent page for this date: https://originlegame.app/archive/10");
    expect(text).toContain("Public source: https://originle.io/testa/day.js");
  });

  it("keeps yesterday separate when today's guide has not synced", () => {
    const text = llmsText({ ...state, puzzle: null });
    expect(text).toContain("Today is Originle #10");
    expect(text).toContain("This guide has not yet synced the guest and answer");
    expect(text).toContain("does not establish whether the official game has published it");
    expect(text).toContain("Yesterday, Originle #9: Previous represented Tanzania.");
    expect(text).not.toContain("The guest is");
    expect(text).not.toContain("Public source:");
  });

  it("reports an unavailable database without claiming that the official guest is pending", () => {
    const text = llmsText({ ...state, ok: false });
    expect(text).toContain("puzzle database is unavailable");
    expect(text).toContain("today's guest and answer could not be checked");
    expect(text).not.toContain("has not yet synced");
    expect(text).not.toContain("The guest is");
    expect(text).not.toContain("Yesterday, Originle");
    expect(text).not.toContain("Guide record last changed:");
  });

  it("does not label a previous puzzle as today's answer if stale data is supplied", () => {
    const text = llmsText({ ...state, puzzle: previous, yesterday: null });
    expect(text).toContain("Today is Originle #10");
    expect(text).toContain("This guide has not yet synced");
    expect(text).not.toContain("Previous represented");
    expect(text).not.toContain("The guest is Previous");
    expect(text).not.toContain("Public source: https://originle.io/previous/day.js");
  });
});

describe("sitemap content dates", () => {
  const entry = (puzzles: PuzzleSummary[], path: string, today = "2026-10-19") =>
    buildSitemap(puzzles, today).find((page) => page.url === `https://originlegame.app${path}`);

  it("includes a real shared-guide correction without inventing a missing daily record", () => {
    expect(entry([summary], "/archive/10")?.lastModified).toBe(PUZZLE_GUIDE_EDITED);
    expect(entry([summary], "/today")).not.toHaveProperty("lastModified");
    expect(entry([summary], "/hints")).not.toHaveProperty("lastModified");
  });

  it("does not give today's answer a historical correction's newer timestamp", () => {
    const today = { ...summary, number: 17, gameDate: "2026-10-21", updatedAt: "2026-10-21T04:01:00.000Z" };
    const correction = { ...summary, updatedAt: "2026-10-21T09:00:00.000Z" };
    expect(entry([today, correction], "/today", today.gameDate)?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/hints", today.gameDate)?.lastModified).toBe(today.updatedAt);
    expect(entry([today, correction], "/archive")?.lastModified).toBe(correction.updatedAt);
    expect(entry([today, correction], "/archive/10")?.lastModified).toBe(correction.updatedAt);
  });

  it("keeps known editorial dates when the database is unavailable, without inventing daily dates", () => {
    for (const path of ["/archive"]) {
      expect(entry([], path)?.lastModified).toBe("2026-10-19");
    }
    expect(entry([], "/")?.lastModified).toBe(PUZZLE_GUIDE_EDITED);
    for (const path of ["/how-to-play", "/originle-score-calculator", "/games-like-originle", "/about", "/guess-where-im-from-game", "/originle-solver"]) {
      expect(entry([], path)?.lastModified).toBe("2026-10-20");
    }
    expect(entry([], "/today")).not.toHaveProperty("lastModified");
    expect(entry([], "/hints")).not.toHaveProperty("lastModified");
  });

  it("does not advance editorial or record dates just because the day changes", () => {
    for (const path of ["/", "/archive", "/how-to-play", "/guess-where-im-from-game", "/archive/10"]) {
      expect(entry([summary], path, "2026-10-20")?.lastModified).toBe(entry([summary], path)?.lastModified);
    }
  });

  it("advertises listing edits even when their puzzle records are older", () => {
    expect(entry([summary], "/")?.lastModified).toBe(PUZZLE_GUIDE_EDITED);
    expect(entry([summary], "/archive")?.lastModified).toBe("2026-10-19");
    for (const path of ["/today", "/hints"]) {
      expect(entry([summary], path, summary.gameDate)?.lastModified).toBe(PUZZLE_GUIDE_EDITED);
    }
  });

  it("uses newer puzzle changes over the listing pages' editorial dates", () => {
    const newer = { ...summary, number: 16, gameDate: "2026-10-20", updatedAt: "2026-10-20T04:01:00.000Z" };
    for (const path of ["/", "/archive"]) {
      expect(entry([newer, summary], path, "2026-10-20")?.lastModified).toBe(newer.updatedAt);
    }
  });
});
