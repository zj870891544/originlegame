import type { Metadata } from "next";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { ScoreCalculator } from "@/components/puzzle/ScoreCalculator";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { clueSteps } from "@/lib/official/calculator";
import { CLOSE_MISS_MAX, CLUES, GUESSES, MAX_SCORE, closeMissPoints, solvedPoints } from "@/lib/official/scoring";
import { webToolJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { gameDateAt, puzzleNumberOn } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Originle Score Calculator: Clues, Misses & Points",
  description:
    "Work out any Originle score: pick the clue you solved on and your wrong guesses, or paste your share result. What each clue and each miss costs, 0 km, and the best possible score.",
  path: "/originle-score-calculator",
});

const fmt = (n: number) => n.toLocaleString("en-US");
const steps = clueSteps("current");
const lowestCorrect = solvedPoints(CLUES, GUESSES - 1);
const firstFourClues = steps.slice(1, 5).reduce((sum, step) => sum + step.cost, 0);

const FAQ = [
  {
    question: "What is the highest possible Originle score?",
    answer: `${fmt(MAX_SCORE)}: the right country from the first video, with no wrong guesses. The lowest score for a right answer is ${fmt(lowestCorrect)}, on the last clue after two misses.`,
  },
  {
    question: "How much does each Originle clue cost?",
    answer: `Each clue costs 250 points more than the one before: clue 2 costs 250, clue 3 costs 500, and so on up to ${fmt(steps[CLUES - 1].cost)} for clue ${CLUES}, the outline. A right answer on the last clue is worth ${fmt(steps[CLUES - 1].value)} before any miss.`,
  },
  {
    question: "What is the penalty for a wrong guess in Originle?",
    answer: `Each wrong guess keeps only 70% of what a right answer is worth, so it costs 30%. A miss on clue 1 costs ${fmt(steps[0].missCost)}, more than clues 2 to 5 together (${fmt(firstFourClues)}). You have ${GUESSES} guesses.`,
  },
  {
    question: "How does distance scoring work in Originle?",
    answer: `It only counts when no guess is right. Your closest guess then scores 1,000 × e^(−km / 1,500), rounded to tens: ${fmt(closeMissPoints(0))} at 0 km, ${fmt(closeMissPoints(500))} at 500 km, ${fmt(closeMissPoints(1500))} at 1,500 km. A 0 km guess shares a border with the answer.`,
  },
  {
    question: "What score do you get for giving up in Originle?",
    answer: `The same as missing all three: your closest guess so far scores up to ${fmt(CLOSE_MISS_MAX)}. Giving up before any guess scores 0.`,
  },
  {
    question: "Is this the official Originle calculator?",
    answer:
      "No. It's an independent tool that uses the scoring formula published in the game's own code, checked on October 16, 2026. Your score in the game is the one that counts.",
  },
];

