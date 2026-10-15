import type { Metadata } from "next";
import { Awaiting } from "@/components/puzzle/Awaiting";
import { Postmark } from "@/components/puzzle/Postmark";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { AnswerEnvelope, ClueRoadmap, HintEnvelopes } from "@/components/puzzle/PuzzleGuide";
import { RevealAll } from "@/components/puzzle/RevealAll";
import { SourceNote } from "@/components/puzzle/SourceNote";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { solvedPoints } from "@/lib/official/scoring";
import { getToday } from "@/lib/puzzle/request";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { formatLongDate } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { number, puzzle, today } = await getToday();
  return pageMetadata({
    title: `Originle Hints Today #${number}: Spoiler-Free Clues`,
    description: puzzle
      ? `Three Originle hints for #${number} (${formatLongDate(today)}): the continent, then the region and languages, then the spelling and neighbours. Where is ${puzzle.guestName} from?`
      : `Spoiler-free Originle hints for #${number} (${formatLongDate(today)}) appear here soon after midnight Eastern.`,
    path: "/hints",
    ogType: "article",
    ...(puzzle ? { published: puzzle.firstSeenAt, modified: puzzle.updatedAt } : {}),
  });
}

const CLUE_READING = [
  {
    title: "Language",
    text: "Listen for the sound before the words: tones, rolled r's, clicks, long compound words. Even a greeting narrows the field to a language family.",
  },
  {
    title: "Something from home",
    text: "Food and objects travel with people, so treat them as a region, not a country. A spice mix or a snack points to a shared cuisine.",
  },
  {
    title: "Landscape and weather",
    text: "Snow and deserts in one country, monsoons, islands, high plateaus: climate rules out whole continents at once.",
  },
  {
    title: "A sense of scale",
    text: "How long it takes to cross the country, or how many people live there, separates small neighbours from big ones.",
  },
  {
    title: "The last clue",
    text: "The final clue shows where the country sits and its outline. It's worth 3,000 at most, so use it as a safety net, not a plan.",
  },
];

export default async function HintsPage() {
  const { number, puzzle, today, ok } = await getToday();
  return (
    <PageShell
      path="/hints"
      crumbName="Hints"
      title={`Originle hints today: #${number}`}
      lead={`${formatLongDate(today)}. Each hint gives away a little more than the one before. Open one, play a clue or two on originle.io, and come back if you need the next.`}
      aside={puzzle ? <Postmark number={puzzle.number} date={puzzle.gameDate} /> : undefined}
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {puzzle ? (
            <section aria-labelledby="hints" data-reveal-scope>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="hints" className="heading">
                  Where is {puzzle.guestName} from?
                </h2>
                <RevealAll label="Open every hint" />
              </div>
              <div className="mt-5 grid gap-3">
                <HintEnvelopes puzzle={puzzle} />
                <ClueRoadmap puzzle={puzzle} />
              </div>
              <h2 className="heading mt-12">Still stuck?</h2>
              <p className="mt-3 max-w-[62ch] muted">
                The answer is below. You can also read the{" "}
                <Link href="/today" className="inline-link">
                  full answer page
                </Link>{" "}
                with the countries closest to it.
              </p>
              <div className="mt-4">
                <AnswerEnvelope puzzle={puzzle} />
              </div>
              <div className="mt-6">
                <SourceNote puzzle={puzzle} />
              </div>
              <JsonLd
                data={articleJsonLd({
                  headline: `Originle #${number} hints (${formatLongDate(today)})`,
                  path: "/hints",
                  published: puzzle.firstSeenAt,
                  modified: puzzle.updatedAt,
                })}
              />
            </section>
          ) : (
            <Awaiting number={number} today={today} dbOk={ok} />
          )}

          <section aria-labelledby="reading">
            <h2 id="reading" className="heading">
              How to read each kind of clue
            </h2>
            <p className="mt-3 max-w-[64ch] muted">
              The clue titles change every day, but most guests cover the same ground. Here is what each kind of clue is good for.
            </p>
            <dl className="mt-6 divide-y divide-rule border-y border-rule">
              {CLUE_READING.map((clue) => (
                <div key={clue.title} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <dt className="font-display text-lg font-semibold">{clue.title}</dt>
                  <dd className="muted">{clue.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <aside className="min-w-0 space-y-10">
          <PlayOfficial number={number} campaign="hints" />
          <section aria-labelledby="when" className="sheet p-5">
            <h2 id="when" className="subheading">
              When to guess
            </h2>
            <p className="mt-2 text-[0.98rem] muted">
              A right answer on clue 3 scores {solvedPoints(3, 0).toLocaleString("en-US")}. Waiting for clue 5 drops that to{" "}
              {solvedPoints(5, 0).toLocaleString("en-US")}, but a wrong guess on clue 3 followed by a right one on clue 4 scores only{" "}
              {solvedPoints(4, 1).toLocaleString("en-US")}. When you&apos;re torn between two countries, one more clue is usually cheaper
              than a miss.
            </p>
            <p className="mt-3 text-[0.98rem]">
              <Link href="/how-to-play#scoring" className="inline-link">
                See every score in the scoring tables
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
