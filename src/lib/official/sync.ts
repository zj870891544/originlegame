import type { PuzzleStore, SaveResult } from "@/lib/db/puzzles";
import { dateOfPuzzle, gameDateAt, puzzleNumberOn } from "@/lib/time/game-day";
import { OfficialDataError, fetchDay, fetchSchedule, type OfficialDay } from "./source";

/**
 * Keeps the puzzles table in step with the official game.
 *
 * Each run reads the schedule, then fetches today's guest (unless it was
 * checked within the refresh interval) and any released day not stored yet,
 * newest first, at most `maxFetches` days per run. Run it as often as you
 * like: an unchanged day only has its check time updated.
 */

export const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;
export const MAX_FETCHES_PER_RUN = 20;

export interface SyncReport {
  gameDate: string;
  /** Today's puzzle number per the official schedule. */
  todayNumber: number;
  saved: { number: number; result: SaveResult }[];
  /** Days the game is still holding back (it answered 403/404). */
  held: number[];
  /** Days left for a later run because of the per-run limit. */
  deferred: number;
}

export async function contentHash(day: OfficialDay, number: number): Promise<string> {
  const canonical = JSON.stringify([number, day.slug, day.guestName, day.countryCode, day.countryLabel, day.clues, day.outlineClue,
    Object.entries(day.distances).sort(([a], [b]) => a.localeCompare(b)), day.disabledGuesses, day.guessNote]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function syncOfficial(
  store: PuzzleStore,
  fetchImpl: typeof fetch,
  now: Date,
  options: { refreshIntervalMs?: number; maxFetches?: number; force?: boolean } = {},
): Promise<SyncReport> {
  const startedAt = now.toISOString();
  const gameDate = gameDateAt(now);
  try {
    const schedule = await fetchSchedule(fetchImpl);
    const todayNumber = puzzleNumberOn(gameDate, schedule.launchDate);
    const released = Math.min(todayNumber, schedule.puzzles.length);
    const stored = new Map((await store.stored()).map((row) => [row.number, row]));
    const interval = options.refreshIntervalMs ?? REFRESH_INTERVAL_MS;

    const due: number[] = [];
    for (let number = released; number >= 1; number -= 1) {
      const slug = schedule.puzzles[number - 1];
      const row = stored.get(number);
      const missing = !row || row.slug !== slug;
      const stale = number === todayNumber && (!row || now.getTime() - Date.parse(row.checkedAt) >= interval);
      if (missing || stale || options.force) due.push(number);
    }
    const limit = options.maxFetches ?? MAX_FETCHES_PER_RUN;
    const batch = due.slice(0, limit);

    const report: SyncReport = { gameDate, todayNumber, saved: [], held: [], deferred: due.length - batch.length };
    for (const number of batch) {
      const day = await fetchDay(fetchImpl, schedule.puzzles[number - 1]);
      if (!day) {
        report.held.push(number);
        continue;
      }
      const hash = await contentHash(day, number);
      const result = await store.save(number, dateOfPuzzle(number, schedule.launchDate), day, hash, now.toISOString());
      report.saved.push({ number, result });
    }
    await store.logRun({ startedAt, finishedAt: new Date().toISOString(), status: "succeeded", gameDate, summary: describeSync(report), error: null });
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await store.logRun({ startedAt, finishedAt: new Date().toISOString(), status: "failed", gameDate, summary: null, error: message.slice(0, 500) }).catch(() => undefined);
    throw error instanceof OfficialDataError ? error : new OfficialDataError(message);
  }
}

export function describeSync(report: SyncReport): string {
  const counts = { created: 0, updated: 0, unchanged: 0 };
  for (const { result } of report.saved) counts[result] += 1;
  const parts = [`${report.gameDate} (#${report.todayNumber})`, `${counts.created} new`, `${counts.updated} updated`, `${counts.unchanged} unchanged`];
  if (report.held.length) parts.push(`held back: #${report.held.join(", #")}`);
  if (report.deferred) parts.push(`${report.deferred} left for the next run`);
  return parts.join(", ");
}

/** Numbers whose pages changed in this run, for search-engine pings. */
export function changedNumbers(report: SyncReport): number[] {
  return report.saved.filter((entry) => entry.result !== "unchanged").map((entry) => entry.number);
}
