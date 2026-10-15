/**
 * Game-day arithmetic for the daily Originle puzzle.
 *
 * Originle rolls over at midnight in New York. Everything here derives
 * from the IANA zone so daylight saving is handled by the runtime's tz data:
 * the rollover is 04:00 UTC during EDT and 05:00 UTC during EST, and we never
 * hard-code either.
 *
 * A "game date" is a plain `YYYY-MM-DD` calendar date in America/New_York.
 */

export const GAME_TIME_ZONE = "America/New_York";

export type GameDate = string;

const GAME_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: GAME_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(instant: Date): ZonedParts {
  const out: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(instant)) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
    minute: out.minute,
    second: out.second,
  };
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

function parseParts(gameDate: GameDate): { year: number; month: number; day: number } | null {
  const match = GAME_DATE_PATTERN.exec(gameDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  const real =
    probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  return real ? { year, month, day } : null;
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isValidGameDate(value: string): value is GameDate {
  return parseParts(value) !== null;
}

function requireParts(gameDate: GameDate) {
  const parts = parseParts(gameDate);
  if (!parts) throw new RangeError(`Invalid game date: ${gameDate}`);
  return parts;
}

/** Minutes that New York is ahead of UTC at this instant (-240 in EDT, -300 in EST). */
export function newYorkOffsetMinutes(instant: Date): number {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - instant.getTime()) / MS_PER_MINUTE);
}

/** The game date that is live at this instant. */
export function gameDateAt(instant: Date): GameDate {
  const p = zonedParts(instant);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

/** The instant a game date begins: 00:00:00 in New York on that date. */
export function startOfGameDay(gameDate: GameDate): Date {
  const { year, month, day } = requireParts(gameDate);
  const wallClockAsUtc = Date.UTC(year, month - 1, day);
  // Resolve the offset at the candidate instant, then once more in case the
  // first guess landed on the other side of a daylight-saving change.
  let instant = wallClockAsUtc - newYorkOffsetMinutes(new Date(wallClockAsUtc)) * MS_PER_MINUTE;
  instant = wallClockAsUtc - newYorkOffsetMinutes(new Date(instant)) * MS_PER_MINUTE;
  return new Date(instant);
}

/** Calendar arithmetic on game dates; unaffected by daylight saving. */
export function addDays(gameDate: GameDate, days: number): GameDate {
  const { year, month, day } = requireParts(gameDate);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** The next New York midnight strictly after this instant. */
export function nextResetAt(instant: Date): Date {
  return startOfGameDay(addDays(gameDateAt(instant), 1));
}

export function compareGameDates(a: GameDate, b: GameDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: GameDate, to: GameDate): number {
  const a = requireParts(from);
  const b = requireParts(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / MS_PER_DAY,
  );
}

export interface ResetClock {
  /** "EDT" or "EST". */
  abbreviation: "EDT" | "EST";
  isDaylightTime: boolean;
  /** Hour of the day, in UTC, at which the game rolls over (4 or 5). */
  resetHourUtc: number;
}

/** Which New York clock is in force at this instant, and the UTC hour of the rollover. */
export function resetClockAt(instant: Date): ResetClock {
  const offset = newYorkOffsetMinutes(instant);
  const isDaylightTime = offset === -240;
  return {
    abbreviation: isDaylightTime ? "EDT" : "EST",
    isDaylightTime,
    resetHourUtc: -offset / 60,
  };
}

export interface ClockChange {
  /** First game date whose rollover uses the new UTC hour. */
  firstAffectedGameDate: GameDate;
  /** The calendar date in New York on which clocks change. */
  changeDate: GameDate;
  from: ResetClock;
  to: ResetClock;
}

/**
 * The next daylight-saving change after this instant, found by comparing the
 * rollover offset of consecutive game days. Returns null if none occurs within
 * `horizonDays` (the zone could, in principle, stop observing DST).
 */
export function nextClockChange(instant: Date, horizonDays = 400): ClockChange | null {
  const today = gameDateAt(instant);
  let previous = resetClockAt(startOfGameDay(today));
  for (let i = 1; i <= horizonDays; i += 1) {
    const date = addDays(today, i);
    const clock = resetClockAt(startOfGameDay(date));
    if (clock.resetHourUtc !== previous.resetHourUtc) {
      return {
        firstAffectedGameDate: date,
        changeDate: addDays(date, -1),
        from: previous,
        to: clock,
      };
    }
    previous = clock;
  }
  return null;
}

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" });
const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

function asUtcNoon(gameDate: GameDate): Date {
  const { year, month, day } = requireParts(gameDate);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** "October 10, 2026" */
export function formatLongDate(gameDate: GameDate): string {
  return longDateFormatter.format(asUtcNoon(gameDate));
}

/** "Saturday" */
export function formatWeekday(gameDate: GameDate): string {
  return weekdayFormatter.format(asUtcNoon(gameDate));
}

/** "Oct 10" */
export function formatShortDate(gameDate: GameDate): string {
  return shortDateFormatter.format(asUtcNoon(gameDate));
}

/** "October 2026" for a `YYYY-MM` month key. */
export function formatMonth(monthKey: string): string {
  return monthYearFormatter.format(asUtcNoon(`${monthKey}-01`));
}

export function monthKeyOf(gameDate: GameDate): string {
  return gameDate.slice(0, 7);
}

export function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Day of week (0 = Sunday) for a game date. */
export function weekdayIndex(gameDate: GameDate): number {
  return asUtcNoon(gameDate).getUTCDay();
}

export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** A UTC instant written as "04:00 UTC". */
export function formatUtcTime(instant: Date): string {
  return `${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())} UTC`;
}

/** The day Originle published puzzle #1 (official schedule, checked 2026-10-15). */
export const LAUNCH_DATE: GameDate = "2026-10-05";

/** Puzzle number live on a game date: #1 on the launch date, one more each day. */
export function puzzleNumberOn(gameDate: GameDate, launchDate: GameDate = LAUNCH_DATE): number {
  return daysBetween(launchDate, gameDate) + 1;
}

/** The game date a puzzle number belongs to. */
export function dateOfPuzzle(number: number, launchDate: GameDate = LAUNCH_DATE): GameDate {
  return addDays(launchDate, number - 1);
}
