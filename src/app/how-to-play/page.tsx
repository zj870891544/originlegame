import type { Metadata } from "next";
import { LocalResetTime } from "@/components/puzzle/LocalResetTime";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { COUNTRY_COUNT } from "@/lib/countries";
import { CLUES, GUESSES, MAX_SCORE, closeMissPoints, cluePoints, solvedPoints } from "@/lib/official/scoring";
import { originleGameJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { officialUrl } from "@/lib/seo/site";
import { gameDateAt, puzzleNumberOn } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "How to Play Originle: Rules, Scoring & Tips",
  description:
    "How to play Originle: meet the guest, open up to eight video clues and name their country in three guesses. Exact scoring tables, close-miss points, tips and FAQ.",
  path: "/how-to-play",
});

const fmt = (n: number) => n.toLocaleString("en-US");
const clueRange = Array.from({ length: CLUES }, (_, i) => i + 1);
const DISTANCES = [0, 100, 250, 500, 1000, 1500, 2500, 4000];

const RULE_CARD = [
  { title: "Goal", text: "Name the country today's guest represents through their roots and culture, not necessarily where they live now." },
  { title: "Your moves", text: "Watch the first video, open the next clue when you need it, lock in a guess, or give up. A globe lets you mark and shortlist countries." },
  { title: "Feedback", text: "A wrong guess shows its distance from the answer, border to border. Your remaining points show what a right answer is still worth." },
  { title: "End of the round", text: "The round ends on a correct guess, your third miss, or giving up. A new guest arrives at midnight Eastern." },
];

const EASY_TO_MISS = [
  "Clues get dearer as you go: the second costs 250 points, the last one 1,750. The early ones are the cheap ones.",
  "A wrong guess costs 30% of whatever a right answer was worth at that point, so a miss on clue 1 costs 3,000, more than the next four clues together.",
  "Missing all three guesses, or giving up, still scores up to 1,000 for your closest guess.",
  "Neighbours that share a border with the answer count as 0 km away for that close-miss score.",
  "The game can refuse a guess for a particular guest, such as the passport country of someone representing their family's homeland.",
  "Puzzles #1 and #2 keep the original rules when you replay them in the archive.",
];

const TIPS = [
  { title: "Listen to the first video twice", text: "It's free. Names, accents and background details are all evidence, and a right answer now is worth 10,000." },
  { title: "Think region before country", text: "A dish or a festival usually belongs to several neighbours. Pin down the region, then look for the clue that splits it." },
  { title: "Don't trust the accent", text: "Many guests grew up abroad. The answer is the country they represent, so weigh culture and language over how they sound in English." },
  { title: "Buy a clue instead of a coin flip", text: "Torn between two countries? The next clue costs at most 1,750; a wrong guess costs 30% of everything." },
  { title: "Read the distance", text: "Under 500 km means you're next door: stay in the region. Thousands of kilometres means a different part of the world." },
  { title: "Save a guess for the outline", text: "The last clue shows the country's shape. On hard days, keep one guess in hand for it." },
];

const COMPARE = [
  { game: "Originle", find: "The country a real person represents", from: "Eight short videos of the guest", tries: "3 guesses", daily: "Midnight Eastern" },
  { game: "Worldle", find: "A country", from: "Its silhouette, then distance and direction", tries: "6 guesses", daily: "Daily" },
  { game: "Globle", find: "A country", from: "A globe that colours your guesses by closeness", tries: "Unlimited", daily: "Daily" },
  { game: "GeoGuessr", find: "A spot on the map", from: "Street View imagery", tries: "One pin per round", daily: "Daily challenge" },
];

