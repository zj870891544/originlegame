/**
 * Originle's published scoring, worked out again here so the site can print
 * exact tables. Scores are out of 10,000 and a game allows three guesses.
 *
 *  - A correct guess is worth the points of the clue open at that moment
 *    (each clue costs 250 more than the last: 10,000 9,750 9,250 … 3,000),
 *    then keeps 70% of that for each earlier miss.
 *  - A game with no correct guess scores up to 1,000 for its closest miss:
 *    1,000 × e^(−km / 1,500), border to border, rounded to tens.
 *  - The first two puzzles (game ids "aya" and "mila", 5 and 6 October 2026; the
 *    second guest's name is Emiliia) keep the rules they were played under:
 *    1,000 per clue (the last leaves 2,500) and 500 per miss. A game with no
 *    correct guess scores its closest miss on every puzzle, these two included.
 *
 * Checked against the game's own scoring script on 2026-10-16.
 */

export const MAX_SCORE = 10_000;
export const GUESSES = 3;
export const CLUES = 8;
export const MISS_KEEPS = 0.7;
export const CLOSE_MISS_MAX = 1_000;
export const CLOSE_MISS_SCALE_KM = 1_500;
const LAST_CLUE_POINTS = 3_000;
const ORIGINAL_RULES = new Set(["aya", "mila"]);

export function usesOriginalRules(slug: string): boolean {
  return ORIGINAL_RULES.has(slug);
}

/** Points on offer with `clue` clues open (1-based), before any miss. */
export function cluePoints(clue: number, total = CLUES, slug = ""): number {
  if (usesOriginalRules(slug)) {
    return clue >= total ? 2_500 : Math.round((MAX_SCORE - (6_000 * (clue - 1)) / Math.max(1, total - 2)) / 100) * 100;
  }
  if (clue >= total) return LAST_CLUE_POINTS;
  return Math.round((MAX_SCORE - ((MAX_SCORE - LAST_CLUE_POINTS) * clue * (clue - 1)) / (total * (total - 1))) / 50) * 50;
}

/** What a correct guess scores with `clue` clues open after `misses` wrong guesses. */
export function solvedPoints(clue: number, misses: number, total = CLUES, slug = ""): number {
  if (usesOriginalRules(slug)) return cluePoints(clue, total, slug) - 500 * misses;
  // Whole-number arithmetic, as the game does it, so halves round the same way.
  return Math.round((cluePoints(clue, total, slug) * 7 ** misses) / 10 ** (misses + 1)) * 10;
}

/** Points for a game that never finds the country, from its closest miss. */
export function closeMissPoints(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.round((CLOSE_MISS_MAX * Math.exp(-km / CLOSE_MISS_SCALE_KM)) / 10) * 10;
}
