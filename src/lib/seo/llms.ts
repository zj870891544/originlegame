import type { TodayState } from "@/lib/puzzle/load";
import { countryName } from "@/lib/countries";
import { HIATUS_CONFIRMED_ON, isConfirmedHiatus } from "@/lib/puzzle/availability";
import { addDays, formatLongDate } from "@/lib/time/game-day";
import { SITE, absoluteUrl } from "./site";

/** A plain-text summary of the site for language models (llmstxt.org). */
export function llmsText(state: TodayState): string {
  const puzzle = state.ok && state.puzzle?.gameDate === state.today ? state.puzzle : null;
  const previous = state.ok && state.yesterday?.gameDate === addDays(state.today, -1)
    ? state.yesterday
    : null;
  const gameDay = `Game date: ${state.today} (America/New_York).`;
  const hiatus = isConfirmedHiatus(state);
  let availability = "The guide's puzzle database is unavailable, so today's guest and answer could not be checked.";
  if (hiatus) {
    availability = `The official Originle hiatus notice was confirmed on ${formatLongDate(HIATUS_CONFIRMED_ON)} at ${SITE.officialGameUrl}.`;
  } else if (state.ok) {
    availability = "This guide has not yet synced the guest and answer for this game day. This does not establish whether the official game has published it.";
  }
  const latest = !puzzle && state.ok && state.latestReleased;
  if (latest) {
    availability += ` Latest published puzzle: Originle #${latest.number} (${formatLongDate(latest.gameDate)}), ${absoluteUrl(`/archive/${latest.number}`)}.`;
  }
  const today = puzzle
    ? `${gameDay} Today is Originle #${puzzle.number} (${formatLongDate(state.today)}). The guest is ${puzzle.guestName}, who represents ${countryName(puzzle.countryCode)}. Hints: ${absoluteUrl("/hints")}. Answer page: ${absoluteUrl("/today")}. Permanent page for this date: ${absoluteUrl(`/archive/${puzzle.number}`)}. Public source: ${puzzle.sourceUrl}day.js.

Guide record first stored: ${puzzle.firstSeenAt}. Guide record last changed: ${puzzle.updatedAt}. These are this guide's record timestamps, not the official game's publication time.`
    : `${gameDay} ${availability}`;
  const yesterday = previous
    ? `Yesterday, Originle #${previous.number}: ${previous.guestName} represented ${countryName(previous.countryCode)}.`
    : "";
  return `# ${SITE.name}

> ${SITE.description} ${SITE.disclaimer}

Originle (${SITE.officialGameUrl}) is a free daily geography game. In each released puzzle, a real person appears in eight short video clues and players guess the country they represent in three guesses, scored out of 10,000. The game day starts at midnight in New York. Past puzzles are playable in the official archive.

${today}
${yesterday}

## Pages

- [Originle answer today](${absoluteUrl("/today")}): today's answer, nearby countries and close-miss scores
- [Originle hints](${absoluteUrl("/hints")}): three hints of increasing strength, plus the clue titles
- [Originle archive](${absoluteUrl("/archive")}): every past puzzle, each with its own page at /archive/<number>
- [How to play Originle](${absoluteUrl("/how-to-play")}): rules, exact scoring tables, tips, FAQ
- [Originle score calculator](${absoluteUrl("/originle-score-calculator")}): a score from the clues opened and wrong guesses, or from the game's share text; what each clue and miss costs
- [Originle country solver](${absoluteUrl("/originle-solver")}): filters candidates using wrong guesses and their distances, plus an optional continent; independent map estimates with adjustable tolerance, not a lookup of today's answer
- [Guess where someone is from game](${absoluteUrl("/guess-where-im-from-game")}): for people who saw the game but don't know its name; how it works and why the answer is about roots, not nationality
- [Games like Originle](${absoluteUrl("/games-like-originle")}): similar daily geography games
- [About and sources](${absoluteUrl("/about")}): where the data comes from

The /today and /hints pages follow the current New York game day. Each /archive/<number> page keeps one puzzle's hints, answer and sources after the next reset.
`.replace(/\n{3,}/g, "\n\n");
}
