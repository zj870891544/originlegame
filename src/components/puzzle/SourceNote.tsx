import type { Puzzle } from "@/lib/db/puzzles";
import { formatEditorialTime } from "@/lib/puzzle/format";

/** Where a puzzle's data came from and when it last changed. */
export function SourceNote({ puzzle }: { puzzle: Puzzle }) {
  return (
    <p className="text-sm muted">
      The guest, answer, clue titles and distances come from the data Originle publishes for this day (
      <a href={`${puzzle.sourceUrl}day.js`} className="underline underline-offset-2" rel="noopener">
        published data for {puzzle.guestName}, Originle #{puzzle.number}
      </a>
      ). The hints are written by this site{puzzle.hints ? " by hand" : " from that data"}. Added {formatEditorialTime(puzzle.firstSeenAt)}
      {puzzle.updatedAt !== puzzle.firstSeenAt ? `, updated ${formatEditorialTime(puzzle.updatedAt)}` : ""}.
      {puzzle.editorNote ? ` ${puzzle.editorNote}` : ""}
    </p>
  );
}
