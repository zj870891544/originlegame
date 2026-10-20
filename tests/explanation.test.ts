import { describe, expect, it } from "vitest";
import type { Puzzle } from "@/lib/db/puzzles";
import { parseDay } from "@/lib/official/source";
import { explanationFor, puzzleGuestSummary } from "@/lib/puzzle/explanation";
import { dayScript } from "./fixtures";

function puzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    number: 10,
    gameDate: "2026-10-14",
    ...parseDay(dayScript(), "testa"),
    hints: null,
    editorNote: null,
    firstSeenAt: "2026-10-14T04:01:00.000Z",
    updatedAt: "2026-10-14T04:01:00.000Z",
    ...overrides,
  };
}

describe("dated puzzle explanation", () => {
  it("gives a spoiler-free guest/date summary with the actual clue count", () => {
    const text = puzzleGuestSummary(puzzle());
    expect(text).toContain("Originle #10 for October 14, 2026 (New York game date) features Testa");
    expect(text).toContain("4 video clues and 3 country guesses");
    expect(text).not.toContain("Kenya");
    expect(text).not.toContain("Nairobi");
    expect(text).not.toContain("Africa");
  });

  it("uses independent country facts and a published distance without inventing video evidence", () => {
    const day = puzzle({ number: 15, gameDate: "2026-10-19", guestName: "Leena", countryCode: "LK", distances: { LK: 0, IN: 38, MV: 755 } });
    const text = explanationFor(day).map((paragraph) => paragraph.text).join(" ");
    expect(text).toContain("The Originle #15 answer for October 19, 2026 is Sri Lanka. The guest is Leena.");
    expect(text).toContain("South Asia, within Asia");
    expect(text).toContain("having a coastline");
    expect(text).toContain("Sinhalese and Tamil");
    expect(text).toContain("not a transcript or a claim about which language Leena speaks");
    expect(text).toContain("the game records India at 38 km from Sri Lanka");
    expect(text).toContain("970 points");
    expect(text).toContain("India would still be a wrong answer");
    expect(text).not.toContain("Colombo");
    expect(text).not.toContain("Leena speaks Tamil");
  });

  it("does not turn a zero-distance entry into a claim about physical borders or residence", () => {
    const day = puzzle({ number: 14, gameDate: "2026-10-18", guestName: "Ngoni", countryCode: "ZW", distances: { ZW: 0, NA: 0, MW: 165 } });
    const text = explanationFor(day).map((paragraph) => paragraph.text).join(" ");
    expect(text).toContain("Zimbabwe in East Africa, within Africa");
    expect(text).toContain("landlocked");
    expect(text).toContain("Namibia at 0 km");
    expect(text).toContain("1,000 points");
    expect(text).toContain("not an independent check of physical borders");
    expect(text).toContain("does not establish Ngoni's citizenship, current home or filming location");
    expect(text).not.toContain("Zimbabwe borders Namibia");
  });

  it("does not use a refused guess as its playable distance example", () => {
    const day = puzzle({ distances: { KE: 0, GB: 0, RW: 349 }, disabledGuesses: ["GB"] });
    const text = explanationFor(day).map((paragraph) => paragraph.text).join(" ");
    expect(text).toContain("Rwanda at 349 km");
    expect(text).toContain("790 points");
    expect(text).not.toContain("United Kingdom");
  });

  it("omits a distance example if no other usable country record exists", () => {
    const text = explanationFor(puzzle({ distances: { KE: 0 } })).map((paragraph) => paragraph.text).join(" ");
    expect(text).toContain("Only Kenya matches this puzzle's published country assignment");
    expect(text).not.toContain("the game records");
    expect(text).not.toContain("0 km");
  });
});
