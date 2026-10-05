# Storefront design audit and implementation — October 5, 2026

## Existing architecture

The npm workspace contains a Next.js 16 App Router storefront and a Medusa 2 backend. TypeScript, Tailwind and a shared global stylesheet provide the frontend. PostgreSQL holds commerce records. Native development serves compiled Medusa Admin on port 9001 and the storefront on port 8000.

Public routes: homepage, boutique, nouveautés, collection index and detail, product detail, contact, panier, commande and protected confirmation. API routes handle cart, checkout, catalog imagery, newsletter and health. Metadata, product JSON-LD, sitemap and robots already exist.

Reusable components include Header, Footer, Wordmark, Button, accessible Sheet dialogs, CatalogCard, CatalogPhoto, filter/sort controls, ProductGallery, ProductOptions, CartView and CheckoutForm. Existing typography uses Georgia for editorial headings and Helvetica Neue/Arial for interface text.

Catalog requests retrieve actual Medusa products, category/collection membership, MAD regional prices and inventory. Cart quantities and totals are calculated by Medusa, with signed server-only cookies. Checkout validates Moroccan addresses, selects real delivery options and completes COD orders with a signed review. Newsletter requires its configured service; WhatsApp requires a configured phone number.

## Findings and changes

- The original homepage used a large typographic monogram instead of a campaign composition. It now uses an asymmetric photographic campaign and a full-width mobile crop.
- The palette now uses warm white `#F8F6F2`, cream `#F1ECE4`, beige `#DED2C3`, taupe accents `#9A8772` and dark ink `#211F1B`. Body text uses a darker taupe for legibility.
- Actual product photography keeps a consistent 3:4 ratio, with secondary-image hover where another photo exists. Product pages preserve uncropped gallery imagery and have eager loading for the main photo.
- Homepage category tiles and the featured collection use existing Medusa membership and photography. An owner-ranked selection appears only when popularity metadata exists.
- The header remains sticky and keeps its existing search and mobile navigation. The cart shortcut now opens an accessible drawer with actual quantities, removal and backend totals, while preserving the full cart route and modified-click navigation.
- Product details retain their variant selection, inventory checks and add-to-cart API. A new “Commander maintenant” button uses the same validated add operation before navigating to checkout. Description, delivery and returns use accessible disclosure panels. Composition displays only when the owner provides a `composition` string in product metadata.
- Checkout retains its address fields and payment/delivery logic, with larger inputs and photographic order-summary items. Unsupported notes fields and payment methods were not introduced.
- Footer information links lead to a working `/informations` page and anchors, also included in the sitemap. Copy describes existing behavior and directs customers to the boutique for fulfillment/return details; it does not invent return windows or delivery deadlines.
- Retired opening/campaign CSS was removed rather than keeping the former layout underneath the redesign. New surfaces reuse the existing tokens and components.

## Verification

- Storefront lint and TypeScript validation passed.
- Production storefront build passed.
- All 48 catalog, cart, checkout, media and SEO tests passed.
- Browser checks covered homepage, boutique, product, cart and checkout at 375, 390, 430, 768, 1024 and 1440 pixels; no horizontal overflow was found.
- Mobile menu, image zoom and quick-cart opening worked. Drawer quantity changed from 1 to 2 with totals changing from 150 to 300 MAD, then was restored to 1 and 150 MAD.
- All 14 distinct homepage internal destinations/anchors returned HTTP 200 with valid anchors.
- No browser runtime errors were found. A main-gallery lazy-loading performance warning was addressed with eager loading.
- No order was submitted. Checkout was visually checked against the existing cart; automated tests cover validation and completion behavior.

## Content dependencies

The current database contains two test products, one populated collection, no populated product categories and no owner popularity ranks. These are displayed faithfully. One test product still has no price and remains unavailable for purchase.

The hero reuses the existing generated editorial cover in `public/images/demo/hero.png`, clearly labeled as an inspiration image. It is not used as a product photo and should be replaced with approved campaign photography for launch. The real product photographs and prices are preserved.

