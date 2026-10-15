import { SITE } from "@/lib/seo/site";

/**
 * GA4, only on the HTTPS production host and only when a measurement ID is
 * configured. One pageview per document, without query strings or fragments,
 * advertising signals off. Events carry a fixed name and at most a hint level.
 */

export const ANALYTICS_EVENTS = ["hint_open", "answer_reveal", "reveal_all", "official_link_click", "roadmap_open"] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __originleAnalytics?: { measurementId: string; lastLocation: string };
};

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

export function trackPageView(measurementId: string, pathname: string, { again = false } = {}): void {
  if (!isGaMeasurementId(measurementId) || typeof window === "undefined" || window.location.hostname !== SITE.host || window.location.protocol !== "https:") return;
  const browser = window as AnalyticsWindow;
  const path = pathname.split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path.startsWith("//")) return;
  const location = `${SITE.origin}${path}`;
  const previous = browser.__originleAnalytics;
  if (!again && previous?.measurementId === measurementId && previous.lastLocation === location) return;

  browser.dataLayer ??= [];
  browser.gtag ??= function () {
    // Google's tag queue uses the canonical gtag arguments-object format.
    // eslint-disable-next-line prefer-rest-params
    browser.dataLayer!.push(arguments);
  };
  const gtag = browser.gtag;
  const page = { page_location: location, page_referrer: pageReferrer(document.referrer), page_title: document.title };
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
  browser.__originleAnalytics = { measurementId, lastLocation: location };
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
