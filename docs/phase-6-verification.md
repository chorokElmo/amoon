# Phase 6 — persistent Medusa carts

Implemented real add-to-cart controls, quantity updates/removal, a cart page and a live header count. Totals and line totals come from Medusa in major MAD units; the storefront does not calculate prices. Empty, pending and unavailable states are distinct. Checkout is still disabled pending Phase 7.

The server creates carts in the configured Morocco/MAD region and Amoon Storefront channel. Before add/update it retrieves fresh, published product data scoped to that channel, verifies the variant belongs to that product, requires a real MAD price and checks availability. Medusa performs its own final pricing and inventory validation. Removal works even if an item becomes unpublished. Arbitrary client price/cart IDs are ignored; item mutations require an item in the visitor's signed cart.

The 30-day cart cookie is HMAC-signed with an independent server-only `CART_COOKIE_SECRET`, HttpOnly, SameSite=Lax and Secure in production. Expired/forged cookies are ignored. API mutations require the configured storefront Origin, JSON and a bounded 4 KiB body. Quantities are integers from 1 to 99. Cart responses are private/no-store and expose no customer email/address. Request redirects and automatic mutation retries are disabled. If an uncertain mutation fails, the UI asks the customer to refresh before retrying. Buttons prevent repeated submissions while a request is pending. A cart page resyncs on navigation without overwriting a newer mutation.

Setup scripts generate the cart signing secret and copy `MEDUSA_SALES_CHANNEL_ID` from the actual catalog configuration. Existing secrets remain unchanged. Docker Compose passes these server-only variables, but this phase was run against the native PostgreSQL/Medusa services without Docker.

## Verified on 2026-10-04

- All 36 catalog/product/cart tests pass, including cookie integrity, private-field stripping, malformed/foreign carts, unavailable/unpriced variants, absolute quantity updates, removal response handling and backend totals.
- Both workspace lint and strict TypeScript checks pass. Storefront and Medusa backend/Admin builds pass. Root setup scripts pass Node syntax checks.
- Owner supplied **150 MAD** for their existing product `test`; this actual price was saved through Medusa's product-variant workflow. No sample products or prices were invented. The operator script refuses to replace existing price configurations.
- Real storefront addition, header badge, quantity increase from 1 to 2, actual totals of 150/300 MAD, removal and genuine empty-cart UI were exercised. The same cart survived a Medusa restart and a page reload.
- Independent live API checks verified new-cart creation, HttpOnly cookie persistence/retrieval, quantity update, removal, ignored submitted client price, foreign-line rejection, malformed JSON (400), missing/foreign Origin (403), wrong content type (415), oversized body (413), forged cookie rejection and private/no-store responses.
- Native backend health, compiled Admin and storefront cart page return HTTP 200 after rebuilding/restarting.
- At a 390 px mobile viewport, document width is 375 px with no horizontal overflow. Quantity decrease updates the actual total to 150 MAD and disables decrement at 1. Desktop and mobile screenshots were inspected; the temporary viewport was reset.

## Limits

The owner product has no photographs and uses unmanaged inventory. Missing photography remains an honest placeholder. Managed stock shortage, multivariant and discount scenarios have isolated adapter tests; the owner's inventory was not changed to manufacture those scenarios. No payment, COD order, shipping option or checkout completion was executed. Production Docker deployment and multi-worker behavior remain later phases.

References: [Medusa cart creation](https://docs.medusajs.com/resources/storefront-development/cart), [manage items](https://docs.medusajs.com/resources/storefront-development/cart/manage-items), and the installed Medusa Store API definitions. Medusa's default cart fields omit item totals, so the adapter explicitly requests `+items.total` for retrieval and mutations.
