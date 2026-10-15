import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isGaMeasurementId, trackEvent, trackPageView } from "@/lib/analytics/google-analytics";

const MEASUREMENT_ID = "G-TEST123";

describe("privacy-minded GA attribution", () => {
  let gtag: ReturnType<typeof vi.fn>;
  let appendChild: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    appendChild = vi.fn();
    vi.stubGlobal("window", { location: { hostname: "originlegame.app", protocol: "https:" }, gtag });
    vi.stubGlobal("document", {
      referrer: "https://chatgpt.com/?private=ignored#conversation",
      title: "Originle hints",
      createElement: () => ({}),
      head: { appendChild },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  function pageViews() {
    return gtag.mock.calls.filter(([command, name]) => command === "event" && name === "page_view").map((call) => call[2]);
  }

  it("preserves real ChatGPT campaign attribution without unrelated queries or fragments", () => {
    trackPageView(MEASUREMENT_ID, "/hints?email=person%40example.com&utm_source=chatgpt.com&utm_medium=referral&utm_campaign=daily-puzzle#answer");

    expect(pageViews()).toEqual([{
      page_location: "https://originlegame.app/hints?utm_source=chatgpt.com&utm_medium=referral&utm_campaign=daily-puzzle",
      page_referrer: "https://chatgpt.com/",
      page_title: "Originle hints",
      send_to: MEASUREMENT_ID,
    }]);
    expect(gtag).toHaveBeenCalledWith("config", MEASUREMENT_ID, expect.objectContaining({
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    }));
  });

  it("drops email, URL, free-text, oversized and duplicate campaign values", () => {
    trackPageView(MEASUREMENT_ID, `/today?utm_source=chatgpt.com&utm_medium=referral&utm_campaign=person%40example.com&utm_content=https%3A%2F%2Fexample.com&utm_term=private+question&utm_id=${"a".repeat(101)}&utm_source_platform=one&utm_source_platform=two&token=secret`);

    expect(pageViews()[0].page_location).toBe("https://originlegame.app/today?utm_source=chatgpt.com&utm_medium=referral");
  });

  it("completes source-only ChatGPT attribution even without a browser referrer", () => {
    Object.defineProperty(document, "referrer", { value: "" });
    trackPageView(MEASUREMENT_ID, "/today?utm_source=chatgpt.com&token=secret#answer");

    const page = {
      page_location: "https://originlegame.app/today?utm_source=chatgpt.com&utm_medium=ai-assistant",
      page_referrer: "",
      page_title: "Originle hints",
    };
    expect(gtag).toHaveBeenCalledWith("config", MEASUREMENT_ID, expect.objectContaining(page));
    expect(pageViews()).toEqual([{ ...page, send_to: MEASUREMENT_ID }]);

    trackPageView(MEASUREMENT_ID, "/today?utm_medium=ai-assistant&utm_source=chatgpt.com");
    expect(pageViews()).toHaveLength(1);
  });

  it("preserves an explicit ChatGPT medium", () => {
    trackPageView(MEASUREMENT_ID, "/today?utm_source=chatgpt.com&utm_medium=partner");
    expect(pageViews()[0].page_location).toBe("https://originlegame.app/today?utm_source=chatgpt.com&utm_medium=partner");
  });

  it.each([
    ["utm_source=newsletter", "utm_source=newsletter"],
    ["utm_source=chatgpt.com&utm_source=other", ""],
    ["utm_source=https%3A%2F%2Fchatgpt.com", ""],
    ["utm_source=chatgpt.com.evil.example", "utm_source=chatgpt.com.evil.example"],
    ["utm_source=chatgpt.com&utm_medium=", "utm_source=chatgpt.com"],
    ["utm_source=chatgpt.com&utm_medium=private+text", "utm_source=chatgpt.com"],
    ["utm_source=chatgpt.com&utm_medium=one&utm_medium=two", "utm_source=chatgpt.com"],
  ])("does not infer a medium for ambiguous or unrelated tags: %s", (query, retained) => {
    trackPageView(MEASUREMENT_ID, `/today?${query}`);
    expect(pageViews()[0].page_location).toBe(`https://originlegame.app/today${retained ? `?${retained}` : ""}`);
  });

  it("deduplicates the same page after query reordering or irrelevant query changes", () => {
    trackPageView(MEASUREMENT_ID, "/hints?utm_source=chatgpt.com&utm_medium=referral");
    trackPageView(MEASUREMENT_ID, "/hints?utm_medium=referral&utm_source=chatgpt.com&secret=ignored#answer");

    expect(pageViews()).toHaveLength(1);
    expect(appendChild).toHaveBeenCalledTimes(1);
  });

  it("uses the previous route for SPA referrers and preserves it on a BFCache restore", () => {
    trackPageView(MEASUREMENT_ID, "/hints?utm_source=chatgpt.com");
    trackPageView(MEASUREMENT_ID, "/archive");
    trackPageView(MEASUREMENT_ID, "/archive", { again: true });

    expect(pageViews().map((page) => page.page_referrer)).toEqual([
      "https://chatgpt.com/",
      "https://originlegame.app/hints",
      "https://originlegame.app/hints",
    ]);
  });

  it("leaves direct visits direct and ignores non-HTTP referrers", () => {
    Object.defineProperty(document, "referrer", { value: "" });
    trackPageView(MEASUREMENT_ID, "/");
    expect(pageViews()[0].page_referrer).toBe("");

    Object.defineProperty(document, "referrer", { value: "javascript:alert(1)" });
    delete (window as Window & { __originleAnalytics?: unknown }).__originleAnalytics;
    trackPageView(MEASUREMENT_ID, "/today");
    expect(pageViews()[1].page_referrer).toBe("");
  });

  it("does not initialize analytics on previews, HTTP, invalid IDs or external paths", () => {
    expect(isGaMeasurementId("G-TEST123")).toBe(true);
    trackPageView("invalid", "/");
    trackPageView(MEASUREMENT_ID, "//example.com/");
    trackPageView(MEASUREMENT_ID, "/\\example.com/");
    window.location.hostname = "preview.workers.dev";
    trackPageView(MEASUREMENT_ID, "/");
    window.location.hostname = "originlegame.app";
    window.location.protocol = "http:";
    trackPageView(MEASUREMENT_ID, "/");

    expect(gtag).not.toHaveBeenCalled();
    expect(appendChild).not.toHaveBeenCalled();
  });

  it("keeps existing interaction events small and does not add extra page views", () => {
    trackPageView(MEASUREMENT_ID, "/hints?utm_source=chatgpt.com");
    trackEvent("hint_open", 2);
    trackEvent("answer_reveal", 10);

    expect(gtag).toHaveBeenCalledWith("event", "hint_open", { send_to: MEASUREMENT_ID, hint_level: 2 });
    expect(gtag).toHaveBeenCalledWith("event", "answer_reveal", { send_to: MEASUREMENT_ID });
    expect(pageViews()).toHaveLength(1);
  });
});
