import { describe, expect, it } from "vitest";
import type { Puzzle } from "@/lib/db/puzzles";
import { parseDay } from "@/lib/official/source";
import { borderingCountries, closestCountries, hintsFor } from "@/lib/puzzle/view";
import { dayScript } from "./fixtures";

function puzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  const day = parseDay(dayScript(), "testa");
  return {
    number: 10,
    gameDate: "2026-10-14",
    ...day,
    hints: null,
    editorNote: null,
    firstSeenAt: "2026-10-14T04:01:00.000Z",
    updatedAt: "2026-10-14T04:01:00.000Z",
    ...overrides,
  };
}

describe("puzzle view", () => {
  it("finds the countries that share a border", () => {
    expect(borderingCountries(puzzle()).map((c) => c.code)).toEqual(["ET", "SO", "SS", "TZ", "UG"]);
  });

  it("lists the next closest countries with their close-miss points", () => {
    const closest = closestCountries(puzzle(), 3);
    expect(closest.map((c) => [c.country.code, c.km, c.points])).toEqual([
      ["RW", 349, 790],
      ["CD", 352, 790],
      ["BI", 403, 760],
    ]);
  });

  it("writes three hints that get stronger, never naming the country", () => {
    const hints = hintsFor(puzzle());
    expect(hints).toHaveLength(3);
    expect(hints[0]).toContain("Africa");
    expect(hints[0]).toContain("5 countries");
    expect(hints[1]).toContain("East Africa");
    expect(hints[1]).toContain("Swahili");
    expect(hints[2]).toContain('starts with "K" and has 5 letters');
    expect(hints.join(" ")).not.toContain("Kenya");
  });

  it("uses an editor's hints when there are three", () => {
    expect(hintsFor(puzzle({ hints: ["a", "b", "c"] }))).toEqual(["a", "b", "c"]);
  });
});
