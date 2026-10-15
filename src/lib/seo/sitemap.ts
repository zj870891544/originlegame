import type { MetadataRoute } from "next";
import type { PuzzleSummary } from "@/lib/db/puzzles";
import type { GameDate } from "@/lib/time/game-day";
import { absoluteUrl } from "./site";

/** Evergreen content dates are editorial edits, not request or build times. */
const STATIC_PAGES = [
  "/how-to-play", "/games-like-originle", "/about", "/privacy", "/terms",
];

function latestChange(puzzles: PuzzleSummary[]): string | undefined {
  return puzzles.reduce<string | undefined>((latest, puzzle) =>
    !latest || puzzle.updatedAt > latest ? puzzle.updatedAt : latest, undefined);
}

/** Missing data must not manufacture a new lastmod on every visit or midnight. */
export function buildSitemap(puzzles: PuzzleSummary[], today: GameDate): MetadataRoute.Sitemap {
  const latest = latestChange(puzzles);
  const daily = puzzles.find((puzzle) => puzzle.gameDate === today)?.updatedAt;
  const modified = (value: string | undefined) => value ? { lastModified: value } : {};
  return [
    { url: absoluteUrl("/"), ...modified(latestChange(puzzles.slice(0, 8))), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/today"), ...modified(daily), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/hints"), ...modified(daily), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/archive"), ...modified(latest), changeFrequency: "daily", priority: 0.8 },
    ...STATIC_PAGES.map((path) => ({ url: absoluteUrl(path), lastModified: "2026-10-15" })),
    ...puzzles.map((puzzle) => ({ url: absoluteUrl(`/archive/${puzzle.number}`), lastModified: puzzle.updatedAt })),
  ];
}
