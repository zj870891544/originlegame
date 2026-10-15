import type { Metadata, Viewport } from "next";
import { env } from "cloudflare:workers";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "@fontsource-variable/fraunces/opsz.css";
import "./globals.css";
// The two Latin font files every page uses, preloaded so headings don't reflow when they arrive.
import bodyFontUrl from "@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2?url";
import displayFontUrl from "@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2?url";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/shared/JsonLd";
import { isGaMeasurementId } from "@/lib/analytics/google-analytics";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { SITE } from "@/lib/seo/site";
import { gameDateAt } from "@/lib/time/game-day";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F3ECDF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const year = Number(gameDateAt(new Date()).slice(0, 4));
  // The layout must not read the request, or every page would be dynamic and
  // uncacheable. Analytics decides in the browser whether it is on the production host.
  const measurementId = env.GA_MEASUREMENT_ID;
  return (
    <html lang="en">
      <head>
        <link rel="preload" href={displayFontUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={bodyFontUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-card"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter year={year} />
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
        {isGaMeasurementId(measurementId) && <GoogleAnalytics measurementId={measurementId} />}
      </body>
    </html>
  );
}
