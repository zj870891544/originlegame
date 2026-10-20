import { countryByCode, countryName, type Country } from "@/lib/countries";
import type { Puzzle } from "@/lib/db/puzzles";
import { closeMissPoints } from "@/lib/official/scoring";

/**
 * What the pages say about a puzzle, worked out from the official day data:
 * three hints that narrow down step by step, and the countries nearest to the
 * answer on the game's own distance table.
 */

export interface NearbyCountry {
  country: Country;
  km: number;
  /** What a game whose closest miss was this country scores. */
  points: number;
}

export function answerCountry(puzzle: Puzzle): Country {
  const country = countryByCode(puzzle.countryCode);
  if (!country) throw new Error(`Unknown country ${puzzle.countryCode}`);
  return country;
}

/** Other guesses recorded at 0 km in the game's distance table. */
export function zeroDistanceCountries(puzzle: Puzzle): Country[] {
  return Object.entries(puzzle.distances)
    .filter(([code, km]) => km === 0 && code !== puzzle.countryCode)
    .map(([code]) => countryByCode(code))
    .filter((country): country is Country => Boolean(country))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The closest guesses with a positive game distance, nearest first. */
export function closestCountries(puzzle: Puzzle, limit = 8): NearbyCountry[] {
  return Object.entries(puzzle.distances)
    .filter(([code, km]) => km > 0 && code !== puzzle.countryCode)
    .sort(([a, x], [b, y]) => x - y || a.localeCompare(b))
    .slice(0, limit)
    .flatMap(([code, km]) => {
      const country = countryByCode(code);
      return country ? [{ country, km, points: closeMissPoints(km) }] : [];
    });
}

export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-US")} km`;
}

function letterCount(name: string): number {
  return name.replace(/[^\p{L}]/gu, "").length;
}

/** Three hints, gentle to strong. An editor's hand-written set takes precedence. */
export function hintsFor(puzzle: Puzzle): string[] {
  if (puzzle.hints) return puzzle.hints;
  const country = answerCountry(puzzle);
  const zeroDistance = zeroDistanceCountries(puzzle);
  const guest = puzzle.guestName;

  const shape = country.landlocked ? "It is landlocked." : "It has a coastline.";
  const first = `${guest} represents a country in ${country.continent}. ${shape}`;

  const languages = country.languages.slice(0, 2);
  const speech = languages.length
    ? `Official languages include ${listNames(languages)}.`
    : "";
  const second = country.region !== country.continent
    ? `Narrow it to ${country.region}. ${speech}`.trim()
    : `${speech || "Think about which part of the continent the landscape clues point to."}`;

  const initial = country.name.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  const letters = letterCount(country.name);
  const words = country.name.split(/\s+/).length;
  const spelling = `The country's name starts with "${initial}" and has ${letters} letters${words > 1 ? ` across ${words} words` : ""}.`;
  const near = closestCountries(puzzle, 2).map((entry) => entry.country.name);
  const nearby = zeroDistance.length
    ? `The game's distance table records ${listNames(zeroDistance.map((c) => c.name))} at 0 km.`
    : near.length
      ? `Nearby guesses in the game's distance table include ${listNames(near)}.`
      : "";
  const third = `${spelling} ${nearby}`.trim();

  return [first, second, third];
}

/** "Clue 3 of 8" labels with the game's own titles, marking the clue that shows the outline. */
export function clueRoadmap(puzzle: Puzzle): { position: number; title: string; teaser: string; outline: boolean }[] {
  return puzzle.clues.map((clue, index) => ({
    position: index + 1,
    title: clue.title,
    teaser: clue.teaser,
    outline: clue.id === puzzle.outlineClue,
  }));
}

/** Guesses the game refuses for this guest, by name. */
export function refusedGuesses(puzzle: Puzzle): string[] {
  return puzzle.disabledGuesses.map(countryName);
}