Newsletter signup remains conditional on the existing newsletter endpoint. Social links use the configured Instagram account and show WhatsApp only when a number is configured. No fake feed, subscriber success, testimonials or sales statistics were added.

Local preview images are saved in ignored `.local/redesign-desktop.png` and `.local/redesign-mobile.png`.

## Burgundy reference redesign — final implementation

The new target replaces the preceding neutral editorial treatment. The homepage is rebuilt as React sections rather than embedding the reference screenshot: a three-message announcement bar, sticky cream navigation, campaign composition, three category links, live Medusa arrivals, a split autumn campaign, brand story, four trust benefits, five-image inspiration gallery, botanical newsletter and footer. Shared burgundy styling applies to the catalog, products, cart and checkout. Mobile uses a separate hero composition and horizontally scrolling category/gallery cards.

Colors: wine #650F2C, blush #EAD0D1, warm cream #F8F3ED and muted rose #AD596E. The owner’s transparent logo is recolored through CSS, with its original shape retained. Decorative botanical artwork is native SVG.

Favorites persist in local storage and have a dedicated /favoris route. Single purchasable variants support quick-add through the existing validated cart API and open the accessible cart drawer. Products with multiple variants or no price lead to product selection instead. Existing backend, database and checkout contracts are retained.

Campaign imagery was generated with the built-in image_gen tool and saved in public/images/campaign-wine.png and public/images/editorial-wine.png. Prompt intent: premium Moroccan fashion campaign, adult woman in burgundy T-shirt at left, adult woman in ivory hoodie at right, an empty cream center for HTML branding, burgundy drapery, blush and ivory garments and botanical accents; editorial photograph of an adult woman in a burgundy modest dress beside a rack of ivory, blush and burgundy clothes and folded fabrics in a warm plaster interior. These are inspiration assets, labeled illustrative, and never substituted for actual catalog photography.

Current catalog has only two test products: qdsq has a real 150 MAD price and no photo; test has a test photo and no MAD price. Four-column desktop layout automatically fills as real products are added. No sample fashion products or invented prices were introduced. Category links use actual matching categories when available and otherwise search the shop. Newsletter is visibly disabled until a configured subscription endpoint exists. WhatsApp appears only when a phone is configured.

Validation: production build and ESLint pass; all 48 catalog/cart/checkout tests pass. Homepage links and information anchors respond successfully. Browser verified no document overflow at 320, 390, 640, 768, 1024 and 1440 pixels, persistent favorites, quick-add, correct cart totals and quantity decrement. Testing restored the original one-item cart and removed the temporary favorite. Preview screenshots: .local/reference-desktop.png and .local/reference-mobile.png.

## Polish pass

Preserved all sections and commerce integration. Removed scroll-driven opacity animation that left the lower sections at 35% opacity. Restored full image/text contrast, introduced the owner's exact burgundy/blush/cream/ivory/text palette, strengthened footer/newsletter readability and kept botanical decoration subtle. Newsletter is still disabled until its provider is configured, with full visual contrast and a clear status.

Arrivals grid adapts to the actual product count and centers a compact two-card row without stretching card height. Four columns remain available when four products exist; tablet/mobile use two or three columns as space allows. Cards retain real names, prices, colors and links, now with consistent 3:4 cream image frames, an outlined garment placeholder, contained original photography, aligned action buttons, readable hearts and restrained hover zoom. No catalog records were altered or hidden. The existing test photo remains owner-supplied catalog content.

Existing campaign/editorial image assets are served at quality 90; hero loads eagerly. Source-image resolution remains the limit on very large screens. Equal-height category tiles have a stronger text gradient. Mobile navigation, product links, quick-add and quantity decrement were exercised; original cart was restored. Lower sections report computed opacity 1 and filter none. 1440/1024/768/390 checks show no horizontal page overflow; category heights match at each width; all five social images load successfully. Production build, ESLint and all 48 tests pass. Current previews: .local/polished-desktop.png and .local/polished-mobile.png.
