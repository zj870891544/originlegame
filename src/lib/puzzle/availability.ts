import type { TodayState } from "./load";

/** The official homepage's hiatus notice was verified on this date. */
export const HIATUS_CONFIRMED_ON = "2026-11-05";

/** Only show that notice while the latest published record is still the one it followed. */
export function isConfirmedHiatus({ today, puzzle, latestReleased, ok }: TodayState): boolean {
  return ok && !puzzle && today >= HIATUS_CONFIRMED_ON
    && latestReleased?.number === 31 && latestReleased.gameDate === "2026-11-04";
}
