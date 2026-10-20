import type { Puzzle } from "@/lib/db/puzzles";
import { formatEditorialTime } from "@/lib/puzzle/format";
import { puzzleGuideModified } from "@/lib/seo/puzzle";

/** Where a puzzle's data came from and when it last changed. */
export function SourceNote({ puzzle }: { puzzle: Puzzle }) {
  return (
    <section aria-label="Sources and record times" className="space-y-3 text-sm muted">
      <p>
        Official puzzle:{" "}
        <a href={puzzle.sourceUrl} className="underline underline-offset-2" rel="noopener">
          {puzzle.guestName}, Originle #{puzzle.number}
        </a>
        . The guest, answer, clue titles and distances come from its{" "}
        <a href={`${puzzle.sourceUrl}day.js`} className="underline underline-offset-2" rel="noopener">published day.js data</a>.
        {" "}The hints are written by this site{puzzle.hints ? " by hand" : " from that data and independent country facts"}.
      </p>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Guide record first stored</dt>
        <dd><time dateTime={puzzle.firstSeenAt}>{formatEditorialTime(puzzle.firstSeenAt)}</time></dd>
        <dt className="font-semibold">Guide record last changed</dt>
        <dd><time dateTime={puzzle.updatedAt}>{formatEditorialTime(puzzle.updatedAt)}</time></dd>
        <dt className="font-semibold">Guide page updated</dt>
        <dd><time dateTime={puzzleGuideModified(puzzle.updatedAt)}>{formatEditorialTime(puzzleGuideModified(puzzle.updatedAt))}</time></dd>
      </dl>
      <p>These are this guide&apos;s stored-record and editorial times, not the official game&apos;s publication time or a claim of a more recent data check.</p>
      {puzzle.editorNote ? <p>Editorial note: {puzzle.editorNote}</p> : null}
    </section>
  );
}