export default function ScoreCalculatorPage() {
  const number = puzzleNumberOn(gameDateAt(new Date()));
  return (
    <PageShell
      path="/originle-score-calculator"
      crumbName="Score calculator"
      title="Originle score calculator"
      lead="Tell it how your round went, or paste the result the game's Share button copies. It shows your score, what the clues and misses cost, and what one clue fewer would have earned."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-14">
          <section aria-label="Calculator">
            <ScoreCalculator />
          </section>

          <section aria-labelledby="costs">
            <h2 id="costs" className="heading">
              What each clue and each miss costs
            </h2>
            <p className="mt-3 max-w-[66ch] muted">
              Clues start cheap and get dearer. A wrong guess is dear from the start, because it takes 30% of everything a right answer is
              still worth.
            </p>
            <div className="sheet mt-6 overflow-x-auto">
              <table className="ledger min-w-[30rem]">
                <caption className="sr-only">Cost of each Originle clue and of a wrong guess on it</caption>
                <thead>
                  <tr>
                    <th scope="col">Clue</th>
                    <th scope="col" className="num">
                      Revealing it costs
                    </th>
                    <th scope="col" className="num">
                      Right answer worth
                    </th>
                    <th scope="col" className="num">
                      A miss on it costs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => (
                    <tr key={step.clue}>
                      <th scope="row" className="text-left font-semibold">
                        {step.clue}
                        {step.clue === 1 ? " (free)" : step.clue === CLUES ? " (outline)" : ""}
                      </th>
                      <td className="num">{step.cost ? fmt(step.cost) : "0"}</td>
                      <td className="num">{fmt(step.value)}</td>
                      <td className="num">{fmt(step.missCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[0.97rem] muted">
              A miss costs a share of what&apos;s left, so a second miss costs less than the first. Every right answer and miss combination
              is in the{" "}
              <Link href="/how-to-play#scoring" className="inline-link">
                full scoring table
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="how" className="prose-block">
            <h2 id="how" className="heading">
              How Originle works out your score
            </h2>
            <ul>
              <li>
                <strong>Right answer:</strong> the points for the clues open at that moment, then 70% of that for each earlier wrong guess.
                The game ends at the first right answer.
              </li>
              <li>
                <strong>Three misses:</strong> up to {fmt(CLOSE_MISS_MAX)} for your closest guess, by its border-to-border distance from the
                answer. Any right answer, even {fmt(lowestCorrect)}, beats the best miss.
              </li>
              <li>
                <strong>Giving up:</strong> the same as missing, from the guesses you made; 0 with none.
              </li>
            </ul>
            <p>
              Puzzles #1 and #2 keep the scale they were first played under: 1,000 points per clue, 2,500 for the last, and 500 per miss.
              Choose &ldquo;#1 or #2&rdquo; in the calculator for those.
            </p>
          </section>

          <section aria-labelledby="decide" className="prose-block">
            <h2 id="decide" className="heading">
              Guess now, or one more clue?
            </h2>
            <p>
              Compare the two prices. On clue 3, the next clue costs {fmt(steps[3].cost)}; a wrong guess costs {fmt(steps[2].missCost)}. If
              you&apos;d put your guess at less than about a three-in-four chance, the clue is the better buy. At the end it flips: on clue 7
              the outline costs {fmt(steps[7].cost)} but a miss only {fmt(steps[6].missCost)}, so a reasonable guess beats waiting for it.
            </p>
            <p>
              Stuck between countries? Our{" "}
              <Link href="/hints" className="inline-link">
                hints for today
              </Link>{" "}
              cost nothing, and the clue tracker there shows the stakes for the clue you&apos;re on.
            </p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="heading">
              Originle scoring questions
            </h2>
            <div className="mt-6">
              <Faq items={FAQ} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="numbers" className="sheet p-5">
            <h2 id="numbers" className="subheading">
              The numbers to know
            </h2>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[0.97rem]">
              <dt className="muted">Highest score</dt>
              <dd className="text-right font-semibold tabular-nums">{fmt(MAX_SCORE)}</dd>
              <dt className="muted">Lowest right answer</dt>
              <dd className="text-right font-semibold tabular-nums">{fmt(lowestCorrect)}</dd>
              <dt className="muted">Best without a right answer</dt>
              <dd className="text-right font-semibold tabular-nums">{fmt(CLOSE_MISS_MAX)}</dd>
              <dt className="muted">Giving up with no guess</dt>
              <dd className="text-right font-semibold tabular-nums">0</dd>
              <dt className="muted">A miss keeps</dt>
              <dd className="text-right font-semibold tabular-nums">70%</dd>
            </dl>
          </section>
          <PlayOfficial number={number} campaign="score_calculator" />
        </aside>
      </div>
      <JsonLd
        data={webToolJsonLd({
          name: "Originle score calculator",
          path: "/originle-score-calculator",
          description: "Works out an Originle score from the clues opened and wrong guesses made, or from the game's share text.",
        })}
      />
    </PageShell>
  );
}
