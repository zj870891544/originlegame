import { describe, expect, it } from "vitest";
import { clueSteps, inputFromShare, parseShareText, rulesForPuzzle, scoreGame, stakesAt } from "@/lib/official/calculator";

describe("score calculator", () => {
  it("scores a solved game as the game does, with what the clues and misses cost", () => {
    expect(scoreGame({ rules: "current", outcome: "solved", clue: 3, misses: 1, km: null })).toEqual({
      score: 6480,
      correct: true,
      clueValue: 9250,
      clueCost: 750,
      missCost: 2770,
    });
    expect(scoreGame({ rules: "current", outcome: "solved", clue: 1, misses: 0, km: null }).score).toBe(10000);
    expect(scoreGame({ rules: "current", outcome: "solved", clue: 8, misses: 2, km: null }).score).toBe(1470);
  });

  it("uses the original scale for the first two puzzles", () => {
    expect(rulesForPuzzle(2)).toBe("original");
    expect(rulesForPuzzle(3)).toBe("current");
    expect(scoreGame({ rules: "original", outcome: "solved", clue: 2, misses: 1, km: null }).score).toBe(8500);
  });

  it("scores games without a correct guess from the closest miss, and a give-up with no guesses as 0", () => {
    expect(scoreGame({ rules: "current", outcome: "missed", clue: 8, misses: 3, km: 0 }).score).toBe(1000);
    expect(scoreGame({ rules: "current", outcome: "missed", clue: 8, misses: 3, km: 1500 }).score).toBe(370);
    expect(scoreGame({ rules: "current", outcome: "gave-up", clue: 4, misses: 0, km: 0 }).score).toBe(0);
    expect(scoreGame({ rules: "current", outcome: "gave-up", clue: 4, misses: 2, km: 214 }).score).toBe(870);
  });

  it("clamps impossible inputs instead of inventing scores", () => {
    expect(scoreGame({ rules: "current", outcome: "solved", clue: 12, misses: 5, km: null }).score).toBe(1470);
  });

  it("prices each clue and a miss on it", () => {
    const steps = clueSteps("current");
    expect(steps.map((step) => step.cost)).toEqual([0, 250, 500, 750, 1000, 1250, 1500, 1750]);
    expect(steps[0].missCost).toBe(3000);
    expect(steps[7].missCost).toBe(900);
  });

  it("shows the stakes of guessing now against one more clue", () => {
    expect(stakesAt("current", 3, 0)).toEqual({ rightNow: 9250, afterNextClue: 8500, afterMiss: 6480 });
    expect(stakesAt("current", 8, 2)).toEqual({ rightNow: 1470, afterNextClue: null, afterMiss: null });
  });
});

describe("share text", () => {
  it("reads a solved result", () => {
    const result = parseShareText("Originle #11 · 6,480\n🟥🟩 · 3/8 clues\nhttps://originle.io/sofia/?day=11");
    expect(result).toEqual({ number: 11, score: 6480, clues: 3, misses: 1, solved: true, gaveUp: false });
    expect(scoreGame(inputFromShare(result!)).score).toBe(6480);
  });

  it("reads a missed game and a give-up", () => {
    expect(parseShareText("Originle #9 · 620\n🟥🟥🟥 · 8/8 clues")).toMatchObject({ misses: 3, solved: false, gaveUp: false });
    expect(parseShareText("Originle #9 · 0\n🏳️ · 2/8 clues")).toMatchObject({ misses: 0, solved: false, gaveUp: true });
    expect(inputFromShare(parseShareText("Originle #9 · 0\n🟥🏳️ · 2/8 clues")!).outcome).toBe("gave-up");
  });

  it("rejects text that isn't a complete result", () => {
    expect(parseShareText("hello")).toBeNull();
    expect(parseShareText("Originle #9 · 620\n🟥🟥 · 8/8 clues")).toBeNull();
    expect(parseShareText("Originle #9\n🟩🟩 · 2/8 clues")).toBeNull();
    expect(parseShareText("Originle #9\n🟩 · 9/8 clues")).toBeNull();
  });
});

describe("stakes on a day with fewer clues", () => {
  it("prices clues by the day's clue count, as the game does", () => {
    expect(stakesAt("current", 3, 0, 4)).toEqual({ rightNow: 6500, afterNextClue: 3000, afterMiss: 4550 });
  });
});
