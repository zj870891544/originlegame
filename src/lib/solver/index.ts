import { COUNTRY_ROWS } from "@/data/countries";
import { SOLVER_CODES, SOLVER_DATA_META, SOLVER_DISTANCE_ROWS } from "@/data/solver-distances";
import type { Country } from "@/lib/countries";

export const DEFAULT_TOLERANCE_KM = 100;
export const MAX_TOLERANCE_KM = 2_000;
export const MAX_DISTANCE_KM = 20_040;
export const MAX_SOLVER_GUESSES = 3;

export const SOLVER_COUNTRIES: readonly Country[] = [...COUNTRY_ROWS].sort((a, b) => a.name.localeCompare(b.name));
export const SOLVER_CONTINENTS: readonly string[] = [...new Set(COUNTRY_ROWS.map((country) => country.continent))].sort();

export const SOLVER_MODEL = {
  ...SOLVER_DATA_META,
  name: "Natural Earth border-distance model",
  precisionNote: "Approximate spherical distances between sampled country boundaries. Map generalization, boundary definitions and overseas footprints can differ substantially from Originle. A wider tolerance can help, but does not guarantee that the correct country is included.",
  footprintNote: "Uses each primary Natural Earth country feature, including all of its polygon parts. Separately listed dependencies, leases and disputed islands are not merged into other countries.",
} as const;

export interface GuessFeedback {
  countryCode: string;
  distanceKm: number;
}

export interface SolverInput {
  guesses: readonly GuessFeedback[];
  continent?: string;
  toleranceKm?: number;
}

export interface SolverComparison {
  guessedCode: string;
  shownKm: number;
  modelKm: number;
  errorKm: number;
}

export interface SolverCandidate {
  country: Country;
  maxErrorKm: number;
  meanErrorKm: number;
  comparisons: SolverComparison[];
}

export interface SolverResult {
  status: "empty" | "matches" | "no-matches" | "invalid";
  candidates: SolverCandidate[];
  toleranceKm: number;
  message?: string;
}

const indexByCode = new Map<string, number>(SOLVER_CODES.map((code, index) => [code, index]));

/** A static, independent boundary estimate. Unknown codes have no estimate. */
export function getModelDistanceKm(fromCode: string, toCode: string): number | null {
  const from = indexByCode.get(fromCode.trim().toUpperCase());
  const to = indexByCode.get(toCode.trim().toUpperCase());
  if (from === undefined || to === undefined) return null;
  if (from === to) return 0;
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  return SOLVER_DISTANCE_ROWS[low][high - low - 1];
}

/**
 * Filter all 197 countries against every wrong-guess distance independently.
 * This module never reads today's puzzle, guest, answer, database or clock.
 */
export function solveCountries(input: SolverInput): SolverResult {
  const tolerance = input.toleranceKm ?? DEFAULT_TOLERANCE_KM;
  const invalid = (message: string): SolverResult => ({
    status: "invalid",
    candidates: [],
    toleranceKm: Number.isFinite(tolerance) ? tolerance : DEFAULT_TOLERANCE_KM,
    message,
  });
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > MAX_TOLERANCE_KM) {
    return invalid(`Choose a tolerance from 0 to ${MAX_TOLERANCE_KM.toLocaleString("en-US")} km.`);
  }
  if (!Array.isArray(input.guesses) || input.guesses.length > MAX_SOLVER_GUESSES) {
    return invalid(`Enter up to ${MAX_SOLVER_GUESSES} wrong guesses.`);
  }
  if (input.continent && !SOLVER_CONTINENTS.includes(input.continent)) {
    return invalid("Choose a continent from the list, or leave it as Any continent.");
  }
  if (!input.guesses.length) {
    return { status: "empty", candidates: [], toleranceKm: tolerance, message: "Add a country you guessed and the distance shown by the game." };
  }

  const guesses: GuessFeedback[] = [];
  const excluded = new Set<string>();
  for (const guess of input.guesses) {
    const countryCode = typeof guess.countryCode === "string" ? guess.countryCode.trim().toUpperCase() : "";
    if (!indexByCode.has(countryCode)) return invalid("Choose a guessed country from the list.");
    if (!Number.isFinite(guess.distanceKm) || guess.distanceKm < 0 || guess.distanceKm > MAX_DISTANCE_KM) {
      return invalid(`Enter a distance from 0 to ${MAX_DISTANCE_KM.toLocaleString("en-US")} km for each guess.`);
    }
    if (excluded.has(countryCode)) return invalid("Use each guessed country once.");
    excluded.add(countryCode);
    guesses.push({ countryCode, distanceKm: guess.distanceKm });
  }

  const candidates: SolverCandidate[] = [];
  for (const country of SOLVER_COUNTRIES) {
    if (excluded.has(country.code) || (input.continent && country.continent !== input.continent)) continue;
    const comparisons = guesses.map((guess): SolverComparison => {
      const modelKm = getModelDistanceKm(guess.countryCode, country.code)!;
      return { guessedCode: guess.countryCode, shownKm: guess.distanceKm, modelKm, errorKm: Math.abs(modelKm - guess.distanceKm) };
    });
    const maxErrorKm = Math.max(...comparisons.map((comparison) => comparison.errorKm));
    if (maxErrorKm > tolerance) continue;
    candidates.push({ country, maxErrorKm, meanErrorKm: comparisons.reduce((total, comparison) => total + comparison.errorKm, 0) / comparisons.length, comparisons });
  }
  candidates.sort((a, b) => a.maxErrorKm - b.maxErrorKm || a.meanErrorKm - b.meanErrorKm || a.country.name.localeCompare(b.country.name));
  return {
    status: candidates.length ? "matches" : "no-matches",
    candidates,
    toleranceKm: tolerance,
    ...(candidates.length ? {} : { message: "No countries match every feedback row at this tolerance. Check the countries and distances, or widen the tolerance." }),
  };
}
