import { countryName } from "@/lib/countries";
import type { Puzzle } from "@/lib/db/puzzles";
import { formatLongDate } from "@/lib/time/game-day";

/** Last editorial update to shared puzzle content and play links. */
export const PUZZLE_GUIDE_EDITED = "2026-11-05T07:20:48.000Z";

/** Page content can change independently of the official puzzle record. */
export function puzzleGuideModified(updatedAt: string): string {
  return updatedAt > PUZZLE_GUIDE_EDITED ? updatedAt : PUZZLE_GUIDE_EDITED;
}

/** A dated, self-contained answer using only the stored released puzzle. */
export function puzzleAnswerSummary(puzzle: Pick<Puzzle, "number" | "gameDate" | "countryCode" | "guestName">): string {
  return `The Originle #${puzzle.number} answer for ${formatLongDate(puzzle.gameDate)} is ${countryName(puzzle.countryCode)}. The guest is ${puzzle.guestName}.`;
}
