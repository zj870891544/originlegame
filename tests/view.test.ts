import { describe, expect, it } from "vitest";
import type { Puzzle } from "@/lib/db/puzzles";
import { parseDay } from "@/lib/official/source";
import { closestCountries, hintsFor, zeroDistanceCountries } from "@/lib/puzzle/view";
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
  it("finds other countries recorded at zero game distance", () => {
    expect(zeroDistanceCountries(puzzle()).map((c) => c.code)).toEqual(["ET", "SO", "SS", "TZ", "UG"]);
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
    expect(hints[0]).toContain("It has a coastline.");
    expect(hints[1]).toContain("East Africa");
    expect(hints[1]).toContain("Swahili");
    expect(hints[2]).toContain('starts with "K" and has 5 letters');
    expect(hints[2]).toContain("The game's distance table records");
    expect(hints.join(" ")).not.toContain("Kenya");
  });

  it("does not turn Zimbabwe's zero-distance Namibia entry into a geographic border claim", () => {
    // Released puzzle #14's zero-distance entries are game data, not a geographic adjacency dataset.
    const day = puzzle({ number: 14, gameDate: "2026-10-18", guestName: "Ngoni", countryCode: "ZW", distances: { ZW: 0, BW: 0, MZ: 0, NA: 0, ZA: 0, ZM: 0 } });
    const hints = hintsFor(day);
    expect(zeroDistanceCountries(day).map((country) => country.code)).toEqual(["BW", "MZ", "NA", "ZA", "ZM"]);
    expect(hints[0]).toBe("Ngoni represents a country in Africa. It is landlocked.");
    expect(hints[2]).toContain("The game's distance table records Botswana, Mozambique, Namibia, South Africa and Zambia at 0 km.");
    expect(hints.join(" ")).not.toMatch(/\bborders?\b|across the water/);
  });

  it("does not infer a coastline country's borders or water separation from an empty zero-distance set", () => {
    const hints = hintsFor(puzzle({ distances: { KE: 0, ET: 100, RW: 349 } }));
    expect(hints[0]).toContain("It has a coastline.");
    expect(hints[2]).toContain("Nearby guesses in the game's distance table include Ethiopia and Rwanda.");
    expect(hints.join(" ")).not.toMatch(/\bborders?\b|across the water/);
  });

  it("uses an editor's hints when there are three", () => {
    expect(hintsFor(puzzle({ hints: ["a", "b", "c"] }))).toEqual(["a", "b", "c"]);
  });
});
