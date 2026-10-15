import type { Metadata } from "next";
import { Awaiting } from "@/components/puzzle/Awaiting";
import { GuideLinks } from "@/components/puzzle/GuideLinks";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { AnswerEnvelope, NearbyCountries, PuzzleCard } from "@/components/puzzle/PuzzleGuide";
import { SourceNote } from "@/components/puzzle/SourceNote";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { getToday } from "@/lib/puzzle/request";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { formatLongDate } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { number, puzzle, today } = await getToday();
  return pageMetadata({
    title: `Originle Answer Today #${number} (${formatLongDate(today)})`,
    description: puzzle
      ? `Where is ${puzzle.guestName} from? The Originle #${number} answer for ${formatLongDate(today)}, behind three spoiler-free hints, with the close misses and their scores.`
      : `The Originle #${number} answer for ${formatLongDate(today)} appears here soon after midnight Eastern, behind three spoiler-free hints.`,
    path: "/today",
    ogType: "article",
    ...(puzzle ? { published: puzzle.firstSeenAt, modified: puzzle.updatedAt } : {}),
  });
}

export default async function TodayPage() {
  const { number, puzzle, yesterday, today, ok } = await getToday();
  const faq = [
    {
      question: `What is the Originle answer today, #${number}?`,
      answer: puzzle
        ? `Originle #${number} for ${formatLongDate(today)} features ${puzzle.guestName}. The country is in the answer envelope above; open it when you're ready.`
        : `Originle #${number} for ${formatLongDate(today)} will appear on this page soon after midnight Eastern time.`,
    },
    {
      question: "Does a guess of a neighbouring country count?",
      answer:
        "No, only the exact country is correct. A neighbour that shares a border is 0 km away, though, so if all three guesses miss, a neighbour still earns the full 1,000 close-miss points.",
    },
    {
      question: "Is the answer the same for everyone?",
      answer: "Yes. Every player meets the same guest on the same day in New York time, wherever they live.",
    },
  ];
  return (
    <PageShell
      path="/today"
      crumbName="Today's answer"
      title={`Originle answer today: #${number}`}
      lead={
        <>
          {formatLongDate(today)}.{" "}
          {puzzle ? `Where is ${puzzle.guestName} from? ` : ""}Try the{" "}
          <Link href="/hints" className="inline-link">
            hints
          </Link>{" "}
          first, or open the answer straight away. It&apos;s folded so a glance won&apos;t spoil it.
        </>
      }
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {puzzle ? (
            <>
              <PuzzleCard puzzle={puzzle} title={`Where is ${puzzle.guestName} from?`} showNearbyLink={false} />
              <NearbyCountries puzzle={puzzle} />
              <SourceNote puzzle={puzzle} />
              <JsonLd
                data={articleJsonLd({
                  headline: `Originle #${number} answer and hints (${formatLongDate(today)})`,
                  path: "/today",
                  published: puzzle.firstSeenAt,
                  modified: puzzle.updatedAt,
                })}
              />
            </>
          ) : (
            <Awaiting number={number} today={today} dbOk={ok} />
          )}
          {yesterday ? (
            <section aria-labelledby="yesterday" data-reveal-scope>
              <h2 id="yesterday" className="heading">
                Yesterday&apos;s Originle answer, #{yesterday.number}
              </h2>
              <p className="mt-3 muted">
                {formatLongDate(yesterday.gameDate)}: {yesterday.guestName}.{" "}
                <Link href={`/archive/${yesterday.number}`} className="inline-link">
                  Hints and close misses for #{yesterday.number}
                </Link>
              </p>
              <div className="mt-4">
                <AnswerEnvelope puzzle={yesterday} />
              </div>
            </section>
          ) : null}
        </div>
        <aside className="min-w-0 space-y-10">
          <PlayOfficial number={number} campaign="today" />
          <section aria-labelledby="today-faq">
            <h2 id="today-faq" className="heading">
              About today&apos;s answer
            </h2>
            <div className="mt-4">
              <Faq items={faq} />
            </div>
          </section>
        </aside>
      </div>
      <section className="mt-16" aria-labelledby="more">
        <h2 id="more" className="heading">
          More Originle help
        </h2>
        <div className="mt-6">
          <GuideLinks exclude="/today" />
        </div>
      </section>
    </PageShell>
  );
}
