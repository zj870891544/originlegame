import Link from "@/components/shared/Link";
import type { Puzzle } from "@/lib/db/puzzles";
import {
  answerCountry,
  borderingCountries,
  closestCountries,
  clueRoadmap,
  formatKm,
  hintsFor,
  listNames,
  refusedGuesses,
} from "@/lib/puzzle/view";
import { countryInSentence } from "@/lib/countries";
import { formatLongDate } from "@/lib/time/game-day";
import { Envelope } from "./Envelope";
import { Postmark } from "./Postmark";
import { RevealAll } from "./RevealAll";

const HINT_NAMES = ["A nudge", "Closer", "Nearly there"];

/** Three hints in separate envelopes, gentle to strong. */
export function HintEnvelopes({ puzzle }: { puzzle: Puzzle }) {
  const hints = hintsFor(puzzle);
  return (
    <div className="grid gap-3">
      {hints.map((hint, index) => (
        <Envelope
          key={index}
          label={`Hint ${index + 1}: ${HINT_NAMES[index]}`}
          note={index === 0 ? "The continent and the coastline" : index === 1 ? "The region and the languages" : "The spelling and the neighbours"}
          action="Open hint"
          event="hint_open"
          level={index + 1}
        >
          <p className="text-[1.05rem]">{hint}</p>
        </Envelope>
      ))}
    </div>
  );
}

/** The game's own titles for the eight clues. Later titles give a lot away. */
export function ClueRoadmap({ puzzle }: { puzzle: Puzzle }) {
  const clues = clueRoadmap(puzzle);
  return (
    <Envelope
      label={`The ${clues.length} clue titles`}
      note="The topics of each video, in the order the game reveals them. Later ones give a lot away."
      action="Show titles"
      event="roadmap_open"
    >
      <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {clues.map((clue) => (
          <li key={clue.position} className="flex gap-3">
            <span className="w-6 shrink-0 text-right font-display font-semibold text-teal">{clue.position}</span>
            <span>
              <span className="font-semibold">{clue.title}</span>
              {clue.outline ? <span className="muted"> (the country outline appears)</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </Envelope>
  );
}

/** The answer as an inked stamp, with the plain facts about the country. */
export function AnswerEnvelope({ puzzle, headingLevel = "h3" }: { puzzle: Puzzle; headingLevel?: "h2" | "h3" }) {
  const country = answerCountry(puzzle);
  const refused = refusedGuesses(puzzle);
  const Heading = headingLevel;
  return (
    <Envelope label={`Originle #${puzzle.number} answer`} note="Only open this when you're ready." action="Show answer" event="answer_reveal">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="stamp" aria-hidden="true">
          <span className="stamp-meta">ORIGINLE #{puzzle.number}</span>
          <span className="stamp-country">{country.name.toUpperCase()}</span>
          <span className="stamp-meta">{formatLongDate(puzzle.gameDate).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1 basis-64">
          <Heading className="subheading">
            {`${puzzle.guestName} represents ${countryInSentence(country)} `}
            <span aria-hidden="true">{country.flag}</span>
          </Heading>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.98rem]">
            <dt className="muted">Region</dt>
            <dd>{country.region === country.continent ? country.continent : `${country.region}, ${country.continent}`}</dd>
            {country.capital ? (
              <>
                <dt className="muted">Capital</dt>
                <dd>{country.capital}</dd>
              </>
            ) : null}
            {country.languages.length ? (
              <>
                <dt className="muted">Languages</dt>
                <dd>{listNames(country.languages.slice(0, 4))}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>
      {refused.length || puzzle.guessNote ? (
        <p className="mt-4 rounded border border-rule bg-paper px-3 py-2 text-[0.95rem]">
          {puzzle.guessNote ?? ""}
          {refused.length ? ` The game won't accept ${listNames(refused)} as a guess for this guest.` : ""}
        </p>
      ) : null}
    </Envelope>
  );
}

/** Countries next to the answer on the game's distance table, and what a miss on each scores. */
export function NearbyCountries({ puzzle, headingLevel = "h2" }: { puzzle: Puzzle; headingLevel?: "h2" | "h3" }) {
  const country = answerCountry(puzzle);
  const borders = borderingCountries(puzzle);
  const closest = closestCountries(puzzle, 8);
  const Heading = headingLevel;
  return (
    <section aria-labelledby={`nearby-${puzzle.number}`}>
      <Heading id={`nearby-${puzzle.number}`} className="heading">
        Close misses for #{puzzle.number}
      </Heading>
      <p className="mt-3 max-w-[66ch] muted">
        After a wrong guess Originle tells you how far it was from {country.name}, measured border to border. A guess that
        touches the answer&apos;s border is 0 km away. If all three guesses miss, your score comes from the closest one.
      </p>
      <Envelope label="Show the nearby countries" note="This names the answer's neighbours, so it narrows things down a lot." action="Show">
        {borders.length ? (
          <p>
            <span className="font-semibold">0 km, sharing a border:</span> {listNames(borders.map((c) => `${c.flag} ${c.name}`))}. A miss on
            any of these still scores 1,000.
          </p>
        ) : (
          <p>
            <span className="font-semibold">{country.name} has no land border</span> with another country, so every miss is some distance away.
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="ledger min-w-[22rem]">
            <caption className="sr-only">Nearest countries without a shared border</caption>
            <thead>
              <tr>
                <th scope="col">Next closest</th>
                <th scope="col" className="num">
                  Distance
                </th>
                <th scope="col" className="num">
                  Points for this miss
                </th>
              </tr>
            </thead>
            <tbody>
              {closest.map((entry) => (
                <tr key={entry.country.code}>
                  <td>
                    <span aria-hidden="true">{entry.country.flag}</span> {entry.country.name}
                  </td>
                  <td className="num">{formatKm(entry.km)}</td>
                  <td className="num">{entry.points.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Envelope>
    </section>
  );
}

/**
 * Today's (or any day's) puzzle as a postcard: who the guest is, the hints,
 * the clue titles and the answer, each folded away until asked for.
 */
export function PuzzleCard({
  puzzle,
  title,
  headingLevel = "h2",
  showNearbyLink = true,
}: {
  puzzle: Puzzle;
  title?: string;
  headingLevel?: "h1" | "h2";
  showNearbyLink?: boolean;
}) {
  const Heading = headingLevel;
  return (
    <article className="sheet p-4 sm:p-7" data-reveal-scope>
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-rule pb-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal">
            Originle #{puzzle.number}, {formatLongDate(puzzle.gameDate)}
          </p>
          <Heading className="mt-2 font-display text-[clamp(1.8rem,1.4rem+1.8vw,2.6rem)] font-bold">
            {title ?? `Where is ${puzzle.guestName} from?`}
          </Heading>
          <p className="mt-2 max-w-[52ch] muted">
            Open the hints one at a time. The answer stays folded away until you ask for it.
          </p>
        </div>
        <Postmark number={puzzle.number} date={puzzle.gameDate} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">3 hints, then the clue titles, then the answer</p>
        <RevealAll />
      </div>
      <div className="mt-4 grid gap-3">
        <HintEnvelopes puzzle={puzzle} />
        <ClueRoadmap puzzle={puzzle} />
        <AnswerEnvelope puzzle={puzzle} />
      </div>
      {showNearbyLink ? (
        <p className="mt-5 text-[0.95rem]">
          Missed?{" "}
          <Link href={`/archive/${puzzle.number}#nearby-${puzzle.number}`} className="inline-link">
            See the close misses and their scores for #{puzzle.number}
          </Link>
          .
        </p>
      ) : null}
    </article>
  );
}
