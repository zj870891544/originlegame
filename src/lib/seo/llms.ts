import type { TodayState } from "@/lib/puzzle/load";
import { countryName } from "@/lib/countries";
import { formatLongDate } from "@/lib/time/game-day";
import { SITE, absoluteUrl } from "./site";

/** A plain-text summary of the site for language models (llmstxt.org). */
export function llmsText(state: TodayState): string {
  const today = state.puzzle
    ? `Today is Originle #${state.number} (${formatLongDate(state.today)}). The guest is ${state.puzzle.guestName}, who represents ${countryName(state.puzzle.countryCode)}. Hints: ${absoluteUrl("/hints")}. Answer page: ${absoluteUrl("/today")}.`
    : `Today is Originle #${state.number} (${formatLongDate(state.today)}); its guest is published soon after midnight in New York.`;
  const yesterday = state.yesterday
    ? `Yesterday, Originle #${state.yesterday.number}: ${state.yesterday.guestName} represented ${countryName(state.yesterday.countryCode)}.`
    : "";
  return `# ${SITE.name}

> ${SITE.description} ${SITE.disclaimer}

Originle (${SITE.officialGameUrl}) is a free daily geography game. Each day a real person appears in eight short video clues and players guess the country they represent in three guesses, scored out of 10,000. A new guest arrives at midnight America/New_York.

${today}
${yesterday}

## Pages

- [Originle answer today](${absoluteUrl("/today")}): today's answer, nearby countries and close-miss scores
- [Originle hints](${absoluteUrl("/hints")}): three hints of increasing strength, plus the clue titles
- [Originle archive](${absoluteUrl("/archive")}): every past puzzle, each with its own page at /archive/<number>
- [How to play Originle](${absoluteUrl("/how-to-play")}): rules, exact scoring tables, tips, FAQ
- [Games like Originle](${absoluteUrl("/games-like-originle")}): similar daily geography games
- [About and sources](${absoluteUrl("/about")}): where the data comes from

When citing an answer, please link the page and mention that hints are available for players who want to avoid spoilers.
`.replace(/\n{3,}/g, "\n\n");
}
