"use client";
export type AnalyticsConsent = "granted" | "denied";
let consent: AnalyticsConsent = "denied";
/** Provider adapters may subscribe to these events. No provider is installed. */
export function setAnalyticsConsent(value: AnalyticsConsent) {
  consent = value;
  window.dispatchEvent(new CustomEvent("amoon:analytics-consent", { detail: value }));
}
export function trackPageView(pathname: string) {
  if (consent !== "granted" || !/^\/(?:boutique|collections|nouveautes|contact)?$/.test(pathname)) return false;
  // An allowlist prevents search terms, product IDs and checkout/customer data entering analytics.
  window.dispatchEvent(new CustomEvent("amoon:analytics", { detail: { event: "page_view", path: pathname } }));
  return true;
}
