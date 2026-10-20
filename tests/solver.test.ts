import { describe, expect, it } from "vitest";
import { COUNTRY_ROWS } from "@/data/countries";
import { SOLVER_CODES, SOLVER_DISTANCE_ROWS } from "@/data/solver-distances";
import { DEFAULT_TOLERANCE_KM, getModelDistanceKm, MAX_DISTANCE_KM, SOLVER_COUNTRIES, solveCountries } from "@/lib/solver";

describe("independent boundary-distance model", () => {
  it("covers all 197 guess countries with finite, symmetric, nonconstant distances", () => {
    expect(SOLVER_CODES).toHaveLength(197);
    expect([...SOLVER_CODES].sort()).toEqual(COUNTRY_ROWS.map((country) => country.code).sort());
    expect(SOLVER_COUNTRIES).toHaveLength(197);
    const distinct = new Set<number>();
    for (const [index, code] of SOLVER_CODES.entries()) {
      expect(SOLVER_DISTANCE_ROWS[index]).toHaveLength(SOLVER_CODES.length - index - 1);
      expect(getModelDistanceKm(code, code)).toBe(0);
      for (const other of SOLVER_CODES) {
        const km = getModelDistanceKm(code, other)!;
        expect(Number.isInteger(km)).toBe(true);
        expect(km).toBeGreaterThanOrEqual(0);
        expect(km).toBeLessThanOrEqual(MAX_DISTANCE_KM);
        expect(km).toBe(getModelDistanceKm(other, code));
        distinct.add(km);
      }
    }
    expect(distinct.size).toBeGreaterThan(100);
  });

  it("uses country boundaries, including microstates and enclaves, rather than capitals", () => {
    for (const [a, b] of [["FR", "DE"], ["IT", "VA"], ["IT", "SM"], ["ZA", "LS"], ["FR", "AD"]]) {
      expect(getModelDistanceKm(a, b)).toBe(0);
    }
    expect(getModelDistanceKm("GB", "FR")).toBeGreaterThan(20);
    expect(getModelDistanceKm("GB", "FR")).toBeLessThan(45);
  });

  it("keeps date-line and island geography close without flattening it across the map", () => {
    expect(getModelDistanceKm("US", "RU")).toBeLessThan(200);
    expect(getModelDistanceKm("FJ", "TO")).toBeGreaterThan(0);
    expect(getModelDistanceKm("FJ", "TO")).toBeLessThan(1_000);
    expect(getModelDistanceKm("TV", "NR")).toBeGreaterThan(100);
    expect(getModelDistanceKm("PS", "IL")).toBe(0);
    expect(getModelDistanceKm("TW", "CN")).toBeLessThan(200);
    expect(getModelDistanceKm("XK", "AL")).toBe(0);
  });

  it("normalizes known country codes and rejects unknown ones", () => {
    expect(getModelDistanceKm(" fr ", "de")).toBe(0);
    expect(getModelDistanceKm("XX", "DE")).toBeNull();
  });
});

describe("country solver constraints", () => {
  it("starts without any answer or implied candidates before feedback is supplied", () => {
    const result = solveCountries({ guesses: [] });
    expect(result.status).toBe("empty");
    expect(result.candidates).toEqual([]);
    expect(result.toleranceKm).toBe(DEFAULT_TOLERANCE_KM);
  });

  it("accepts a zero-distance wrong guess and excludes the guessed country", () => {
    const result = solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }], toleranceKm: 0 });
    expect(result.status).toBe("matches");
    expect(result.candidates.some((candidate) => candidate.country.code === "DE")).toBe(true);
    expect(result.candidates.some((candidate) => candidate.country.code === "FR")).toBe(false);
    expect(result.candidates.every((candidate) => candidate.maxErrorKm === 0)).toBe(true);
  });

  it("combines every feedback row and an optional continent", () => {
    const one = solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }], toleranceKm: 0 });
    const two = solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }, { countryCode: "PL", distanceKm: 0 }], continent: "Europe", toleranceKm: 0 });
    expect(two.status).toBe("matches");
    expect(two.candidates.some((candidate) => candidate.country.code === "DE")).toBe(true);
    expect(two.candidates.length).toBeLessThan(one.candidates.length);
    expect(two.candidates.every((candidate) => candidate.country.continent === "Europe" && candidate.comparisons.length === 2)).toBe(true);
    expect(two.candidates.every((candidate) => candidate.country.code !== "FR" && candidate.country.code !== "PL")).toBe(true);
  });

  it("includes the tolerance boundary and preserves narrow candidates when widened", () => {
    const guesses = [{ countryCode: "FR", distanceKm: 100 }];
    const narrow = solveCountries({ guesses, toleranceKm: 99 });
    const wide = solveCountries({ guesses, toleranceKm: 100 });
    expect(narrow.candidates.some((candidate) => candidate.country.code === "DE")).toBe(false);
    expect(wide.candidates.find((candidate) => candidate.country.code === "DE")?.comparisons[0]).toEqual({ guessedCode: "FR", shownKm: 100, modelKm: 0, errorKm: 100 });
    expect(narrow.candidates.every((candidate) => wide.candidates.some((other) => other.country.code === candidate.country.code))).toBe(true);
  });

  it("returns no matches for inconsistent feedback instead of injecting today's answer", () => {
    const result = solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }, { countryCode: "DE", distanceKm: MAX_DISTANCE_KM }], toleranceKm: 0 });
    expect(result.status).toBe("no-matches");
    expect(result.candidates).toEqual([]);
    expect(result.message).toContain("widen the tolerance");
  });

  it("reports invalid inputs, duplicate wrong guesses and out-of-range tolerance", () => {
    for (const distanceKm of [-1, NaN, Infinity, MAX_DISTANCE_KM + 1]) {
      expect(solveCountries({ guesses: [{ countryCode: "FR", distanceKm }] }).status).toBe("invalid");
    }
    expect(solveCountries({ guesses: [{ countryCode: "XX", distanceKm: 0 }] }).status).toBe("invalid");
    expect(solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }], continent: "Atlantis" }).status).toBe("invalid");
    expect(solveCountries({ guesses: [{ countryCode: "FR", distanceKm: 0 }, { countryCode: "fr", distanceKm: 100 }] }).status).toBe("invalid");
    expect(solveCountries({ guesses: [], toleranceKm: 2_001 }).status).toBe("invalid");
    expect(solveCountries({ guesses: [], toleranceKm: NaN }).toleranceKm).toBe(DEFAULT_TOLERANCE_KM);
    expect(solveCountries({ guesses: ["FR", "DE", "PL", "IT"].map((countryCode) => ({ countryCode, distanceKm: 0 })) }).status).toBe("invalid");
  });
});
