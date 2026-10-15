import { safeRead } from "@/lib/db/client";
import { getPuzzle, getPuzzleOn, getRecentPuzzles, type Puzzle } from "@/lib/db/puzzles";
import { addDays, gameDateAt, puzzleNumberOn, type GameDate } from "@/lib/time/game-day";

export interface TodayState {
  today: GameDate;
  /** Today's puzzle number by the calendar, whether or not it is stored yet. */
  number: number;
  puzzle: Puzzle | null;
  yesterday: Puzzle | null;
  /** False when the database could not be read at all. */
  ok: boolean;
}

/** Today's and yesterday's puzzles. A missing today never falls back to an older one. */
export async function loadToday(now = new Date()): Promise<TodayState> {
  const today = gameDateAt(now);
  const { data, ok } = await safeRead(
    async (db) => Promise.all([getPuzzleOn(db, today), getPuzzleOn(db, addDays(today, -1))]),
    [null, null] as [Puzzle | null, Puzzle | null],
  );
  return { today, number: puzzleNumberOn(today), puzzle: data[0], yesterday: data[1], ok };
}

export async function loadPuzzle(number: number, now = new Date()): Promise<Puzzle | null> {
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const { data } = await safeRead((db) => getPuzzle(db, number, gameDateAt(now)), null);
  return data;
}

export async function loadRecent(limit: number, now = new Date()): Promise<Puzzle[]> {
  const { data } = await safeRead((db) => getRecentPuzzles(db, gameDateAt(now), limit), []);
  return data;
}
