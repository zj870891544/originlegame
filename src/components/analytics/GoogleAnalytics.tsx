"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAnalyticsEvent, trackEvent, trackPageView } from "@/lib/analytics/google-analytics";

/** Pageviews, plus clicks and openings of elements marked with data-ga-event. */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(measurementId, `${pathname}${window.location.search}`);
  }, [measurementId, pathname]);

  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) trackPageView(measurementId, `${window.location.pathname}${window.location.search}`, { again: true });
    };
    const count = (element: HTMLElement) => {
      const name = element.dataset.gaEvent;
      if (isAnalyticsEvent(name)) trackEvent(name, Number(element.dataset.gaLevel) || undefined);
    };
    const clicked = (event: MouseEvent) => {
      if (!event.isTrusted || event.button > 1) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a[data-ga-event], button[data-ga-event]") : null;
      if (target) count(target);
    };
    const toggled = (event: Event) => {
      const details = event.target;
      if (details instanceof HTMLDetailsElement && details.open && details.dataset.gaEvent) count(details);
    };
    window.addEventListener("pageshow", restored);
    document.addEventListener("click", clicked);
    document.addEventListener("toggle", toggled, true);
    return () => {
      window.removeEventListener("pageshow", restored);
      document.removeEventListener("click", clicked);
      document.removeEventListener("toggle", toggled, true);
    };
  }, [measurementId]);

  return null;
}
