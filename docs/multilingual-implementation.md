# Amoon French/Arabic implementation

French is the default. The desktop header, mobile header and mobile menu provide FR | العربية. The independent amoon_locale cookie preserves the choice for one year. Server and client rendering set the corresponding HTML language and direction. Cairo and Tajawal are self-hosted by next/font/google and applied only to Arabic. Existing French typography, URLs, canonical metadata and Medusa commerce identifiers are preserved. No hreflang is emitted for cookie-based language selection.

## Translation coverage

487 reviewed Arabic dictionary entries cover navigation, default homepage copy, search and filters, catalog and product controls, galleries and availability, favorites, cart, checkout, validation, confirmation, footer, information/contact pages, loading states and page errors. Dynamic labels and API validation messages use the same dictionary. Standard size/color vocabulary is translated without changing submitted option values.

Product title, description, composition, size guide and optional variant titles use authored Medusa metadata at translations.ar. Missing fields retain their original French content. Prices, stock, images, variants and checkout remain unchanged. See [authoring instructions](./storefront-languages.md).

## Validation

- Frontend lint and TypeScript: passed.
- Catalog and multilingual regression tests: 66 passed.
- Production frontend build with Next.js/Webpack: passed, including page generation and standalone tracing.
- Production HTTP checks: all 11 existing page targets passed in both languages (22 page checks), including the real jacket product; translated invalid cart requests passed in both languages.
- Generic not-found pages: HTTP 404 with localized content in both languages.
- Cairo and Tajawal: present in self-hosted production stylesheets.
- Isolated live cart: same cart ID, variant ID, quantity and total across FR → AR → FR; checkout forms loaded in both languages; Arabic validation passed. The test item was removed afterward. No order or customer record was created.
- Stylesheet parsing and Git whitespace checks: passed.

## Remaining verification and content

Browser access to localhost was rejected by the browser tools URL policy. Desktop/mobile visual layout, actual language-switcher clicks, swipe gestures and browser-native validation popups therefore require manual browser verification; these were not claimed as visually tested. Server-rendered language, labels, metadata and live cart/API behavior were verified.

Owner-authored campaigns, custom collections/options and policy text retain their original content unless a reviewed dictionary entry or Arabic content exists. Product content without Arabic metadata deliberately retains its original content. There are no customer account/login pages in this frontend. Medusa Admin is a separate application and was not translated.

No backend source files, dependency declarations or lockfiles were changed. Nothing was committed or pushed. The built standalone frontend remains running at http://localhost:8000. Next.js regenerated next-env.d.ts during the build. Generated .next artifacts and temporary verification scripts/results in .local/i18n-tools are ignored development artifacts.

## Files changed or created for this request

