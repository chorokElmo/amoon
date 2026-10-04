# Phase 5 — actual product pages

Product routes are available at `/produits/[handle]`. Homepage, catalog and related-product cards link to real Medusa handles. When catalog filters leave a single matching variant, that exact ID is carried into the product page. IDs belonging to other products are never selected.

## Behavior

- Actual images, thumbnail order, descriptions, SKU and arbitrary variant options come from the Store API. No sample merchandise or images are added.
- Galleries support thumbnails and a keyboard-dismissable enlargement dialog. Images use the existing restricted proxy and graceful missing-image state.
- Each real variant retains its own MAD price, original price and availability. Multiple variants require an explicit selection; a unique variant is selected automatically. Invalid variant query IDs can be recovered through the selector. Missing prices remain unavailable, not zero.
- Related items share an actual category or non-empty collection and exclude the current product. No related section is displayed if none exist.
- Owner-provided `metadata.size_guide` text is displayed as escaped plain text, bounded to 10,000 characters. Without it, the guide explains that measurements are not supplied and links to contact. No invented measurements or size recommendations are shown.
- Product metadata uses actual titles/descriptions. Missing products have a dedicated not-found UI and noindex metadata; backend failures retain a retry/contact state. Loading states announce progress.
- Product inquiry uses configured WhatsApp or contact. Persistent carts and checkout remain Phases 6–7; this change does not present a working purchase button.

## Real verification

On October 4, 2026, the owner-created product `test` was published and visible through Medusa. It has one unmanaged-inventory variant, no MAD calculated price, no photos and no size-guide metadata. Its page correctly shows `En stock`, `Prix indisponible`, `Photographie à venir` and an honest missing-measurements guide. No owner data was altered for testing.

Browser checks covered catalog-to-product navigation, invalid variant query recovery, the live product page, guide opening, Escape dismissal with focus restoration, and a 390px mobile viewport with no horizontal overflow (375px content width). No browser error logs appeared. A missing product rendered the not-found UI and noindex metadata; the streamed response returned HTTP 200, consistent with Next's streamed not-found behavior. Multi-variant price/stock selection, arbitrary options, gallery normalization and related-product isolation are covered by six new pure-module tests alongside the existing 22 catalog tests. All 28 tests, storefront lint, strict TypeScript and production build passed.

The live record has no photos or multiple variants, so full gallery navigation and multi-variant interaction have not been exercised on owner inventory. They are not verified against fabricated live products.

## Native photos

The local Medusa file provider now returns upload URLs on port 9001. The native runner links its served `static` folder to persistent `apps/medusa/static` outside the compiled backend. That persistent folder is ignored by Git. Existing non-empty compiled-folder uploads cause a clear refusal rather than being overwritten or removed; migrate those files before restarting if needed.

See [native development](native-development.md) for setup/start commands and local-infrastructure limitations.

Backend lint, strict TypeScript and backend/Admin builds also passed. After the native runner restart, `/health`, `/app` and the real product page returned HTTP 200. The persistent upload junction was verified to target `apps/medusa/static`; uploads there are Git-ignored. No owner photographs were available to test a real upload or enlarged gallery. Local in-memory admin sessions may require signing in again after a backend restart.
