# Phase 4 — catalog, collections, search and filters

Implemented Medusa Store API connection, MAD/Morocco region selection, actual variant prices/inventory, categories/collections, search, URL-driven filters, four sort choices, pagination, mobile filter drawer, loading skeletons, empty states, missing collection handling and backend-unavailable states. Media proxy restricts images to configured storage origins and local assets. Configuration is in `catalog.md` and environment examples.

## Automated checks

- `npm run lint` and `npm run typecheck` for both workspaces.
- `npm run test:catalog --workspace @amoon/storefront`: 22 tests covering variant combinations, stock/price consistency, OR/AND facets, accents, tax-inclusive MAD amounts, missing prices, backorders, sorting before pagination, category descendants, collection scope, query validation/preservation, media origin controls, API pagination/context, missing keys, region ambiguity, malformed/failing responses, capacity and genuine empty catalogs.
- Storefront production build.
- The actual installed Medusa 2.21.2 product query validator accepts the requested fields, including `variants.calculated_price.*`, inventory quantity, metadata and `categories.*`.

## Browser checks

An isolated local API fixture populated a temporary QA route using the same loader, selection logic and UI. It was visibly labeled as simulated, never used by `/boutique`, and the temporary route was removed before delivery. Screenshots are labeled QA fixtures, not live inventory.

Desktop combined M/Beige, MAD 300–500 and in-stock filtering returned 15 matching products; pagination preserved all filters, and price-ascending sorting reset page two to page one with the correct lowest matching price (329 MAD). Mobile drawer was inspected at 390px; Shift+Tab wrapped to the reset link, Escape closed it and restored focus to the filter button. An impossible M/Noir combination produced the empty state. Searching `elegante` matched accented product names. No horizontal overflow at 390px or 320px. A category/collection handle collision preserved `univers=collection` after submitting a size filter and kept the correct 9-product collection. A truly empty API response showed the preparation state; an upstream 503 showed the unavailable state. No browser console errors observed during the populated checks.

The real `/boutique` currently displays an explicit unavailable state because no live publishable key/MAD region is configured. Live Medusa database integration, Admin inventory and production remote images are not claimed verified. The Docker daemon remains unavailable.

Starting a second preview process was rejected by the sandbox approval policy even after network permission was granted. Browser testing instead used the existing development server and a temporary, clearly labeled QA route, with no changes to live environment configuration.
