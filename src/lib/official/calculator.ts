import { CLUES, GUESSES, MAX_SCORE, closeMissPoints, cluePoints, solvedPoints } from "./scoring";

/**
 * The score calculator's arithmetic: a finished game described the way a player
 * remembers it (how many clues were open, how many guesses missed, how close the
 * nearest one came), scored exactly as the game's own scoring script does it.
 *
 *  - solved:  the clue points at the correct guess, less 30% for each earlier miss
 *  - missed:  all three guesses wrong, up to 1,000 for the closest
 *  - gave up: the same as missed, from the guesses made so far (0 with none)
 */

/** "original" is the scale the first two puzzles keep; everything from #3 uses "current". */
export type Rules = "current" | "original";
export type Outcome = "solved" | "missed" | "gave-up";

/** Puzzles that keep the original rules, by number (the game keys them by id: aya and mila). */
export const ORIGINAL_RULES_PUZZLES = [1, 2];
// Any id from the original-rules set makes the scoring functions use that scale.
const RULES_ID: Record<Rules, string> = { current: "", original: "aya" };

export function rulesForPuzzle(number: number): Rules {
  return ORIGINAL_RULES_PUZZLES.includes(number) ? "original" : "current";
}

export interface GameInput {
  rules: Rules;
  outcome: Outcome;
  /** Clues open at the correct guess (solved only), 1–8. */
  clue: number;
  /** Wrong guesses: before the right one (solved), or made before giving up. A missed game always has three. */
  misses: number;
  /** Border-to-border distance of the closest wrong guess, for games without a correct one. */
  km: number | null;
}

export interface GameScore {
  score: number;
  correct: boolean;
  /** What the open clues were worth before any miss (solved only). */
  clueValue: number | null;
  /** Points the opened clues cost, from 10,000 (solved only). */
  clueCost: number | null;
  /** Points the misses cost on top (solved only). */
  missCost: number | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/** A correct guess with `clue` clues open after `misses` wrong guesses, under the given rules. */
export function solvedUnder(rules: Rules, clue: number, misses: number): number {
  return solvedPoints(clamp(clue, 1, CLUES), clamp(misses, 0, GUESSES - 1), CLUES, RULES_ID[rules]);
}

export function scoreGame(input: GameInput): GameScore {
  const id = RULES_ID[input.rules];
  if (input.outcome === "solved") {
    const clue = clamp(input.clue, 1, CLUES);
    const misses = clamp(input.misses, 0, GUESSES - 1);
    const clueValue = cluePoints(clue, CLUES, id);
    const score = solvedPoints(clue, misses, CLUES, id);
    return { score, correct: true, clueValue, clueCost: MAX_SCORE - clueValue, missCost: clueValue - score };
  }
  const guesses = input.outcome === "missed" ? GUESSES : clamp(input.misses, 0, GUESSES - 1);
  const score = guesses === 0 || input.km === null ? 0 : closeMissPoints(input.km);
  return { score, correct: false, clueValue: null, clueCost: null, missCost: null };
}

export interface Stakes {
  /** A correct guess right now. */
  rightNow: number;
  /** A correct guess after revealing one more clue, or null on the last clue. */
  afterNextClue: number | null;
  /** A correct guess later, after a miss now, on the same clue; null when a miss now would be the third. */
  afterMiss: number | null;
}

/**
 * What the game puts at stake at a point in a round: the choice between guessing and another clue.
 * `total` is the day's clue count; the game prices clues by it (every day so far has eight).
 */
export function stakesAt(rules: Rules, clue: number, misses: number, total = CLUES): Stakes {
  const id = RULES_ID[rules];
  const c = clamp(clue, 1, total);
  const m = clamp(misses, 0, GUESSES - 1);
  return {
    rightNow: solvedPoints(c, m, total, id),
    afterNextClue: c < total ? solvedPoints(c + 1, m, total, id) : null,
    afterMiss: m < GUESSES - 1 ? solvedPoints(c, m + 1, total, id) : null,
  };
}

export interface ClueStep {
  clue: number;
  /** A correct first guess with this many clues open. */
  value: number;
  /** What revealing this clue costs, compared with the one before. */
  cost: number;
  /** What a wrong guess made on this clue costs a later correct answer. */
  missCost: number;
}

/** The price of each clue and of a miss on it. */
export function clueSteps(rules: Rules): ClueStep[] {
  const id = RULES_ID[rules];
  return Array.from({ length: CLUES }, (_, index) => {
    const clue = index + 1;
    const value = cluePoints(clue, CLUES, id);
    return {
      clue,
      value,
      cost: clue === 1 ? 0 : cluePoints(clue - 1, CLUES, id) - value,
      missCost: value - solvedPoints(clue, 1, CLUES, id),
    };
  });
}

export interface SharedResult {
  number: number;
  /** The score as printed, if present. */
  score: number | null;
  /** Clues open when the game ended. */
  clues: number;
  misses: number;
  solved: boolean;
  gaveUp: boolean;
}

const HIT = "\u{1F7E9}";
const MISS = "\u{1F7E5}";
const WHITE_FLAG = "\u{1F3F3}";

/**
 * Reads the text the game's Share button copies:
 *   Originle #11 · 6,480
 *   🟥🟩 · 3/8 clues
 * Returns null for anything that isn't a complete result.
 */
export function parseShareText(text: string): SharedResult | null {
  const header = /Originle\s*#\s*(\d{1,5})(?:\s*[·•-]\s*([\d,]+))?/i.exec(text);
  const progress = /(\d)\s*\/\s*8\s*clues?/i.exec(text);
  if (!header || !progress) return null;
  const marks = [...text].filter((char) => char === HIT || char === MISS);
  const misses = marks.filter((char) => char === MISS).length;
  const solved = marks.at(-1) === HIT;
  const gaveUp = text.includes(WHITE_FLAG);
  const clues = Number(progress[1]);
  const valid =
    clues >= 1 && clues <= CLUES &&
    marks.filter((char) => char === HIT).length === (solved ? 1 : 0) &&
    (solved ? !gaveUp && misses < GUESSES : gaveUp ? misses < GUESSES : misses === GUESSES);
  if (!valid) return null;
  const score = header[2] ? Number(header[2].replace(/,/g, "")) : null;
  return { number: Number(header[1]), score: Number.isFinite(score) ? score : null, clues, misses, solved, gaveUp };
}

/** The calculator's inputs for a shared result. The distance of a miss isn't in the text, so it stays unknown. */
export function inputFromShare(result: SharedResult): GameInput {
  return {
    rules: rulesForPuzzle(result.number),
    outcome: result.solved ? "solved" : result.gaveUp ? "gave-up" : "missed",
    clue: result.clues,
    misses: result.misses,
    km: null,
  };
}