const FAQ = [
  { question: "Is Originle free?", answer: "Yes. Originle is free to play in any web browser at originle.io, with no account or download." },
  {
    question: "How many guesses do you get in Originle?",
    answer: `Three. Each wrong guess keeps only 70% of what a right answer is worth, and if all ${GUESSES} miss you still score up to 1,000 for the closest one.`,
  },
  { question: "How many clues are there?", answer: `Eight video clues per guest. The first is free; each after it lowers the points on offer, and the last shows the country's outline.` },
  { question: "What's the highest score?", answer: `${fmt(MAX_SCORE)}, for naming the country from the first video without a miss.` },
  {
    question: "When does a new Originle come out?",
    answer: "Every day at midnight in New York: 04:00 UTC in summer (EDT) and 05:00 UTC in winter (EST).",
    body: (
      <>
        Every day at midnight in New York: 04:00 UTC in summer (EDT) and 05:00 UTC in winter (EST).
        <LocalResetTime />
      </>
    ),
  },
  {
    question: "Why was my Originle guess wrong?",
    answer:
      "Only the exact country counts, and it's the country the guest represents through their roots and culture, not necessarily where they live. An American or Australian accent doesn't mean the answer is the US or Australia. The game can also refuse a particular country as a guess for a guest, such as a passport country.",
  },
  {
    question: "What does 0 km mean in Originle?",
    answer:
      "Your guess was wrong, but its border touches the answer's. Distances are measured border to border, so every neighbour is 0 km away, and if all three guesses miss, a 0 km guess still scores the full 1,000 close-miss points.",
  },
  {
    question: "What do the flags on the Originle globe mean?",
    answer:
      "They're your own notes. Tapping a country on the globe flags it as a hunch and adds it to your shortlist; a flag is not a guess and costs nothing. When the last clue draws the outline, the game closes the globe until the round ends, but your notes and shortlist stay available.",
  },
  {
    question: "What do the squares in an Originle result mean?",
    answer:
      "The Share button copies the puzzle number and score, then one square per guess: red for a miss, green for the right answer, and a white flag if you gave up. The last part, such as 3/8 clues, is how many clues were open at the end.",
    body: (
      <>
        The Share button copies the puzzle number and score, then one square per guess: red for a miss, green for the right answer, and a
        white flag if you gave up. The last part, such as 3/8 clues, is how many clues were open at the end. Paste it into the{" "}
        <Link href="/originle-score-calculator" className="inline-link">
          score calculator
        </Link>{" "}
        to see where your points went.
      </>
    ),
  },
  {
    question: "What if a clip won't load or my progress disappears?",
    answer:
      "If a clip fails, the game shows a Try again button. Progress is saved in the browser you played in, so another device or a private window starts fresh, and the game warns you when the browser can't save. Bugs can be reported to the game at originle@krillion.io.",
  },
  {
    question: "How can I be an Originle guest?",
    answer:
      "The game's Questions panel has a sign-up link for would-be guests. Originle says it pays $25 to each guest it selects.",
  },
  {
    question: "Can I play old Originle puzzles?",
    answer: "Yes. The game has an archive of every past guest, playable with the same rules. Our archive has hints and answers for each of them.",
  },
  {
    question: "Which countries can be the answer?",
    answer: `The game accepts ${COUNTRY_COUNT} countries, including Palestine, Taiwan, Kosovo and Vatican City.`,
  },
];

