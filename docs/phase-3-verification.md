# Phase 3 — editorial homepage

Implemented hero, new arrivals, six category links, featured collection, best-seller preview, editorial banner, brand benefits, Instagram link and newsletter section. Reusable product card and removable fixture module. Images use Next Image responsive sizing, lazy loading below the hero and hero preload. French headings, named regions, keyboard focus styles and reduced-motion support retained.

## Verification

- Workspace lint and strict TypeScript passed for storefront and Medusa.
- Storefront production build passed, including request-time homepage and newsletter route.
- In-app browser reviewed at 1440px and 390px; no horizontal overflow at 390px or 320px. Hero and product image rendering inspected.
- Category links preserve their category in the opening-state destination; product cards link to existing search entry rather than nonexistent product pages.
- Newsletter HTTP checks: unconfigured provider 503, invalid email 400, missing consent 400, foreign origin 403, oversized body 413.
- Docker Compose configuration validated with temporary placeholder secrets. Docker containers, database migrations and live commerce remain unverified because the daemon is unavailable.

## Newsletter integration

Set `NEWSLETTER_SUBSCRIBE_URL` to an owner-controlled HTTPS signup endpoint and optionally `NEWSLETTER_API_TOKEN`. The homepage reads runtime configuration; absent/invalid configuration displays an explicit opening-soon state and does not collect addresses.

The server posts JSON `{ email, consent: true, consent_at, source: "amoon-homepage" }`, optionally with a Bearer token. The provider must actually store/queue the request before responding with a 2xx JSON `{ "accepted": true }`. The UI confirms only transmission, not final subscription. Provider handles double opt-in, duplicate requests, unsubscribe and rate limiting; configure the reverse proxy's request rate limit before enabling public signup. No email addresses or tokens are logged or stored in local files. The route enforces matching Origin, JSON body, bounded 2KB input, email/consent validation, an 8-second upstream timeout and no redirects. Provider delivery and enabled form submission have not been tested against a real provider.

## Demo content

`HOMEPAGE_DEMO=false` hides all homepage sample product cards and generated images. Default true supports the review preview. Demo prices are fixtures, not inventory; the best-seller section explicitly disclaims a real ranking. Instagram imagery is a local editorial preview, not scraped posts. See `demo-imagery.md` for tool, file locations and prompt set. Replace with approved photography during real catalog integration.
