import type { Metadata } from "next";
import { PageShell } from "@/components/shared/PageShell";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description: "The terms for using originlegame.app, an independent fan guide to the Originle game.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell path="/terms" crumbName="Terms" title="Terms of use" lead={SITE.disclaimer}>
      <div className="prose-block narrow">
        <p>
          {SITE.name} is a free, unofficial guide. Originle, its name, its guests and their stories belong to their creators. We link to the
          game and describe it; we don&apos;t host or reproduce it.
        </p>
        <p>
          We take care to get every answer right and follow the game&apos;s own data, but the site comes as it is, without guarantees. If
          the game changes a puzzle, the game is right and we&apos;ll follow it.
        </p>
        <p>
          You&apos;re welcome to link to any page and to quote short passages with a link back. Please don&apos;t copy the site wholesale or
          scrape it heavily.
        </p>
        <p>
          Questions or takedown requests: <a href={`mailto:${SITE.contactEmail}`} className="inline-link">{SITE.contactEmail}</a>. Last
          updated October 15, 2026.
        </p>
      </div>
    </PageShell>
  );
}
