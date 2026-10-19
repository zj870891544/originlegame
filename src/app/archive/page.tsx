import type { Metadata } from "next";
import { ArchiveTable } from "@/components/puzzle/ArchiveTable";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { Faq } from "@/components/shared/Faq";
import { JsonLd } from "@/components/shared/JsonLd";
import { SITE } from "@/lib/seo/site";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { safeRead } from "@/lib/db/client";
import { listPuzzles } from "@/lib/db/puzzles";
import { itemListJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { LAUNCH_DATE, formatLongDate, gameDateAt, puzzleNumberOn } from "@/lib/time/game-day";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const number = puzzleNumberOn(gameDateAt(new Date()));
  return pageMetadata({
    title: `Originle Archive: All Past Answers (#1–#${number})`,
    description: `Every Originle answer since #1 on ${formatLongDate(LAUNCH_DATE)}: each guest, the date, the country (blurred until you tap it) and a page of hints and close misses.`,
    path: "/archive",
  });
}

export default async function ArchivePage() {
  const today = gameDateAt(new Date());
  const { data: puzzles } = await safeRead((db) => listPuzzles(db, today), []);
  const number = puzzleNumberOn(today);
  return (
    <PageShell
      path="/archive"
      crumbName="Archive"
      title="Originle archive: every past answer"
      lead={`${puzzles.length} ${puzzles.length === 1 ? "guest" : "guests"} so far, starting with #1 on ${formatLongDate(LAUNCH_DATE)}. Each one has its own page with three hints, the clue titles, the answer and the close misses.`}
    >
      {puzzles.length ? (
        <ArchiveTable puzzles={puzzles} today={today} caption="All Originle puzzles, newest first" />
      ) : (
        <p className="sheet p-5 muted">The archive is being filled in. Check back in a few minutes.</p>
      )}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="replay" className="prose-block">
          <h2 id="replay" className="heading">
            Replaying a past guest
          </h2>
          <p>
            Originle keeps every past guest playable in its own archive, with the same three guesses and scoring. If you&apos;d rather play
            than read, don&apos;t open the answer column: the page for each guest starts with hints only.
          </p>
          <p>
            Puzzles #1 and #2 were played under the game&apos;s first rules (one point scale with 1,000 per clue and 500 per miss) and keep
            them when replayed. Everything from #3 on uses the current scoring, explained in{" "}
            <Link href="/how-to-play#scoring" className="inline-link">
              how to play
            </Link>
            .
          </p>
        </section>
        <PlayOfficial number={number} campaign="archive" />
      </div>
      <section className="mt-14 narrow" aria-labelledby="archive-faq">
        <h2 id="archive-faq" className="heading">
          Originle archive questions
        </h2>
        <div className="mt-6">
          <Faq
            items={[
              {
                question: "How do I replay old Originle puzzles?",
                answer: `Open the official archive at ${SITE.officialArchiveUrl} and pick a day. Every past guest is playable there with three guesses, and your result is saved in your browser.`,
              },
              {
                question: "How do I find the Originle answer for a past date?",
                answer:
                  "Find the date in the table above and tap the blurred answer, or open the puzzle's page for its hints first. Each page is named by its number, date and guest.",
              },
              {
                question: "Can I play Originle unlimited or in infinite mode?",
                answer:
                  "Originle releases one new guest each day. To play more than one round, use the official archive to replay guests from earlier days. Each released guest has its own hints and answer in the table above.",
                body: (
                  <>
                    Originle releases one new guest each day. To play more than one round, use the{" "}
                    <a href={SITE.officialArchiveUrl} className="inline-link" target="_blank" rel="noopener" data-ga-event="official_link_click">
                      official Originle archive
                    </a>{" "}
                    to replay guests from earlier days. Each released guest has its own hints and answer in the table above.
                  </>
                ),
              },
              {
                question: "Are future Originle answers listed?",
                answer: "No. The game only publishes a guest on their day, at midnight in New York, so this archive stops at today.",
              },
            ]}
          />
        </div>
      </section>
      <JsonLd data={itemListJsonLd("Originle archive", puzzles.map((p) => ({ name: `Originle #${p.number}: ${p.guestName}`, path: `/archive/${p.number}` })))} />
    </PageShell>
  );
}
