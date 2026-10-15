import type { MetadataRoute } from "next";
import { safeRead } from "@/lib/db/client";
import { listPuzzles } from "@/lib/db/puzzles";
import { absoluteUrl } from "@/lib/seo/site";
import { gameDateAt, startOfGameDay } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

/** Evergreen pages and the date their content was last materially edited. */
const STATIC_PAGES: { path: string; lastModified: string }[] = [
  { path: "/how-to-play", lastModified: "2026-10-15" },
  { path: "/games-like-originle", lastModified: "2026-10-15" },
  { path: "/about", lastModified: "2026-10-15" },
  { path: "/privacy", lastModified: "2026-10-15" },
  { path: "/terms", lastModified: "2026-10-15" },
];

/** Only pages that exist: evergreen pages, and a page for every stored puzzle up to today. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = gameDateAt(new Date());
  const { data: puzzles } = await safeRead((db) => listPuzzles(db, today), []);
  const latest = puzzles.reduce<Date>((max, p) => (new Date(p.updatedAt) > max ? new Date(p.updatedAt) : max), startOfGameDay(today));
  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/today"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/hints"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/archive"), lastModified: latest, changeFrequency: "daily", priority: 0.8 },
    ...STATIC_PAGES.map((page) => ({ url: absoluteUrl(page.path), lastModified: page.lastModified })),
    ...puzzles.map((puzzle) => ({ url: absoluteUrl(`/archive/${puzzle.number}`), lastModified: new Date(puzzle.updatedAt) })),
  ];
}
