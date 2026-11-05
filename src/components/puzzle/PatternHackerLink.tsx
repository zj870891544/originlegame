type Placement = "home" | "today" | "hints" | "archive" | "similar_games";

export function PatternHackerLink({ placement, className = "btn btn-ghost" }: { placement: Placement; className?: string }) {
  const url = new URL("https://playweird.fun/pattern-hacker/");
  url.search = new URLSearchParams({
    utm_source: "originlegame.app",
    utm_medium: "referral",
    utm_campaign: "originle_hiatus",
    utm_content: placement,
  }).toString();

  return (
    <a href={url.href} className={className} data-ga-event="pattern_hacker_click">
      Play Pattern Hacker
    </a>
  );
}
