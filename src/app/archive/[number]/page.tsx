import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { NearbyCountries, PuzzleCard } from "@/components/puzzle/PuzzleGuide";
import { SourceNote } from "@/components/puzzle/SourceNote";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { getPuzzleByNumber, getToday } from "@/lib/puzzle/request";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { puzzleAnswerSummary } from "@/lib/seo/puzzle";
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
    description: `Originle #${puzzle.number} from ${date}: where is ${puzzle.guestName} from? Three hints, the game's clue titles, the answer, and the nearest countries with their close-miss scores.`,
    path: `/archive/${puzzle.number}`,
    ogType: "article",
    published: puzzle.firstSeenAt,
    modified: puzzle.updatedAt,
  });
}

export default async function PuzzlePage({ params }: Props) {
  const puzzle = await load(params);
  if (!puzzle) notFound();
  const { number: todayNumber } = await getToday();
  const isToday = puzzle.number === todayNumber;
  const date = formatLongDate(puzzle.gameDate);
  return (
    <PageShell
      path={`/archive/${puzzle.number}`}
      crumbName={`#${puzzle.number}`}
      parents={[{ name: "Archive", path: "/archive" }]}
      title={`Originle #${puzzle.number} answer and hints`}
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
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          <PuzzleCard puzzle={puzzle} showNearbyLink={false} />
          <NearbyCountries puzzle={puzzle} />
          <SourceNote puzzle={puzzle} />
          <nav aria-label="Other puzzles" className="flex flex-wrap justify-between gap-4 border-t border-rule pt-6">
            {puzzle.number > 1 ? (
              <Link href={`/archive/${puzzle.number - 1}`} className="inline-link">
                Previous: #{puzzle.number - 1}
              </Link>
            ) : (
              <span />
            )}
            {puzzle.number < todayNumber ? (
              <Link href={`/archive/${puzzle.number + 1}`} className="inline-link">
                Next: #{puzzle.number + 1}
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
          modified: puzzle.updatedAt,
        })}
      />
    </PageShell>
  );
}
