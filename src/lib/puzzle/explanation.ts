import { COUNTRY_COUNT } from "@/lib/countries";
import type { Puzzle } from "@/lib/db/puzzles";
import { GUESSES, closeMissPoints } from "@/lib/official/scoring";
import { puzzleAnswerSummary } from "@/lib/seo/puzzle";
import { formatLongDate } from "@/lib/time/game-day";
import { answerCountry, closestCountries, formatKm, listNames, zeroDistanceCountries } from "./view";

/** Safe to show before any answer is opened: no country or derived country facts. */
export function puzzleGuestSummary(puzzle: Pick<Puzzle, "number" | "gameDate" | "guestName" | "clues">): string {
  return `Originle #${puzzle.number} for ${formatLongDate(puzzle.gameDate)} (New York game date) features ${puzzle.guestName}. This round has ${puzzle.clues.length} video ${puzzle.clues.length === 1 ? "clue" : "clues"} and ${GUESSES} country guesses.`;
}

export interface ExplanationParagraph {
  heading: string;
  text: string;
}

/**
 * Context for a released answer, not an interpretation of unseen guest media.
 * Country facts and game distances stay explicitly separate from video evidence.
 */
export function explanationFor(puzzle: Puzzle): ExplanationParagraph[] {
  const country = answerCountry(puzzle);
  const region = country.region === country.continent ? country.continent : `${country.region}, within ${country.continent}`;
  const shape = country.landlocked ? "landlocked" : "having a coastline";
  const example = [
    ...zeroDistanceCountries(puzzle).map((nearby) => ({ country: nearby, km: 0 })),
    ...closestCountries(puzzle, COUNTRY_COUNT),
  ].find((nearby) => !puzzle.disabledGuesses.includes(nearby.country.code));

  const paragraphs: ExplanationParagraph[] = [
    {
      heading: "What confirms the answer",
      text: `${puzzleAnswerSummary(puzzle)} The confirmation is the country assignment in the official puzzle's published data.`,
    },
    {
      heading: "Region and geography",
      text: `This guide groups ${country.name} in ${region}. The country dataset marks it as ${shape}. These are useful facts for reviewing a broad geography clue, but do not establish which landscape appears in ${puzzle.guestName}'s video.`,
    },
  ];

  if (country.languages.length) {
    paragraphs.push({
      heading: "Language context",
      text: `The country dataset lists ${listNames(country.languages)} for ${country.name}. Language alone does not uniquely identify a country. These entries are background information, not a transcript or a claim about which language ${puzzle.guestName} speaks.`,
    });
  }

  if (example) {
    paragraphs.push({
      heading: "Reading this puzzle's distance feedback",
      text: `For Originle #${puzzle.number}, the game records ${example.country.name} at ${formatKm(example.km)} from ${country.name}. If no guess is correct and this is your closest guess, the published scoring formula gives ${closeMissPoints(example.km).toLocaleString("en-US")} points. This is a country-to-country game distance, not the guest's location.${example.km === 0 ? " A 0 km entry is a value in that table, not an independent check of physical borders." : ""}`,
    });
  }

  paragraphs.push({
    heading: "Avoid the common mix-ups",
    text: `${example ? `${example.country.name} would still be a wrong answer here, even with a recorded distance of ${formatKm(example.km)}. ` : ""}Only ${country.name} matches this puzzle's published country assignment. Originle asks which country a guest represents through roots and culture; the assignment does not establish ${puzzle.guestName}'s citizenship, current home or filming location.`,
  });

  return paragraphs;
}
