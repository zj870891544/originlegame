import { SITE, officialUrl } from "@/lib/seo/site";
import { Countdown } from "./Countdown";

/**
 * The way into the real game. Originle doesn't allow itself to be framed by
 * other sites, so this is a ticket that opens originle.io in a new tab.
 */
export function PlayOfficial({ number, campaign = "play_card" }: { number: number; campaign?: string }) {
  return (
    <div className="@container relative overflow-hidden rounded-md border border-ink bg-ink text-card">
      <div className="grid gap-6 p-5 @2xl:grid-cols-[1fr_auto] @2xl:items-center @md:p-7">
        <div>
          <p className="font-display text-[1.55rem] font-semibold leading-tight">Play today&apos;s Originle, #{number}</p>
          <p className="mt-2 max-w-[54ch] text-[0.98rem] text-card/80">
            Meet the guest in short videos and name their country in three guesses. Free, in your browser, on the official site.
          </p>
          <p className="mt-3 text-sm text-card/70">
            Next guest in <Countdown />
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 @2xl:items-end">
          <a
            href={officialUrl("/", campaign)}
            target="_blank"
            rel="noopener"
            className="btn bg-card text-ink hover:bg-paper"
            data-ga-event="official_link_click"
          >
            Open originle.io
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 4h9v9M16 4 5 15" />
            </svg>
          </a>
          <a href={SITE.officialArchiveUrl} target="_blank" rel="noopener" className="text-sm text-card/80 underline underline-offset-2 hover:text-card" data-ga-event="official_link_click">
            Or catch up in the official archive
          </a>
        </div>
      </div>
      {/* Ticket perforation */}
      <div aria-hidden="true" className="h-2 bg-[radial-gradient(circle,var(--color-paper)_3px,transparent_3.5px)] bg-[length:14px_8px] bg-repeat-x" />
    </div>
  );
}
