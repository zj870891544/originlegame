import { SITE } from "@/lib/seo/site";

/**
 * GA4, only on the HTTPS production host and only when a measurement ID is
 * configured. One pageview per route, retaining only short campaign labels from
 * approved UTM parameters. Fragments and other query strings are dropped,
 * advertising signals off. Events carry a fixed name and at most a hint level.
 */

export const ANALYTICS_EVENTS = ["hint_open", "answer_reveal", "reveal_all", "official_link_click", "roadmap_open"] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __originleAnalytics?: { measurementId: string; lastLocation: string; lastReferrer: string };
};

const CAMPAIGN_PARAMETERS = ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_source_platform", "utm_content", "utm_term"] as const;

function pageLocation(value: string): string | undefined {
  if (!value.startsWith("/") || value.startsWith("//")) return;
  try {
    const url = new URL(value, SITE.origin);
    if (url.origin !== SITE.origin) return;
    const campaign = new URLSearchParams();
    for (const key of CAMPAIGN_PARAMETERS) {
      const values = url.searchParams.getAll(key);
      // Labels only: exclude email addresses, URLs, free text and ambiguous duplicates.
      if (values.length === 1 && /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(values[0])) campaign.set(key, values[0]);
    }
    const query = campaign.toString();
    return `${SITE.origin}${url.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return;
  }
}

export function isGaMeasurementId(value: string | undefined): value is string {
  return typeof value === "string" && /^G-[A-Z0-9]+$/.test(value);
}

export function isAnalyticsEvent(name: string | undefined): name is AnalyticsEvent {
  return typeof name === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(name);
}

function pageReferrer(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? `${url.origin}${url.pathname}` : "";
  } catch {
    return "";
  }
}

export function trackPageView(measurementId: string, pagePath: string, { again = false } = {}): void {
  if (!isGaMeasurementId(measurementId) || typeof window === "undefined" || window.location.hostname !== SITE.host || window.location.protocol !== "https:") return;
  const browser = window as AnalyticsWindow;
  const location = pageLocation(pagePath);
  if (!location) return;
  const previous = browser.__originleAnalytics;
  if (!again && previous?.measurementId === measurementId && previous.lastLocation === location) return;

  browser.dataLayer ??= [];
  browser.gtag ??= function () {
    // Google's tag queue uses the canonical gtag arguments-object format.
    // eslint-disable-next-line prefer-rest-params
    browser.dataLayer!.push(arguments);
  };
  const gtag = browser.gtag;
  const referrer = previous?.measurementId === measurementId
    ? (previous.lastLocation === location ? previous.lastReferrer : pageReferrer(previous.lastLocation))
    : pageReferrer(document.referrer);
  const page = { page_location: location, page_referrer: referrer, page_title: document.title };
  if (!previous) {
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date());
    gtag("config", measurementId, { ...page, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.referrerPolicy = "no-referrer";
    document.head.appendChild(script);
  }
  gtag("set", page);
  gtag("event", "page_view", { ...page, send_to: measurementId });
  browser.__originleAnalytics = { measurementId, lastLocation: location, lastReferrer: referrer };
}

export function trackEvent(name: AnalyticsEvent, level?: number): void {
  if (typeof window === "undefined") return;
  const browser = window as AnalyticsWindow;
  const state = browser.__originleAnalytics;
  if (!state || !browser.gtag) return;
  const params: Record<string, unknown> = { send_to: state.measurementId };
  if (Number.isInteger(level) && level! >= 1 && level! <= 9) params.hint_level = level;
  browser.gtag("event", name, params);
}
