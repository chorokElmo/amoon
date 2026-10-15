# AMOON homepage redesign — 15 October 2026

## Latest update: hijab photography

At the merchant’s request, all active homepage lifestyle photographs now show women wearing hijab: hero, four category cards and editorial portrait. Five licensed Pexels originals provide six optimized WebP assets. Current sources and authors are listed in the updated [license manifest](../../apps/storefront/public/images/editorial/LICENSES.md); the earlier image list below describes the previous revision and is superseded by that manifest.

New assets: hijab-beach.webp, hijab-beach-mobile.webp, hijab-portrait.webp, hijab-white-shirt.webp, hijab-tailoring.webp and hijab-casual.webp. Updated page.tsx, homepage-hero.tsx, homepage-hero.module.css, messages-ar.json and LICENSES.md. Product imagery and hosted data are unchanged. No personal religious identity is asserted about the models; selection is based on the visible hijab clothing.

Verified desktop/mobile hero framing, all four category photos loaded, mobile width without overflow, TypeScript, lint and all eight i18n tests. New proof images: hijab-desktop.jpg, hijab-categories.jpg, hijab-mobile.jpg. Local preview refreshes with these changes; nothing deployed.

Implemented locally in the existing Next.js storefront. Preview: http://localhost:8005. No commit, push, production build or deployment. No hosted backend writes, product creation, or order/payment changes.

The requested attachment was not present in the message. The implementation follows the written burgundy/cream, serif, photographic editorial direction; fidelity to the missing reference cannot be verified.

## Implemented

- Single full-width photographic hero with “Nouvelle Collection”, “Élégance au quotidien” and “Découvrir maintenant”. No automatic or manual slider on the new homepage. Cream typography, burgundy CTA and localized gradients keep copy readable without placing it over the model’s face.
- Real licensed photography, downloaded locally and converted to WebP. A separate mobile crop uses a responsive picture source; Next.js optimizes both desktop and mobile images. Hero loads eagerly with high fetch priority; other images remain lazy. Static image dimensions, fixed section geometry and image blur placeholders reduce loading shifts. Total new WebP source assets: approximately 456 KB; desktop hero 93 KB, mobile source 35 KB. Responsive delivery uses smaller derivatives where appropriate.
- Four photographic category cards drawn from existing Medusa categories with in-stock products, linked to real category pages. Images are editorial inspiration, not assertions that the stock outfits are AMOON products. No product/category associations were changed. Other populated categories remain available through “Voir toutes les catégories”.
- “Nos dernières pièces” displays eight available Medusa products using the existing catalog cards, MAD pricing, options links and commerce components. Products are not hardcoded. Existing demo product images remain supplied by Medusa.
- Editorial lifestyle section with real photograph, admin-managed AMOON text and boutique CTA. Preserved section visibility, ordering, custom headings/descriptions, promotions, configured featured collections with available products, newsletter gating and social destination. Removed the repeated demo-image social mosaic rather than presenting generated product visuals as Instagram editorial photography.
- Bespoke Admin hero copy is retained; the old seeded three-slide copy is replaced with the requested campaign wording. The first custom slide supplies copy/CTA, while the new licensed campaign photo supplies imagery. An intentionally empty configured slider still hides the hero. Existing slider records and upload assets are untouched.
- Trust section reads saved merchant settings. Cash on delivery is enabled and the existing WhatsApp number is retained. Delivery options are empty, so no nationwide promise is shown. The exchange text equals the seeded default and has no independent merchant confirmation, so no seven-day promise is shown. Homepage header/mobile-menu default delivery/exchange promises are also suppressed; other routes retain their existing header behavior.
- French/Arabic UI, logical RTL alignment, meaningful translated photo alt text, keyboard focus styling, one hero H1 and existing SEO/structured data retained. Homepage meta description no longer promises unverified delivery coverage.

## Files changed for this request

These are this request’s edits; other changes already present in the working tree were retained.

1. apps/storefront/src/app/page.tsx — homepage sections, category availability/photos, trust gating, metadata.
2. apps/storefront/src/app/homepage.module.css — scoped homepage typography, cards, spacing, editorial and responsive layout.
3. apps/storefront/src/components/storefront/homepage-hero.tsx — single server-rendered campaign and responsive optimized photo sources.
4. apps/storefront/src/components/storefront/homepage-hero.module.css — full-width hero, overlays, mobile composition and RTL.
5. apps/storefront/src/components/storefront/header.tsx — homepage-only suppression of unconfirmed default service promises; other routes unchanged.
6. apps/storefront/src/lib/messages-ar.json — new homepage text, photo alt text and trust translations.

