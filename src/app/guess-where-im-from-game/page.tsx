import type { Metadata } from "next";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { CLUES, GUESSES, MAX_SCORE } from "@/lib/official/scoring";
import { originleGameJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { officialUrl } from "@/lib/seo/site";
import { gameDateAt, puzzleNumberOn } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Guess Where Someone Is From Game: Meet Originle",
  description:
    "The game where you watch a real person talk and guess which country they're from is Originle. What it is, where to play it free, how it works, and how to read the clues.",
  path: "/guess-where-im-from-game",
});

const fmt = (n: number) => n.toLocaleString("en-US");

const SIGNS = [
  { title: "A real person on camera", text: "One guest a day, filmed talking about themself in short videos, with captions." },
  { title: `${CLUES} clues, one at a time`, text: "Their language, something from home, the landscape, a tradition, how big the country feels. The last one shows its outline." },
  { title: `${GUESSES} guesses`, text: "Type a country to guess. A wrong one tells you how far it was from the answer, in kilometres." },
  { title: "A spinning globe", text: "Players tap countries to flag hunches and build a shortlist while they listen." },
  { title: `A score out of ${fmt(MAX_SCORE)}`, text: "Every clue opened and every miss costs points. Results are shared as red and green squares." },
  { title: "A new person at midnight", text: "Everyone meets the same guest each day, at midnight Eastern time, and past guests stay playable." },
];

const READING = [
  { title: "Listen before you read", text: "The first video is free and the sound of a language says a lot: tones, rolled r's, long compound words. Even a greeting narrows things to a language family." },
  { title: "Treat food as a region", text: "A dish or a spice mix is usually shared by several neighbours. Use it to pick the region, then wait for the clue that splits it." },
  { title: "Let the weather rule out continents", text: "Monsoons, deserts, snow, islands or high plateaus remove whole parts of the world at once." },
  { title: "Don't trust the accent", text: "Many guests grew up abroad. An American or Australian accent doesn't make the answer the US or Australia." },
];

const FAQ = [
  {
    question: "What is the game where you guess where someone is from?",
    answer:
      "It's most likely Originle, a free daily game at originle.io. Each day a real person appears in eight short video clues, and you guess the country they represent in three tries, scored out of 10,000.",
  },
  {
    question: "Is Originle a nationality guessing game?",
    answer:
      "Nearly, but not quite. The answer is the country a guest represents through their roots and culture, which isn't always their passport or where they live. A guest who grew up in London can be representing Iraq, and the game can refuse a passport country as a guess.",
  },
  {
    question: "Where can I play it?",
    answer: "At originle.io, in any web browser, free and with no account. Your progress is saved in the browser you play in.",
  },
  {
    question: "Are the people in Originle real?",
    answer: "Yes. The game says every guest is a real person, telling you about the country they represent in their own words.",
  },
  {
    question: "Can I play the ones I missed?",
    answer: "Yes. The game keeps an archive of every past guest, playable with the same three guesses. Our archive has hints and the answer for each one.",
  },
  {
    question: "Can I be a guest on Originle?",
    answer: "Yes. The game's Questions panel has a sign-up link for would-be guests, and Originle says it pays $25 to each guest it selects.",
  },
];

export default function GuessWhereImFromPage() {
  const number = puzzleNumberOn(gameDateAt(new Date()));
  return (
    <PageShell
      path="/guess-where-im-from-game"
      crumbName="Guess where someone is from"
      title="The game where you guess where someone is from"
      lead={
        <>
          Saw someone on a stream or in a clip watching a stranger talk, then guessing their country? That game is almost certainly{" "}
          <strong>Originle</strong>, and it&apos;s free to play at originle.io.
        </>
      }
    >
      <nav aria-label="Start with Originle" className="mb-10 flex flex-wrap gap-3">
        <a href={officialUrl("/", "guess_where_from_intro")} className="btn btn-primary" target="_blank" rel="noopener" data-ga-event="official_link_click">
          Play at originle.io
        </a>
        <Link href="/hints" className="btn btn-ghost">Today&apos;s Originle hints</Link>
        <Link href="/archive" className="btn btn-ghost">Browse past guests</Link>
      </nav>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="signs">
            <h2 id="signs" className="heading">
              Is this the game you saw?
            </h2>
            <p className="mt-3 max-w-[66ch] muted">If most of these sound familiar, it was Originle.</p>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2">
              {SIGNS.map((sign) => (
                <li key={sign.title} className="bg-card p-5">
                  <h3 className="font-display text-lg font-semibold">{sign.title}</h3>
                  <p className="mt-1.5 muted">{sign.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="play" className="prose-block">
            <h2 id="play" className="heading">
              How to play it
            </h2>
            <ol>
              <li>
                Open{" "}
                <a href={officialUrl("/", "guess_where_from")} className="inline-link" target="_blank" rel="noopener" data-ga-event="official_link_click">
                  originle.io
                </a>{" "}
                and watch today&apos;s guest introduce themself.
              </li>
              <li>Guess a country when one fits, or reveal the next clue. Each clue makes it easier and lowers the points on offer.</li>
              <li>After a wrong guess, read the distance. Under 500 km suggests looking nearby, but does not mean the countries share a border.</li>
              <li>The round ends on a right answer, a third miss, or giving up. Then the guest tells you where they&apos;re from.</li>
            </ol>
            <p>
              The full rules and the exact points are in{" "}
              <Link href="/how-to-play" className="inline-link">
                how to play Originle
              </Link>
              , and the{" "}
              <Link href="/originle-score-calculator" className="inline-link">
                score calculator
              </Link>{" "}
              works out any round.
            </p>
          </section>

          <section aria-labelledby="roots" className="prose-block">
            <h2 id="roots" className="heading">
              It&apos;s about roots, not passports
            </h2>
            <p>
              People often describe it as a guess-the-nationality game, but Originle asks which country a guest <em>represents</em>. Many
              guests are part of a diaspora: born or raised in one country, with family and culture from another. The answer is the country
              of their roots and culture, not necessarily where they live now or which passport they hold.
            </p>
            <p>That&apos;s what makes it more than a geography quiz. You&apos;re listening for a person&apos;s story, not reading a map.</p>
          </section>

          <section aria-labelledby="reading">
            <h2 id="reading" className="heading">
              How to guess where someone is from
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {READING.map((tip) => (
                <div key={tip.title} className="border-l-2 border-teal pl-4">
                  <h3 className="subheading">{tip.title}</h3>
                  <p className="mt-1.5 muted">{tip.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6">
              Stuck on today&apos;s guest?{" "}
              <Link href="/hints" className="inline-link">
                Today&apos;s hints
              </Link>{" "}
              open one at a time, and the{" "}
              <Link href="/today" className="inline-link">
                answer page
              </Link>{" "}
              keeps the country folded until you ask.
            </p>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="heading">
              Questions
            </h2>
            <div className="mt-6">
              <Faq items={FAQ} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:self-start">
          <PlayOfficial number={number} campaign="guess_where_from" />
          <section aria-labelledby="more" className="sheet p-5">
            <h2 id="more" className="subheading">
              Wanted something else?
            </h2>
            <p className="mt-2 text-[0.97rem] muted">
              If the game you saw used a map, a flag or Street View in place of a person, it may have been one of these.
            </p>
            <p className="mt-3 text-[0.97rem]">
              <Link href="/games-like-originle" className="inline-link">
                Ten games like Originle
              </Link>
            </p>
          </section>
        </aside>
      </div>
      <JsonLd data={originleGameJsonLd()} />
    </PageShell>
  );
}