export default function HowToPlayPage() {
  const number = puzzleNumberOn(gameDateAt(new Date()));
  return (
    <PageShell
      path="/how-to-play"
      crumbName="How to play"
      title="How to play Originle"
      lead="One guest, eight video clues, three guesses. Here are the rules, the exact scoring and the habits that keep your score high."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="what" className="prose-block">
            <h2 id="what" className="heading">
              What is Originle?
            </h2>
            <p>
              Originle is a daily geography game built around real people. Each day a new guest tells their story in short videos: a few
              words in their language, something from home, the landscape, a tradition, how big their country feels. Your job is to work
              out which country they represent.
            </p>
            <p>
              The twist is that the answer is about heritage. Guests may live anywhere in the world, so a guest who grew up in London can be
              representing Iraq. You start with {fmt(MAX_SCORE)} points; every clue you open and every wrong guess costs some of them.
            </p>
          </section>

          <section aria-labelledby="rules">
            <h2 id="rules" className="heading">
              The rules on one card
            </h2>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2">
              {RULE_CARD.map((rule) => (
                <div key={rule.title} className="bg-card p-5">
                  <dt className="font-display text-lg font-semibold">{rule.title}</dt>
                  <dd className="mt-1.5 muted">{rule.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="first-round" className="prose-block">
            <h2 id="first-round" className="heading">
              Your first round, step by step
            </h2>
            <ol>
              <li>
                Open{" "}
                <a href={officialUrl("/", "how_to_play")} className="inline-link" target="_blank" rel="noopener" data-ga-event="official_link_click">
                  originle.io
                </a>{" "}
                and watch the guest&apos;s first video with the sound on. Captions are there if you need them.
              </li>
              <li>If one country already fits, type it in and lock the guess. If not, choose to reveal the next clue.</li>
              <li>Use the globe as a scratchpad: mark the countries you&apos;re weighing so you don&apos;t lose track.</li>
              <li>After a wrong guess, read the distance. Then decide between guessing again and opening another clue.</li>
              <li>The round ends on a right answer, a third miss or giving up. Your score and the guest&apos;s reveal video follow.</li>
            </ol>
          </section>

          <section aria-labelledby="scoring">
            <h2 id="scoring" className="heading">
              Originle scoring, exactly
            </h2>
            <p className="mt-3 max-w-[66ch] muted">
              What a right answer scores depends on how many clues are open and how many guesses you&apos;ve already missed. Each miss keeps
              70% of the points.
            </p>
            <div className="sheet mt-6 overflow-x-auto">
              <table className="ledger min-w-[30rem]">
                <caption className="sr-only">Points for a correct guess by clue and earlier misses</caption>
                <thead>
                  <tr>
                    <th scope="col">Clues open</th>
                    <th scope="col" className="num">
                      First guess
                    </th>
                    <th scope="col" className="num">
                      After 1 miss
                    </th>
                    <th scope="col" className="num">
                      After 2 misses
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clueRange.map((clue) => (
                    <tr key={clue}>
                      <th scope="row" className="text-left font-semibold">
                        {clue}
                        {clue === CLUES ? " (outline)" : ""}
                      </th>
                      <td className="num">{fmt(cluePoints(clue))}</td>
                      <td className="num">{fmt(solvedPoints(clue, 1))}</td>
                      <td className="num">{fmt(solvedPoints(clue, 2))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="subheading mt-10">If all three guesses miss</h3>
            <p className="mt-2 max-w-[66ch] muted">
              You score for your closest guess: 1,000 × e<sup>−km/1,500</sup>, rounded to tens. Any right answer, even on the last clue after
              two misses ({fmt(solvedPoints(CLUES, 2))}), beats the best possible miss.
            </p>
            <div className="sheet mt-4 overflow-x-auto">
              <table className="ledger min-w-[20rem]">
                <caption className="sr-only">Close-miss points by distance</caption>
                <thead>
                  <tr>
                    <th scope="col">Closest guess</th>
                    <th scope="col" className="num">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DISTANCES.map((km) => (
                    <tr key={km}>
                      <td>{km === 0 ? "0 km (shares a border)" : `${fmt(km)} km`}</td>
                      <td className="num">{fmt(closeMissPoints(km))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Want your own number?{" "}
              <Link href="/originle-score-calculator" className="inline-link">
                The Originle score calculator
              </Link>{" "}
              works out any round, or reads the result the game&apos;s Share button copies.
            </p>
            <p className="mt-4 text-[0.95rem] muted">
              Puzzles #1 (Aya) and #2 (Emiliia) keep the rules they were first played under: 1,000 points per clue, 2,500 for the last, and
              500 per miss. Close misses score the same way on every puzzle. Figures checked against the game on October 16, 2026.
            </p>
          </section>

          <section aria-labelledby="easy-to-miss" className="prose-block">
            <h2 id="easy-to-miss" className="heading">
              Rules people overlook
            </h2>
            <ul>
              {EASY_TO_MISS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="tips">
            <h2 id="tips" className="heading">
              Tips that save points
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {TIPS.map((tip) => (
                <div key={tip.title} className="border-l-2 border-teal pl-4">
                  <h3 className="subheading">{tip.title}</h3>
                  <p className="mt-1.5 muted">{tip.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6">
              Want to practise on a real guest? The{" "}
              <Link href="/hints" className="inline-link">
                hints for today
              </Link>{" "}
              open one step at a time.
            </p>
          </section>

          <section aria-labelledby="fit" className="grid gap-6 sm:grid-cols-2">
            <h2 id="fit" className="heading sm:col-span-2">
              Is Originle for you?
            </h2>
            <div className="sheet p-5">
              <h3 className="subheading">You&apos;ll like it if</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 muted">
                <li>you enjoy human stories as much as maps</li>
                <li>you like a daily puzzle with a real scoring decision in it</li>
                <li>you know your cuisines, languages and festivals</li>
              </ul>
            </div>
            <div className="sheet p-5">
              <h3 className="subheading">Look elsewhere if</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 muted">
                <li>you want a pure map or flag quiz</li>
                <li>you can&apos;t play with sound or video</li>
                <li>you&apos;d rather guess freely without penalties</li>
              </ul>
              <p className="mt-3 text-[0.95rem]">
                <Link href="/games-like-originle" className="inline-link">
                  Games like Originle
                </Link>
              </p>
            </div>
          </section>

          <section aria-labelledby="compare">
            <h2 id="compare" className="heading">
              Originle compared with similar games
            </h2>
            <div className="sheet mt-6 overflow-x-auto">
              <table className="ledger min-w-[40rem]">
                <caption className="sr-only">Originle compared with Worldle, Globle and GeoGuessr</caption>
                <thead>
                  <tr>
                    <th scope="col">Game</th>
                    <th scope="col">You find</th>
                    <th scope="col">You work from</th>
                    <th scope="col">Tries</th>
                    <th scope="col">New puzzle</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr key={row.game}>
                      <th scope="row" className="text-left font-display font-semibold">
                        {row.game}
                      </th>
                      <td>{row.find}</td>
                      <td>{row.from}</td>
                      <td>{row.tries}</td>
                      <td>{row.daily}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="heading">
              How to play Originle: FAQ
            </h2>
            <div className="mt-6">
              <Faq items={FAQ} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:self-start">
          <section aria-labelledby="facts" className="sheet p-5">
            <h2 id="facts" className="subheading">
              Quick facts
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.97rem]">
              <dt className="muted">Type</dt>
              <dd>Daily geography, guess the country</dd>
              <dt className="muted">Clues</dt>
              <dd>{CLUES} short videos</dd>
              <dt className="muted">Guesses</dt>
              <dd>{GUESSES}</dd>
              <dt className="muted">Top score</dt>
              <dd>{fmt(MAX_SCORE)}</dd>
              <dt className="muted">New guest</dt>
              <dd>Midnight Eastern</dd>
              <dt className="muted">Countries</dt>
              <dd>{COUNTRY_COUNT}</dd>
              <dt className="muted">Price</dt>
              <dd>Free, in the browser</dd>
              <dt className="muted">Since</dt>
              <dd>October 5, 2026</dd>
            </dl>
          </section>
          <PlayOfficial number={number} campaign="how_to_play" />
        </aside>
      </div>
      <JsonLd data={originleGameJsonLd()} />
    </PageShell>
  );
}
