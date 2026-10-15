# AMOON publication report — 15 October 2026

All **12 demo products are published** and visible at [the hosted boutique](https://staggin.amoon.ma/boutique). All five requested categories are active and public. No code rebuild, deployment, commit or push was performed.

**Checkout correction:** after a reported final-confirmation error, all twelve demo products were linked to the existing Default Shipping Profile. See [checkout-fix-report.md](checkout-fix-report.md). The publication checks below covered variant selection and purchase controls, not a completed order.

You explicitly requested publication after being informed that staging shares the live database. Publication was therefore performed in that shared environment; staging isolation has not been established. The changes can also affect the live store using the same backend. Demo descriptions and batch labels remain in place.

## Changes

- Published only the twelve product IDs recorded in `created-products.json`; the import preview showed **0 creates and 12 updates**.
- Retained all 96 existing variant IDs, prices, SKUs and inventory associations.
- Activated Robes, Chemises & Tops, Ensembles, Jupes & Pantalons, and Vestes & Gilets.
- Set product metadata `is_demo` to false because the existing storefront uses this flag to hide products. Preserved `demo_batch=amoon-staging-demo-2026-10-14` on every product and the explicit demo wording in every description. Variant metadata continues to identify demo stock. The first two products also have `demo_product=true`.
- Preserved the original published “Jupe femme,” with one variant and its original ID. No real product was overwritten or deleted.

## Verification

- Admin: **12 published demo products**, each with eight variants; the original real product remains published.
- Categories: all five show **Active / Public** in Admin.
- Hosted boutique: links to all **12** demo products are present.
- Public product pages: all **12** return HTTP 200 with their expected title, MAD price, product image, sizes and purchase controls. See `publication-checks.json`.
- Browser interaction: selected every one of the **96 variants** across all twelve hosted product pages. Every selection displayed its unique AMOON-DEMO SKU, correct MAD price, “En stock,” maximum quantity **10**, and an enabled **Ajouter au panier** button. See `live-variant-checks.json`.
- Uploaded images and storefront image proxy: all twelve returned HTTP 200 in the preceding delivery check (`image-checks.json`).
- No cart was submitted and no order, payment or reservation was created during testing.

## Products

| Product | MAD | Public page |
|---|---:|---|
| Robe midi portefeuille Élise | 449 | [View](https://staggin.amoon.ma/produits/amoon-demo-robe-midi-elise) |
| Robe longue plissée Nour | 599 | [View](https://staggin.amoon.ma/produits/amoon-demo-robe-longue-nour) |
| Robe chemise ceinturée Lina | 499 | [View](https://staggin.amoon.ma/produits/amoon-demo-robe-chemise-lina) |
| Chemise à coupe ample Inès | 299 | [View](https://staggin.amoon.ma/produits/amoon-demo-chemise-ines) |
| Blouse à col noué Salma | 329 | [View](https://staggin.amoon.ma/produits/amoon-demo-blouse-salma) |
| Top à maille côtelée Aya | 229 | [View](https://staggin.amoon.ma/produits/amoon-demo-top-aya) |
| Ensemble chemise et pantalon Dalia | 699 | [View](https://staggin.amoon.ma/produits/amoon-demo-ensemble-dalia) |
| Ensemble veste et pantalon Sofia | 899 | [View](https://staggin.amoon.ma/produits/amoon-demo-ensemble-sofia) |
| Jupe midi plissée Yasmine | 349 | [View](https://staggin.amoon.ma/produits/amoon-demo-jupe-yasmine) |
| Pantalon large taille haute Amira | 399 | [View](https://staggin.amoon.ma/produits/amoon-demo-pantalon-amira) |
| Veste blazer structurée Leïla | 599 | [View](https://staggin.amoon.ma/produits/amoon-demo-veste-leila) |
| Gilet long ouvert Jade | 379 | [View](https://staggin.amoon.ma/produits/amoon-demo-gilet-jade) |

The twelve product images are original AI-generated fictional garment visuals created for this catalog, with PNG originals in `images/001.png` through `images/012.png`. Uploaded image URLs and initial configuration details are recorded in the earlier draft preparation report. No retailer or stock-photo images were copied.

Screenshots: `live-storefront.jpg` and `published-admin.jpg`. The earlier `report.md` records the initial draft stage; this publication report supersedes its publication status and visibility flags.
