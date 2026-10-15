import type { Metadata } from "next";
import { PageShell } from "@/components/shared/PageShell";
import { pageMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: "What originlegame.app records about visits: no accounts, no advertising cookies, and privacy-minded analytics.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell path="/privacy" crumbName="Privacy" title="Privacy" lead="Short version: no accounts, nothing you type is stored, and no advertising tracking.">
      <div className="prose-block narrow">
        <h2 className="heading">What we collect</h2>
        <p>
          The site has no accounts, sign-ups or comment forms. Opening hints and answers happens in your browser and isn&apos;t stored on
          our side.
        </p>
        <p>
          When analytics is switched on, we use Google Analytics 4 to count page views and a few interactions (such as opening a hint),
          without the page&apos;s query string, with Google signals and ad personalisation turned off, and with advertising storage denied.
          Google may still set its own analytics cookies; you can block them with any content blocker and the site works the same.
        </p>
        <p>
          Our host, Cloudflare, processes the technical data any website receives (IP address, browser, the page requested) to deliver and
          protect the site.
        </p>
        <h2 className="heading pt-6">Links to other sites</h2>
        <p>Links to originle.io and other games take you to sites with their own privacy policies.</p>
        <h2 className="heading pt-6">Contact</h2>
        <p>
          Questions: <a href={`mailto:${SITE.contactEmail}`} className="inline-link">{SITE.contactEmail}</a>. Last updated October 15, 2026.
        </p>
      </div>
    </PageShell>
  );
}
