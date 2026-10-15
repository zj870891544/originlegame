import Link from "@/components/shared/Link";
import { formatLongDate } from "@/lib/time/game-day";

/** Shown when today's guest isn't stored yet: never an older puzzle in its place. */
export function Awaiting({ number, today, dbOk }: { number: number; today: string; dbOk: boolean }) {
  return (
    <div className="sheet p-5 sm:p-7" role="status">
      <p className="font-display text-[1.5rem] font-semibold">Originle #{number} is on its way</p>
      <p className="mt-2 max-w-[60ch] muted">
        {dbOk
          ? `The guest for ${formatLongDate(today)} usually appears here within minutes of midnight Eastern time. Refresh in a little while, or `
          : "We couldn't load today's puzzle just now. Try again in a minute, or "}
        <Link href="/archive" className="inline-link">
          browse the archive
        </Link>
        .
      </p>
    </div>
  );
}
