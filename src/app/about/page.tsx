import type { Metadata } from "next";
import Link from "@/components/shared/Link";
import { PageShell } from "@/components/shared/PageShell";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE, officialUrl } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "About Originle Game and Our Sources",
  description: "Who runs originlegame.app, where each day's answer comes from, how the hints are written, and how to report a mistake.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell path="/about" crumbName="About" title="About this site" lead={`${SITE.name} is an independent fan guide to Originle. ${SITE.disclaimer}`}>
      <div className="prose-block narrow">
        <h2 className="heading">What it&apos;s for</h2>
        <p>
          Originle is a lovely game and a hard one. This site helps when you&apos;re stuck: hints that give away a little at a time, the
          answer when you want it, and an archive of every guest. Please play the game itself at{" "}
          <a href={officialUrl("/", "about")} className="inline-link" rel="noopener" data-ga-event="official_link_click">
            originle.io
          </a>
          ; nothing here replaces it.
        </p>

        <h2 className="heading pt-6">Where the answers come from</h2>
        <p>
          Originle publishes a small data file for each guest once their day has begun. A few minutes after midnight in New York, this
          site reads that file and stores the guest&apos;s name, the country they represent, the titles of the eight clues and the
          game&apos;s border-to-border distances to every other country. Files for days that haven&apos;t started are closed, so this
          site can&apos;t see a guest early and never publishes one before the game does. The site checks again every half hour and
          follows any change the game makes.
        </p>
        <p>
          We don&apos;t copy the guests&apos; videos, photos or captions. Country names follow the game&apos;s own guess list; capitals and
          official languages come from the open countries-list dataset, and regions follow the UN geoscheme.
        </p>

        <h2 className="heading pt-6">How the hints are written</h2>
        <p>
          Every puzzle gets three hints, each stronger than the last: the continent and coastline, then the region and official languages,
          then the first letter, the length of the name and its neighbours. They are built from the facts above, and we can replace them
          with hand-written ones for any day. The &quot;close misses&quot; tables use the game&apos;s own distances and its published
          scoring formula.
        </p>

        <h2 className="heading pt-6">Corrections and contact</h2>
        <p>
          Spotted a mistake, or are you part of the Originle team and want something changed? Write to{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="inline-link">
            {SITE.contactEmail}
          </a>
          . We read everything.
        </p>
        <p>
          More reading: <Link href="/how-to-play" className="inline-link">how to play</Link>,{" "}
          <Link href="/privacy" className="inline-link">privacy</Link> and <Link href="/terms" className="inline-link">terms</Link>.
        </p>
      </div>
    </PageShell>
  );
}
