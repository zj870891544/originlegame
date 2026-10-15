import { describe, expect, it } from "vitest";
import { OfficialDataError, headlineCase, parseAssignment, parseDay, parseSchedule } from "@/lib/official/source";
import { dayScript, scheduleScript } from "./fixtures";

describe("parseAssignment", () => {
  it("reads the JSON object a data script assigns", () => {
    expect(parseAssignment('window.X={"a":1};', "X")).toEqual({ a: 1 });
  });

  it("refuses anything that isn't plain JSON instead of running it", () => {
    expect(() => parseAssignment("window.X={a: alert(1)};", "X")).toThrow(OfficialDataError);
    expect(() => parseAssignment("alert(1); window.X={}", "X")).toThrow(OfficialDataError);
    expect(() => parseAssignment('window.Y={"a":1};', "X")).toThrow(OfficialDataError);
  });
});

describe("parseSchedule", () => {
  it("accepts the official shape", () => {
    expect(parseSchedule(scheduleScript(["aya", "mila"])).puzzles).toEqual(["aya", "mila"]);
  });

  it("rejects duplicates, bad ids and other time zones", () => {
    expect(() => parseSchedule(scheduleScript(["aya", "aya"]))).toThrow(OfficialDataError);
    expect(() => parseSchedule(scheduleScript(["Aya!"]))).toThrow(OfficialDataError);
    expect(() => parseSchedule(scheduleScript(["aya"]).replace("America/New_York", "UTC"))).toThrow(OfficialDataError);
  });
});

describe("parseDay", () => {
  it("keeps the guest, the answer, the clue titles and the distances", () => {
    const day = parseDay(dayScript(), "testa");
    expect(day).toMatchObject({ slug: "testa", guestName: "Testa", countryCode: "KE", countryLabel: "Kenya", outlineClue: "t-08" });
    expect(day.clues.map((c) => c.title)).toEqual(["Welcome", "A Little of My Language", "From the Kitchen", "Where I Am"]);
    expect(day.distances.KE).toBe(0);
    expect(day.sourceUrl).toBe("https://originle.io/testa/");
  });

  it("keeps guesses the game refuses, without the answer itself", () => {
    const day = parseDay(dayScript({ disabledGuesses: ["GB", "KE"], guessNote: "A UK national." }), "testa");
    expect(day.disabledGuesses).toEqual(["GB"]);
    expect(day.guessNote).toBe("A UK national.");
  });

  it("stops on data it can't vouch for", () => {
    expect(() => parseDay(dayScript({ answer: "ZZ" }), "x")).toThrow(/unknown country/);
    expect(() => parseDay(dayScript({ distances: { KE: 0 } }), "x")).toThrow(/incomplete/);
    expect(() => parseDay(dayScript({ clues: [] }), "x")).toThrow(OfficialDataError);
  });
});

describe("headlineCase", () => {
  it("capitalises words but not small ones in the middle", () => {
    expect(headlineCase("THE BUDDHA’S BIRTHPLACE")).toBe("The Buddha’s Birthplace");
    expect(headlineCase("RUNNING FOR GOLD")).toBe("Running for Gold");
    expect(headlineCase("LIFE & CULTURE")).toBe("Life & Culture");
  });
});
