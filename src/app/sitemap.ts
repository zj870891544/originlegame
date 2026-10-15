import type { MetadataRoute } from "next";
import { safeRead } from "@/lib/db/client";
import { listPuzzles } from "@/lib/db/puzzles";
import { buildSitemap } from "@/lib/seo/sitemap";
import { gameDateAt } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

/** Only pages that exist: evergreen pages, and a page for every stored puzzle up to today. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = gameDateAt(new Date());
  const { data: puzzles } = await safeRead((db) => listPuzzles(db, today), []);
  return buildSitemap(puzzles, today);
}
