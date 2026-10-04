# Phase 10 — local QA and review

The current owner catalog, free delivery and native Medusa setup are retained. No demo products, customer address, payment capture, fulfillment or new order was submitted during QA. The browser's current cart contains the real `test` product twice, totaling 300 MAD; QA did not change its quantity.

## Repeatable live checks

Run `npm run qa:native` with the native storefront/backend running. The script only accepts loopback targets. Four check groups cover public-route availability and security headers; anonymous/forged-cart rejection and private/no-store API responses; foreign-Origin, wrong content type, malformed JSON and oversized-body rejection; and sitemap/private-route exclusions with local robots rules. The rejected requests contain no customer data or valid cart mutation. All four groups pass.

All 48 isolated catalog/product/cart/checkout/security/SEO tests pass. These include real Medusa amount-type compatibility, failed payment completion, review tampering, stale totals and idempotent completed-cart recovery. These adapter tests do not simulate actual multi-process order concurrency against PostgreSQL. Workspace lint and strict TypeScript checks pass; the storefront production build passes.

## Browser and accessibility review

At 390 px and 1280 px, checkout document widths are 375 px and 1265 px respectively: no horizontal overflow. Both screenshots were inspected, and temporary viewport changes were reset. All checkout inputs have accessible labels. Menu opening moves focus inside its native modal; closing restores focus to its trigger. Search opening focuses its labeled input. A submitted no-match search shows the zero-result status and a clear reset link.

The menu's Tab containment, Escape handler and focus restoration were reviewed in code. Skip navigation, visible focus styling, reduced-motion CSS, form-required constraints and status/error announcements are present. This is not a full assistive-technology or manual keyboard audit. The checkout now focuses the new stage's heading when the stage changes, rather than leaving focus on a removed submit button; successful address-to-shipping/review transitions still require actual customer details for live verification.

Confirmation in the inspected browser has no signed receipt and correctly shows a recovery link rather than another visitor's order. The stored order #1 remains a separate database observation; its browser receipt recovery was not verified. Admin authentication is not bypassed.

Screenshots: `../../phase-10-checkout-mobile.png` and `../../phase-10-checkout-desktop.png`.

## Security and performance review

Cart/order ownership uses signed HttpOnly cookies, bounded request bodies, server-side validation and same-origin mutations. Checkout/cart API responses are private/no-store. Product structured data escapes `<`; product images are limited to backend static paths and configured HTTPS origins, reject redirects/non-raster responses, and have an 8 MiB cap and request timeout. Store API errors are translated instead of exposing backend bodies or secrets. The repeatable checks verify nosniff, frame denial and referrer policy headers and no framework-identifying response header.

Product photographs use responsive Next Image sizing and error placeholders. Catalog reads have bounded paging and timeouts, with cached reads; cart/payment requests are fresh. No analytics provider is loaded. The current real product has no photographs, so actual image-load performance cannot be assessed. No Lighthouse/Core Web Vitals score or production performance guarantee is claimed from local development.

Production release still needs managed-inventory reservation and live concurrent/repeated checkout verification, actual dispatch details and inventory, owner order/receipt checks, courier and COD operations, HTTPS deployment, distributed infrastructure and backup/restore testing. The user's no-Docker preference remains in force; Phase 11 deployment is not run or claimed verified.
