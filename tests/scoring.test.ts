import { describe, expect, it } from "vitest";
import { closeMissPoints, cluePoints, solvedPoints } from "@/lib/official/scoring";

describe("Originle scoring", () => {
  it("prices the eight clues as the game does", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((clue) => cluePoints(clue))).toEqual([10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000]);
  });

  it("keeps 70% per miss", () => {
    expect(solvedPoints(1, 1)).toBe(7000);
    expect(solvedPoints(4, 1)).toBe(5950);
    expect(solvedPoints(8, 2)).toBe(1470);
  });

  it("scores close misses by distance", () => {
    expect(closeMissPoints(0)).toBe(1000);
    expect(closeMissPoints(214)).toBe(870);
    expect(closeMissPoints(1500)).toBe(370);
    expect(closeMissPoints(-1)).toBe(0);
  });

  it("keeps the original rules for the first two guests", () => {
    expect([1, 2, 7, 8].map((clue) => cluePoints(clue, 8, "aya"))).toEqual([10000, 9000, 4000, 2500]);
    expect(solvedPoints(2, 1, 8, "mila")).toBe(8500);
  });
});
