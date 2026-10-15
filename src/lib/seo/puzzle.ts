import { countryName } from "@/lib/countries";
import type { Puzzle } from "@/lib/db/puzzles";
import { formatLongDate } from "@/lib/time/game-day";

/** A dated, self-contained answer using only the stored released puzzle. */
export function puzzleAnswerSummary(puzzle: Pick<Puzzle, "number" | "gameDate" | "countryCode" | "guestName">): string {
  return `The Originle #${puzzle.number} answer for ${formatLongDate(puzzle.gameDate)} is ${countryName(puzzle.countryCode)}. The guest is ${puzzle.guestName}.`;
}