New image/document assets under apps/storefront/public/images/editorial:

- daylight-field.webp
- daylight-field-mobile.webp
- stone-wall-dress.webp
- ivory-dress.webp
- neutral-shirt.webp
- beige-blazer.webp
- white-shirt-trousers.webp
- LICENSES.md

Review artifacts under artifacts/homepage-redesign: this report, http-checks.json, desktop-fr.jpg, desktop-ar.jpg, tablet-fr.jpg, tablet-ar.jpg, mobile-fr.jpg, mobile-ar.jpg, categories-desktop-fr.jpg and editorial-desktop-fr.jpg. Ignored .local files contain preview/QA helpers; no credentials are included in this report or asset folder.

## Images and rights

Six original Pexels photographs, seven WebP derivatives including the mobile crop. Author names, original URLs and per-file uses are in [the asset license manifest](../../apps/storefront/public/images/editorial/LICENSES.md).

- Hero: cottonbro studio, Pexels 10679179.
- Editorial: Airam Dato-on, Pexels 9638153.
- Robes: Anastasiia Lopushynska, Pexels 11519161.
- Chemises & Tops: MART PRODUCTION, Pexels 7318795.
- Ensembles: Елена Вотинцева, Pexels 9766882.
- Jupes & Pantalons: Карина Каржавина, Pexels 7945664.

Original photo pages identify these as free licensed photographs; the [Pexels License](https://www.pexels.com/license/) permits commercial website use and modification. Attribution is optional. No endorsement, trademark use or standalone resale is claimed. A candidate with a visible competing brand logo was rejected and removed. No generated imagery or mockup screenshot was used in the new hero/editorial/category photography. Existing demo product-image provenance was not changed or independently established by this request.

## Tests completed

- ESLint across apps/storefront/src: passed.
- TypeScript noEmit for apps/storefront: passed.
- Existing offline suite: 137 passed, 0 failed. The initial run detected an untranslated new hero brand label; it was corrected and the full suite rerun successfully.
- Read-only HTTP audit: all 23 homepage internal links and seven local photo asset URLs checked returned 200; see http-checks.json. URL counts include boutique, category and product pages plus information/contact destinations; fragments resolve on their existing pages.
- Browser: desktop 1440×1000, tablet 768×1024, mobile 390×844; French and Arabic RTL. Final review tab used its normal desktop viewport as well. No horizontal document overflow on checked layouts. Hero copy, four categories and eight live product cards confirmed. The mobile currentSrc selects the dedicated cropped hero through Next.js image optimization.
- Loaded homepage images had no completed-but-broken images in the inspected DOM. Category cards and editorial photo were visually inspected.
- Clicked Robes category to its actual page, then the homepage product options CTA to Pantalon Amira’s existing product page. Its title and destination were confirmed. No cart or order submission was performed.
- Final clean browser preview: no console errors or warnings. A development Image fill-parent warning found during QA was corrected by positioning the picture element; transient Fast Refresh logs were limited to the editing session.

## Remaining issues / unverified

- Exact reference matching awaits the missing attachment.
- Hosted staging still runs its previously deployed version. Changes need review and a separately authorized deployment.
- No production build, Lighthouse score or field Core Web Vitals measurement was run. The changes improve image delivery and remove slider JS, but performance scores are not claimed.
- Physical devices, Safari/Firefox, third-party WhatsApp/Instagram service availability and every catalog permutation were not exhaustively tested.
- Real hosted add-to-cart/checkout/payment were not submitted. Existing commerce logic is reused and was not modified; this request verified navigation rather than placing an order.
- Merchant-authored Arabic product names/descriptions remain absent for some existing products, which continue to use the existing French fallback.
- A client-owned product/editorial shoot can replace the licensed inspiration photography later. Before selling actual stock, existing demo images and descriptions should be replaced/approved by the merchant; their accuracy and rights are outside this redesign’s new stock-photo license verification.
- Other routes’ pre-existing service announcements are unchanged to honor the homepage-only scope.
