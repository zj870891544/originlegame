import Link from "@/components/shared/Link";
import { countryByCode } from "@/lib/countries";
import type { PuzzleSummary } from "@/lib/db/puzzles";
import { formatLongDate, formatWeekday } from "@/lib/time/game-day";
import { VeilToggle } from "./VeilToggle";

/** Every stored puzzle with its answer blurred until the reader asks to see them. */
export function ArchiveTable({ puzzles, today, caption }: { puzzles: PuzzleSummary[]; today: string; caption: string }) {
  return (
    <div className="veil-scope">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">Answers are blurred. Tap one to read it, or show them all.</p>
        <VeilToggle />
      </div>
      <div className="sheet overflow-x-auto">
        <table className="ledger min-w-[34rem]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">No.</th>
              <th scope="col">Date</th>
              <th scope="col">Guest</th>
              <th scope="col">Answer</th>
              <th scope="col">
                <span className="sr-only">Guide</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {puzzles.map((puzzle) => {
              const country = countryByCode(puzzle.countryCode);
              return (
                <tr key={puzzle.number}>
                  <td className="font-display font-semibold">#{puzzle.number}</td>
                  <td className="whitespace-nowrap">
                    {formatLongDate(puzzle.gameDate)}
                    <span className="block text-sm muted">{puzzle.gameDate === today ? "Today" : formatWeekday(puzzle.gameDate)}</span>
                  </td>
                  <td>
                    <Link href={`/archive/${puzzle.number}`} className="inline-link">
                      {puzzle.guestName}: Originle #{puzzle.number}
                    </Link>
                  </td>
                  <td>
                    <button type="button" className="veil text-left" data-veil-cell aria-label={`Answer for #${puzzle.number}, blurred. Activate to show.`}>
                      {country ? `${country.flag} ${country.name}` : puzzle.countryCode}
                    </button>
                  </td>
                  <td className="whitespace-nowrap">
                    <Link href={`/archive/${puzzle.number}`} className="inline-link">
                      Hints &amp; answer
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
