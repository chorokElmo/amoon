# AMOON storefront handover checks — 15 October 2026

Changes are local, ready for review. No build, commit, push or deployment was performed. No hosted product, collection, inventory, cart or other production data was written. Existing uncommitted design work was preserved. Checkout and payment logic were not changed.

## Fixed

- Homepage New Arrivals selects the eight newest available, storefront-ready products independently of collection membership. The existing cream and burgundy grid remains responsive. The misleading upcoming-products message is gone when products exist.
- Empty collections and categories are excluded from storefront navigation and presentation. Featured collection covers use actual member images. Fixed a double-encoded image proxy URL that caused valid collection covers to display “Photo à venir”. The five populated category cards now have real product images and counts: Robes 3, Chemises & Tops 3, Ensembles 2, Jupes & Pantalons 2, Vestes & Gilets 2.
- Product detail selectors separate colors and sizes, with labeled swatches, ordered S/M/L/XL buttons, selected states and stock indicators. Selecting a combination retains the exact existing Medusa variant ID, SKU, MAD price and inventory limit.
- The demo variants currently have empty Medusa option links despite declared Taille/Couleur options. A conservative read-only presentation fallback matches exact title tokens to the declared option values only when unambiguous; ambiguous products retain their combined variant selector. No backend variant records were changed.
- Newsletter form is hidden unless a valid subscription endpoint is configured. The hosted homepage currently renders a disabled newsletter form, indicating the integration is inactive.
- Added Arabic translations for the demo colors and remaining category labels. Fixed homepage seasonal image overflow on narrow screens. Added a hero image failure fallback to an approved catalog image, with a copy-only layout if both images fail.

## Collection findings

All seven Store API collections have zero assigned products: New, New Arrivals, Best Sellers, Autumn/Winter 2026, Summer Essentials, Everyday Essentials and Special Offers. The twelve demos have category assignments but null collection IDs. That is why collection-based sections were empty.

No collection associations were invented or written: the user previously confirmed staging does not have a database separate from production. Existing category assignments provide suitable storefront browsing without mutating that shared database. Future collection assignments need an isolated staging environment or explicit authorization for the shared data.

## Verification

- Read the hosted Medusa Store API catalog: 13 records, including the existing twelve demos; no products recreated. Medusa package version is 2.21.2, Next.js 16.3.8.
- TypeScript and ESLint passed.
- Available offline suite: 137 passed, 0 failed. Added catalog tests for exact and ambiguous option recovery, immutable group filtering, available arrivals, size/color presentation and image proxy idempotence/security. Repaired missing dependency transpilation in the existing store-settings test harness.
- Browser checks at desktop 1440×1000 and mobile 390×844 covered homepage, collections and product details, French and Arabic RTL. No horizontal overflow remained on the checked mobile pages. Five populated category cards and no visible photo placeholders were confirmed on collections.
- Selected Terracotta/M for Robe Élise: 449 MAD, SKU AMOON-DEMO-001-TER-M, inventory limit 10. Local add-to-cart simulation received the exact existing hosted variant ID and quantity 1. It forwarded no writes upstream.
- Selected Camel/M for Pantalon Amira in Arabic: 399 MAD, SKU AMOON-DEMO-010-CAM-M, available. Separate translated color and size controls worked.
- Forty checked internal page URLs and hosted demo image URLs returned HTTP 200; details in http-checks.json. This is a sampled site audit, not an exhaustive crawl of every parameterized URL or external social destination.
- Browser console recorded no errors in the QA tab. Development-only LCP image warnings and Fast Refresh warnings were observed. Some hosted image requests were slow during early loading; image fallback was added, and final checked demo source URLs responded successfully.

## Remaining unverified / handover requirements

- Hosted behavior after deployment: changes have not been deployed, as requested. Local preview is http://localhost:8005.
- Real hosted add-to-cart, checkout, payment and order confirmation were not submitted or changed. Cart testing used an isolated in-memory simulation to respect the no-production-data-change constraint.
- Newsletter subscription delivery is unverified while no integration is activated; no signup was submitted.
- Merchant product names and descriptions remain French when Medusa has no authored Arabic translation. Arabic UI/RTL works, but a fully Arabic catalog requires approved content.
- Browser coverage is sampled desktop/mobile Chromium, not physical devices or every browser. Long-term upstream image availability/performance and third-party social links are not guaranteed by these checks.
- Existing Admin issue: the publishable-key detail page references a missing creator user and can fail. This was not modified and does not prevent Store API catalog reads.

Screenshots in this folder document the local preview; viewport captures are preferable to full-page RTL captures, which the browser screenshot mechanism can crop incorrectly.
