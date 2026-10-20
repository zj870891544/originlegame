import type { MetadataRoute } from "next";
import type { PuzzleSummary } from "@/lib/db/puzzles";
import type { GameDate } from "@/lib/time/game-day";
import { absoluteUrl } from "./site";
import { PUZZLE_GUIDE_EDITED, puzzleGuideModified } from "./puzzle";

/** Evergreen pages with the date of their last editorial change, never a request or build time. */
const STATIC_PAGES: [path: string, edited: string][] = [
  ["/how-to-play", "2026-10-20"],
  ["/originle-score-calculator", "2026-10-20"],
  ["/originle-solver", "2026-10-20"],
  ["/guess-where-im-from-game", "2026-10-20"],
  ["/games-like-originle", "2026-10-20"],
  ["/about", "2026-10-20"],
  ["/privacy", "2026-10-15"],
  ["/terms", "2026-10-15"],
];

/** These listing pages also contain editorial copy, independent of the puzzle records. */
const LISTING_EDITED = "2026-10-19";

function latestChange(puzzles: PuzzleSummary[], edited?: string): string | undefined {
  return puzzles.reduce<string | undefined>((latest, puzzle) =>
    !latest || puzzle.updatedAt > latest ? puzzle.updatedAt : latest, edited);
}

/** Missing data must not manufacture a new lastmod on every visit or midnight. */
export function buildSitemap(puzzles: PuzzleSummary[], today: GameDate): MetadataRoute.Sitemap {
  const latest = latestChange(puzzles, LISTING_EDITED);
  const dailyRecord = puzzles.find((puzzle) => puzzle.gameDate === today)?.updatedAt;
  const daily = dailyRecord ? puzzleGuideModified(dailyRecord) : undefined;
  const modified = (value: string | undefined) => value ? { lastModified: value } : {};
  return [
    { url: absoluteUrl("/"), ...modified(latestChange(puzzles.slice(0, 8), PUZZLE_GUIDE_EDITED)), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/today"), ...modified(daily), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/hints"), ...modified(daily), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/archive"), ...modified(latest), changeFrequency: "daily", priority: 0.8 },
    ...STATIC_PAGES.map(([path, edited]) => ({ url: absoluteUrl(path), lastModified: edited })),
    ...puzzles.map((puzzle) => ({ url: absoluteUrl(`/archive/${puzzle.number}`), lastModified: puzzleGuideModified(puzzle.updatedAt) })),
  ];
}
