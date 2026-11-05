import { PatternHackerLink } from "@/components/puzzle/PatternHackerLink";
import Link from "@/components/shared/Link";
import { PENDING_PUZZLE_ATTRIBUTES } from "@/lib/edge/cache-signals";
import { HIATUS_CONFIRMED_ON, isConfirmedHiatus } from "@/lib/puzzle/availability";
import type { TodayState } from "@/lib/puzzle/load";
import { SITE } from "@/lib/seo/site";
import { formatLongDate } from "@/lib/time/game-day";

/** Shown when today's guest isn't stored yet: never an older puzzle in its place. */
export function Awaiting({ state, placement }: { state: TodayState; placement: "home" | "today" | "hints" }) {
  const { today, ok, latestReleased } = state;
  const hiatus = isConfirmedHiatus(state);
  return (
    <div className="sheet p-5 sm:p-7" role="status" {...PENDING_PUZZLE_ATTRIBUTES}>
      <p className="font-display text-[1.5rem] font-semibold">
        {hiatus ? "Originle is on hiatus" : "Today's Originle puzzle is unavailable"}
      </p>
      {hiatus ? (
        <p className="mt-2 max-w-[60ch] muted">
          The <a href={SITE.officialGameUrl} className="inline-link">official hiatus notice</a> was confirmed on{" "}
          <time dateTime={HIATUS_CONFIRMED_ON}>{formatLongDate(HIATUS_CONFIRMED_ON)}</time>.
        </p>
      ) : (
        <p className="mt-2 max-w-[60ch] muted">
          {ok
            ? `This guide does not have a puzzle for ${formatLongDate(today)} yet. Check the official site for release updates.`
            : "We couldn't check today's puzzle. Try refreshing in a moment."}
        </p>
      )}
      {ok && latestReleased ? (
        <p className="mt-2 muted">
          Latest published puzzle:{" "}
          <Link href={`/archive/${latestReleased.number}`} className="inline-link">Originle #{latestReleased.number}</Link>
          {" · "}<time dateTime={latestReleased.gameDate}>{formatLongDate(latestReleased.gameDate)}</time>
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/archive" className="btn btn-primary">Replay past puzzles</Link>
        {hiatus ? <PatternHackerLink placement={placement} className="btn btn-ghost" /> : null}
      </div>
    </div>
  );
}
