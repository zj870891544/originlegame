import Link from "@/components/shared/Link";
import { PENDING_PUZZLE_ATTRIBUTES } from "@/lib/edge/cache-signals";
import { formatLongDate } from "@/lib/time/game-day";

/** Shown when today's guest isn't stored yet: never an older puzzle in its place. */
export function Awaiting({ number, today, dbOk }: { number: number; today: string; dbOk: boolean }) {
  return (
    <div className="sheet p-5 sm:p-7" role="status" {...PENDING_PUZZLE_ATTRIBUTES}>
      <p className="font-display text-[1.5rem] font-semibold">Originle #{number} is unavailable</p>
      <p className="mt-2 max-w-[60ch] muted">
        {dbOk
          ? `The guide has no puzzle for ${formatLongDate(today)} yet. In the meantime, `
          : "We couldn't load today's puzzle. Try refreshing, or "}
        <Link href="/archive" className="inline-link">
          browse the archive
        </Link>
        .
      </p>
    </div>
  );
}
