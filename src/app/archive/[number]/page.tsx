import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { PuzzleExplanation } from "@/components/puzzle/PuzzleExplanation";
import { NearbyCountries, PuzzleCard } from "@/components/puzzle/PuzzleGuide";
import { SourceNote } from "@/components/puzzle/SourceNote";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { countryInSentence } from "@/lib/countries";
import { rulesForPuzzle } from "@/lib/official/calculator";
import { puzzleGuestSummary } from "@/lib/puzzle/explanation";
import { getPuzzleByNumber, getToday } from "@/lib/puzzle/request";
import { answerCountry } from "@/lib/puzzle/view";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { puzzleAnswerSummary, puzzleGuideModified } from "@/lib/seo/puzzle";
import { SITE } from "@/lib/seo/site";
import { formatLongDate, formatWeekday } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ number: string }>;
}

async function load(params: Props["params"]) {
  const { number: raw } = await params;
  if (!/^[1-9]\d{0,4}$/.test(raw)) return null;
  return getPuzzleByNumber(Number(raw));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const puzzle = await load(params);
  if (!puzzle) return { title: "Puzzle not found", robots: { index: false, follow: true } };
  const date = formatLongDate(puzzle.gameDate);
  return pageMetadata({
    title: `Originle #${puzzle.number} Answer & Hints: ${puzzle.guestName} (${date})`,
    description: `The Originle answer for ${date} (#${puzzle.number}): where is ${puzzle.guestName} from? Three spoiler-free hints, the game's clue titles, the answer, and the close misses with their scores.`,
    path: `/archive/${puzzle.number}`,
    ogType: "article",
    published: puzzle.firstSeenAt,
    modified: puzzleGuideModified(puzzle.updatedAt),
  });
}

export default async function PuzzlePage({ params }: Props) {
  const puzzle = await load(params);
  if (!puzzle) notFound();
  const { number: todayNumber } = await getToday();
  const isToday = puzzle.number === todayNumber;
  const date = formatLongDate(puzzle.gameDate);
  const [previous, next] = await Promise.all([
    puzzle.number > 1 ? getPuzzleByNumber(puzzle.number - 1) : null,
    puzzle.number < todayNumber ? getPuzzleByNumber(puzzle.number + 1) : null,
  ]);
  const country = answerCountry(puzzle);
  const faq = [
    { question: `What was the Originle answer on ${date}?`, answer: puzzleAnswerSummary(puzzle) },
    {
      question: `Where is ${puzzle.guestName} from in Originle?`,
      answer: `${puzzle.guestName}, the guest of Originle #${puzzle.number}, represents ${countryInSentence(country)}. The answer is the country a guest represents through their roots and culture, which isn't always where they live.`,
    },
    {
      question: `Can I still play Originle #${puzzle.number}?`,
      answer: `Yes. Every past guest stays playable in the official archive at originle.io, with three guesses${
        rulesForPuzzle(puzzle.number) === "original"
          ? " and the original scoring: a correct answer starts at 10,000 points, loses 1,000 for each extra clue through clue 7, and is worth 2,500 on clue 8 before subtracting 500 per miss."
          : " and the same scoring as today's puzzle."
      }`,
    },
  ];
  return (
    <PageShell
      path={`/archive/${puzzle.number}`}
      crumbName={`#${puzzle.number}`}
      parents={[{ name: "Archive", path: "/archive" }]}
      title={`Originle #${puzzle.number} answer and hints: ${puzzle.guestName}`}
      lead={
        <>
          {formatWeekday(puzzle.gameDate)}, {date}. The guest is {puzzle.guestName}.{" "}
          {isToday ? (
            <>
              This is today&apos;s puzzle; the{" "}
              <Link href="/today" className="inline-link">
                Today page
              </Link>{" "}
              has the same answer.
            </>
          ) : (
            <>
              Replay it in the{" "}
              <a href={SITE.officialArchiveUrl} className="inline-link" target="_blank" rel="noopener" data-ga-event="official_link_click">
                official archive
              </a>{" "}
              before you open anything.
            </>
          )}
        </>
      }
    >
      <section aria-labelledby="puzzle-facts" className="sheet mb-8 p-5 sm:p-6">
        <h2 id="puzzle-facts" className="subheading">Puzzle at a glance</h2>
        <p className="mt-2 max-w-[66ch] muted">{puzzleGuestSummary(puzzle)}</p>
      </section>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          <PuzzleCard puzzle={puzzle} showNearbyLink={false} />
          <PuzzleExplanation puzzle={puzzle} />
          <NearbyCountries puzzle={puzzle} />
          <SourceNote puzzle={puzzle} />
          <section aria-labelledby="puzzle-faq">
            <h2 id="puzzle-faq" className="heading">
              Originle #{puzzle.number} questions
            </h2>
            <p className="mt-3 max-w-[66ch] muted">These name the answer, so they stay folded too.</p>
            <div className="mt-5">
              <Faq items={faq} />
            </div>
          </section>
          <nav aria-label="Other puzzles" className="flex flex-wrap justify-between gap-4 border-t border-rule pt-6">
            {previous ? (
              <Link href={`/archive/${previous.number}`} className="inline-link">
                Previous: #{previous.number}, {previous.guestName}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/archive/${next.number}`} className="inline-link">
                Next: #{next.number}, {next.guestName}
              </Link>
            ) : (
              <Link href="/archive" className="inline-link">
                All puzzles
              </Link>
            )}
          </nav>
        </div>
        <aside className="min-w-0">
          <PlayOfficial number={todayNumber} campaign="archive_day" />
        </aside>
      </div>
      <JsonLd
        data={articleJsonLd({
          headline: `Originle #${puzzle.number} answer and hints (${date})`,
          path: `/archive/${puzzle.number}`,
          description: puzzleAnswerSummary(puzzle),
          citation: `${puzzle.sourceUrl}day.js`,
          published: puzzle.firstSeenAt,
          modified: puzzleGuideModified(puzzle.updatedAt),
        })}
      />
    </PageShell>
  );
}
