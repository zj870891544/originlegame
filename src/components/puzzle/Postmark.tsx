import { formatShortDate } from "@/lib/time/game-day";

/** The puzzle's number and date, as a round postmark. */
export function Postmark({ number, date }: { number: number; date: string }) {
  return (
    <div className="postmark shrink-0" aria-label={`Originle number ${number}, ${formatShortDate(date)}`}>
      <div>
        <div className="postmark-date">No.</div>
        <div className="postmark-number">{String(number).padStart(3, "0")}</div>
        <div className="postmark-date">{formatShortDate(date).toUpperCase()}</div>
      </div>
    </div>
  );
}
