import type { Metadata } from "next";
import { ArchiveTable } from "@/components/puzzle/ArchiveTable";
import { PlayOfficial } from "@/components/puzzle/PlayOfficial";
import { JsonLd } from "@/components/shared/JsonLd";
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
      <JsonLd data={itemListJsonLd("Originle archive", puzzles.map((p) => ({ name: `Originle #${p.number}: ${p.guestName}`, path: `/archive/${p.number}` })))} />
    </PageShell>
  );
}
