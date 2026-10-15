import { describe, expect, it } from "vitest";
import { dateOfPuzzle, gameDateAt, nextResetAt, puzzleNumberOn } from "@/lib/time/game-day";

describe("game day", () => {
  it("numbers puzzles from the launch date", () => {
    expect(puzzleNumberOn("2026-10-05")).toBe(1);
    expect(puzzleNumberOn("2026-10-14")).toBe(10);
    expect(dateOfPuzzle(9)).toBe("2026-10-13");
  });

  it("rolls over at midnight in New York, through daylight saving", () => {
    expect(gameDateAt(new Date("2026-10-15T03:59:59Z"))).toBe("2026-10-14");
    expect(gameDateAt(new Date("2026-10-15T04:00:00Z"))).toBe("2026-10-15");
    expect(nextResetAt(new Date("2026-11-02T12:00:00Z")).toISOString()).toBe("2026-11-03T05:00:00.000Z");
  });
});