- [apps/storefront/next-env.d.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/next-env.d.ts)
- [apps/storefront/src/app/api/cart/route.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/api/cart/route.ts)
- [apps/storefront/src/app/api/checkout/route.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/api/checkout/route.ts)
- [apps/storefront/src/app/boutique/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/boutique/page.tsx)
- [apps/storefront/src/app/collections/\[handle\]/not-found.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/collections/[handle]/not-found.tsx)
- [apps/storefront/src/app/collections/\[handle\]/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/collections/[handle]/page.tsx)
- [apps/storefront/src/app/collections/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/collections/page.tsx)
- [apps/storefront/src/app/commande/confirmation/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/commande/confirmation/page.tsx)
- [apps/storefront/src/app/commande/loading.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/commande/loading.tsx)
- [apps/storefront/src/app/commande/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/commande/page.tsx)
- [apps/storefront/src/app/contact/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/contact/page.tsx)
- [apps/storefront/src/app/error.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/error.tsx)
- [apps/storefront/src/app/favoris/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/favoris/page.tsx)
- [apps/storefront/src/app/globals.css](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/globals.css)
- [apps/storefront/src/app/i18n.css](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/i18n.css)
- [apps/storefront/src/app/informations/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/informations/page.tsx)
- [apps/storefront/src/app/layout.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/layout.tsx)
- [apps/storefront/src/app/not-found.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/not-found.tsx)
- [apps/storefront/src/app/nouveautes/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/nouveautes/page.tsx)
- [apps/storefront/src/app/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/page.tsx)
- [apps/storefront/src/app/panier/loading.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/panier/loading.tsx)
- [apps/storefront/src/app/panier/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/panier/page.tsx)
- [apps/storefront/src/app/produits/\[handle\]/loading.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/produits/[handle]/loading.tsx)
- [apps/storefront/src/app/produits/\[handle\]/not-found.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/produits/[handle]/not-found.tsx)
- [apps/storefront/src/app/produits/\[handle\]/page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/produits/[handle]/page.tsx)
- [apps/storefront/src/app/reference.css](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/app/reference.css)
- [apps/storefront/src/components/cart/cart-drawer.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/cart/cart-drawer.tsx)
- [apps/storefront/src/components/cart/cart-link.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/cart/cart-link.tsx)
- [apps/storefront/src/components/cart/cart-view.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/cart/cart-view.tsx)
- [apps/storefront/src/components/cart/checkout-form.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/cart/checkout-form.tsx)
- [apps/storefront/src/components/catalog/catalog-card-gallery.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-card-gallery.tsx)
- [apps/storefront/src/components/catalog/catalog-card.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-card.tsx)
- [apps/storefront/src/components/catalog/catalog-filters.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-filters.tsx)
- [apps/storefront/src/components/catalog/catalog-page.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-page.tsx)
- [apps/storefront/src/components/catalog/catalog-photo.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-photo.tsx)
- [apps/storefront/src/components/catalog/catalog-sort.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-sort.tsx)
- [apps/storefront/src/components/catalog/catalog-status.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/catalog-status.tsx)
- [apps/storefront/src/components/catalog/favorites-grid.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/favorites-grid.tsx)
- [apps/storefront/src/components/catalog/product-actions.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/catalog/product-actions.tsx)
- [apps/storefront/src/components/product/product-gallery.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/product/product-gallery.tsx)
- [apps/storefront/src/components/product/product-options.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/product/product-options.tsx)
- [apps/storefront/src/components/storefront/availability.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/availability.tsx)
- [apps/storefront/src/components/storefront/footer.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/footer.tsx)
- [apps/storefront/src/components/storefront/header.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/header.tsx)
- [apps/storefront/src/components/storefront/hero-slider.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/hero-slider.tsx)
- [apps/storefront/src/components/storefront/homepage-content-blocks.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/homepage-content-blocks.tsx)
- [apps/storefront/src/components/storefront/homepage-hero.module.css](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/homepage-hero.module.css)
- [apps/storefront/src/components/storefront/language-provider.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/language-provider.tsx)
- [apps/storefront/src/components/storefront/language-switcher.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/language-switcher.tsx)
- [apps/storefront/src/components/storefront/newsletter.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/newsletter.tsx)
- [apps/storefront/src/components/storefront/whatsapp-button.module.css](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/whatsapp-button.module.css)
- [apps/storefront/src/components/storefront/whatsapp-button.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/whatsapp-button.tsx)
- [apps/storefront/src/components/storefront/wordmark.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/storefront/wordmark.tsx)
- [apps/storefront/src/components/ui/icon.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/ui/icon.tsx)
- [apps/storefront/src/components/ui/sheet.tsx](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/components/ui/sheet.tsx)
- [apps/storefront/src/lib/cart-client.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/cart-client.ts)
- [apps/storefront/src/lib/cart.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/cart.ts)
- [apps/storefront/src/lib/catalog-model.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/catalog-model.ts)
- [apps/storefront/src/lib/catalog.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/catalog.ts)
- [apps/storefront/src/lib/checkout.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/checkout.ts)
- [apps/storefront/src/lib/i18n-metadata.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/i18n-metadata.ts)
- [apps/storefront/src/lib/i18n-server.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/i18n-server.ts)
- [apps/storefront/src/lib/i18n.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/i18n.ts)
- [apps/storefront/src/lib/messages-ar.json](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/messages-ar.json)
- [apps/storefront/src/lib/product-localization.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/product-localization.ts)
- [apps/storefront/src/lib/product-model.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/product-model.ts)
- [apps/storefront/src/lib/seo.ts](C:/Users/Chourouk/Desktop/AMOO/amoon/apps/storefront/src/lib/seo.ts)
- [docs/multilingual-implementation.md](C:/Users/Chourouk/Desktop/AMOO/amoon/docs/multilingual-implementation.md)
- [docs/storefront-languages.md](C:/Users/Chourouk/Desktop/AMOO/amoon/docs/storefront-languages.md)
- [tests/catalog.test.mjs](C:/Users/Chourouk/Desktop/AMOO/amoon/tests/catalog.test.mjs)
- [tests/i18n.test.mjs](C:/Users/Chourouk/Desktop/AMOO/amoon/tests/i18n.test.mjs)
