import type { Metadata } from "next";
import { ArchiveTable } from "@/components/puzzle/ArchiveTable";
import { Awaiting } from "@/components/puzzle/Awaiting";
import { GuideLinks } from "@/components/puzzle/GuideLinks";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { PuzzleCard } from "@/components/puzzle/PuzzleGuide";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { getRecent, getToday } from "@/lib/puzzle/request";
import { originleGameJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE, officialUrl } from "@/lib/seo/site";
import { formatLongDate } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Originle Game Guide: Today's Hints, Answers & Archive",
    description: "An independent guide to Originle at originle.io, the daily country guessing game. Get today's hints and answer, replay past guests and understand the scoring.",
    path: "/",
  });
}

const STEPS = [
  { title: "Meet the guest", text: "A new person introduces themself in a short video at midnight Eastern time." },
  { title: "Open clues as you need them", text: "Eight video clues, each easier than the last. Every one you open lowers what a right answer is worth." },
  { title: "Guess the country", text: "You get three guesses. A wrong one costs 30% of your points and tells you how far away you were." },
  { title: "Compare your score", text: "Scores are out of 10,000. Missing all three still earns up to 1,000 for your closest guess." },
];

const FAQ = [
  {
    question: "What is the Originle game?",
    answer:
      "Originle is a free daily geography game at originle.io. Each day a real person shares their story in eight short video clues, and you guess the country they represent in up to three tries. Scores are out of 10,000.",
  },
  {
    question: "What is today's Originle answer?",
    answer:
      "Today's answer is on this page and on the Today page, folded away inside the answer envelope so you only see it when you open it. Try the three hints first if you want to keep the score honest.",
  },
  {
    question: "When does Originle reset?",
    answer:
      "A new guest arrives at midnight in New York (Eastern time) every day: 04:00 UTC during daylight saving time and 05:00 UTC in winter. This site picks up the new guest within minutes.",
  },
  {
    question: "Is the answer the country where the guest lives?",
    answer:
      "Not always. Many guests are part of a diaspora, so the answer is the country they represent through their roots and culture. An American or Australian accent doesn't mean the answer is the US or Australia.",
  },
  {
    question: "Is there an Originle app?",
    answer:
      "Originle is played in the web browser at originle.io, on a phone or a computer, with nothing to download and no account. Your progress is saved in the browser you play in.",
  },
  {
    question: "What's the game where you guess where someone is from?",
    answer:
      "That's Originle: a real person talks about home in short videos and you guess the country they represent. It's often called a nationality game, but the answer is about roots and culture, not passports.",
    body: (
      <>
        That&apos;s Originle: a real person talks about home in short videos and you guess the country they represent. It&apos;s often
        called a nationality game, but the answer is about roots and culture, not passports.{" "}
        <Link href="/guess-where-im-from-game" className="inline-link">
          More on how it works
        </Link>
        .
      </>
    ),
  },
  {
    question: "Is this the official Originle site?",
    answer: `No. ${SITE.name} is an independent fan guide. The game itself is at originle.io, and every hint here is written by us from the day's published data.`,
  },
];

export default async function HomePage() {
  const [{ today, number, puzzle, yesterday, ok }, recent] = await Promise.all([getToday(), getRecent(8)]);
  const summaries = recent.map((p) => ({ number: p.number, gameDate: p.gameDate, slug: p.slug, guestName: p.guestName, countryCode: p.countryCode, updatedAt: p.updatedAt }));
  return (
    <>
      <section className="shell grid gap-10 pb-6 pt-10 md:pt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="font-semibold text-teal">{formatLongDate(today)}</p>
          <h1 className="display mt-3 max-w-[13ch]">Originle game: meet a guest, guess their country</h1>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed muted md:text-xl">
            Originle is the daily game where you meet one person and guess the country they come from. Stuck on today&apos;s guest? Open a
            hint, then another. The answer waits until you ask.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/hints" className="btn btn-primary">
              Get a hint
            </Link>
            <Link href="/today" className="btn btn-ghost">
              Today&apos;s answer
            </Link>
            <Link href="/archive" className="btn btn-ghost">
              Past answers
            </Link>
            <a href={officialUrl("/", "home_hero")} className="btn btn-ghost" rel="noopener" data-ga-event="official_link_click">
              Play at originle.io
            </a>
          </div>
          {yesterday ? (
            <p className="mt-6 text-[0.97rem] muted">
              Looking for yesterday?{" "}
              <Link href={`/archive/${yesterday.number}`} className="inline-link">
                Originle #{yesterday.number}, {yesterday.guestName}
              </Link>
            </p>
          ) : null}
        </div>
        <div>{puzzle ? <PuzzleCard puzzle={puzzle} /> : <Awaiting number={number} today={today} dbOk={ok} />}</div>
      </section>

      <section className="shell mt-10">
        <PlayOfficial number={number} campaign="home" />
      </section>

      <section className="shell mt-16" aria-labelledby="how">
        <h2 id="how" className="heading">
          How Originle works
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ink pt-4">
              <span className="font-display text-3xl font-bold text-teal">{index + 1}</span>
              <h3 className="subheading mt-2">{step.title}</h3>
              <p className="mt-2 text-[0.98rem] muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[0.98rem]">
          The full rules and the exact points for every clue are in{" "}
          <Link href="/how-to-play" className="inline-link">
            how to play Originle
          </Link>
          .
        </p>
      </section>

      <section className="shell mt-16" aria-labelledby="guides">
        <h2 id="guides" className="heading">
          Find what you need
        </h2>
        <div className="mt-6">
          <GuideLinks />
        </div>
      </section>

      {summaries.length ? (
        <section className="shell mt-16" aria-labelledby="recent">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="recent" className="heading">
              Recent Originle answers
            </h2>
            <Link href="/archive" className="inline-link">
              The full archive
            </Link>
          </div>
          <div className="mt-6">
            <ArchiveTable puzzles={summaries} today={today} caption="The most recent Originle puzzles" />
          </div>
        </section>
      ) : null}

      <section className="shell mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" aria-labelledby="about-game">
        <div>
          <h2 id="about-game" className="heading">
            A geography game about people
          </h2>
        </div>
        <div className="prose-block text-[1.03rem]">
          <p>
            Most daily geography games give you a silhouette, a flag or a satellite photo. Originle gives you a person. Each guest talks
            about their language, a dish from home, the weather, a tradition, and how big their country feels, one short video at a time.
          </p>
          <p>
            That makes it a game of listening. Early clues are cheap but vague; the last one shows the country&apos;s outline and is worth
            less than a third of the first. Wrong guesses cost even more, so the skill is knowing when you&apos;ve heard enough.
          </p>
          <p>
            The game is free at{" "}
            <a href={officialUrl("/", "home_text")} className="inline-link" rel="noopener" data-ga-event="official_link_click">
              originle.io
            </a>{" "}
            and needs no account. This site is a companion: hints for when you&apos;re stuck, the answer for when you&apos;re done, and an
            archive of everyone you&apos;ve met.
          </p>
        </div>
      </section>

      <section className="shell mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10" aria-labelledby="faq">
        <div>
          <h2 id="faq" className="heading lg:sticky lg:top-24">
            Originle questions
          </h2>
        </div>
        <div>
          <Faq items={FAQ} />
        </div>
      </section>
      <JsonLd data={originleGameJsonLd()} />
    </>
  );
}
