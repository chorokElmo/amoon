# Phase 9 — contact, search metadata and analytics boundary

Public pages have canonical URLs based on the server-only `STOREFRONT_URL`. This must be an HTTP(S) origin without credentials, path, query or fragment. Product canonicals ignore variant queries; shop canonicals ignore filter/search queries. Product Open Graph data and safely escaped JSON-LD use the actual catalog title, description, photographs, variant MAD prices and known availability. Missing prices, photographs, SKUs and unknown availability are omitted. No ratings, reviews or sale promises are invented.

`/sitemap.xml` lists public storefront pages, actual category/collection URLs and actual published catalog product URLs. Overlapping collection/category handles preserve the existing collection-disambiguation query. It excludes cart, checkout, confirmation and API routes, uses no fabricated modification dates, and fails rather than publish an incomplete product list during a catalog outage. `/robots.txt` disallows all crawling on localhost; a configured public origin permits public pages while disallowing `/api/`, `/panier` and `/commande`. Cart/checkout/confirmation additionally retain noindex metadata. Robots directives are not access controls. Metadata base, sitemap and robots read the deployment origin at runtime rather than freezing localhost during an image build.

WhatsApp uses the existing server-only `WHATSAPP_NUMBER` setting: international digits without `+`, spaces or punctuation. It must be an actual owner-supplied number of 8–15 digits. The contact, footer and product inquiry links stay hidden while it is missing/invalid. No number was invented. Restart the storefront after changing environment settings. Current contact is the previously configured Instagram account.

## Analytics integration boundary

No analytics SDK, remote tracking script, endpoint or provider is configured or loaded. `src/lib/analytics.ts` exports an opt-in event boundary for a future approved provider adapter. Consent defaults to denied and is memory-only, so a fresh page load denies tracking again. `setAnalyticsConsent("granted")` enables only allowlisted public page-view events; denial stops future events. Query strings, product paths, cart, checkout and confirmation cannot be emitted through this boundary. Events carry only a fixed event name and allowlisted pathname.

A future adapter must connect explicit visitor consent controls, handle withdrawal and provider cleanup, and remain unloaded until consent. The current store has no analytics collection and therefore no misleading consent banner. This is an integration boundary, not a deployed analytics service.

## Verification

Live routes return HTTP 200. Sitemap contains the real `test` product and five public static pages; no private routes. Local robots disallows crawling. `/produits/test` has the exact canonical URL and a MAD offer at 150, with no invented product image. `/boutique?q=test` canonicalizes to `/boutique`. WhatsApp is absent while no number is configured.

Added isolated checks cover origin validation, JSON-LD script injection escaping, actual MAD price handling, omitted unknown/missing values, denied-by-default analytics, consent withdrawal and rejection of query/private routes. Search-engine indexing/rich-result acceptance and a production domain are not verified locally. No tracking provider was installed and no external event was sent.

All 48 isolated tests pass. Workspace lint and strict TypeScript checks pass; the final storefront production build passes. Backend runtime behavior is unchanged.
