# AMOON demo catalog report — 15 October 2026

**Publication update:** all twelve products were subsequently published at your explicit request, and all 96 variants passed hosted browser checks. See [the publication report](publication-report.md) for current status. The draft-stage record below is retained as history; its publication limitation and metadata values are superseded by that report.

## Result

Created **12 draft products**, **96 variants**, **96 unique AMOON-DEMO SKUs**, and **960 demo inventory units** through the existing hosted Medusa Admin, import workflows, product APIs and file storage. Created and assigned all five requested categories as inactive categories. No real products were overwritten or deleted. The original published “Jupe femme” remains present with its original product ID and one variant.

**Publication is intentionally blocked:** you confirmed staging does not have a separate database. These drafts therefore exist in the shared Admin database. Nothing was published. Separate staging infrastructure is still needed to test published demo product pages without affecting the live store.

No commit, push, rebuild or deployment was performed. Existing storefront source edits were left untouched.

## Configuration inspected

- Local project Medusa dependencies: **2.21.2**; hosted runtime version not independently established.
- Backend: https://api-staggin.amoon.ma; storefront: https://staggin.amoon.ma.
- Authentication: your existing signed-in browser session; no password, session token or secret API key was extracted, printed or saved. The initially prepared environment-file helper was not needed.
- Region: **Maroc**, MAD, ID `reg_01M4M16BPE4GQSP2P9D36ZQWJ1`.
- Sales channel: **Amoon Storefront**, ID `sc_01M4M16BS1VZAAY7VC02P28WD4`. Admin indicated two sales channels in total; demos are assigned only to Amoon Storefront.
- Inventory location: **Amoon Collection**, ID `sloc_01M4M16MGW09TNCPVKF5GJQMKA`.
- File provider: Medusa local file provider; saved images use the hosted backend's `/static` URLs.

## Created products

Every product has S, M, L and XL in each of two colors, eight variants per product, ten units per SKU, managed inventory, and backorders disabled. Prices are MAD currency amounts, not centime values. French descriptions explicitly identify the fictional demo characteristics and prices. Product metadata contains `demo_batch=amoon-staging-demo-2026-10-14` and `is_demo="true"`; variant metadata also identifies the demo batch. The string value on product metadata reflects Admin's text metadata editor.

| Product / Admin link | Category | MAD | Colors | Uploaded source |
|---|---|---:|---|---|
| [Robe midi portefeuille Élise](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF703JME0G4RH1JM4EC) | Robes | 449 | Terracotta, Noir | [Image 001](https://api-staggin.amoon.ma/static/1791990902226-001.png) |
| [Blouse à col noué Salma](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF828HH1XE871X3E0WP) | Chemises & Tops | 329 | Écru, Rose poudré | [Image 005](https://api-staggin.amoon.ma/static/1791991368567-005.jpg) |
| [Robe chemise ceinturée Lina](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF87699X1132757RFMC) | Robes | 499 | Beige, Bleu ciel | [Image 003](https://api-staggin.amoon.ma/static/1791991289881-003.jpg) |
| [Ensemble chemise et pantalon Dalia](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF8C10649VJ8QX95QJA) | Ensembles | 699 | Sable, Olive | [Image 007](https://api-staggin.amoon.ma/static/1791991444694-007.jpg) |
| [Chemise à coupe ample Inès](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF8NXYG7VYB8M5FC23X) | Chemises & Tops | 299 | Blanc, Bleu ciel | [Image 004](https://api-staggin.amoon.ma/static/1791991363366-004.jpg) |
| [Robe longue plissée Nour](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF8W54P7KTBEQFKP755) | Robes | 599 | Sauge, Marine | [Image 002](https://api-staggin.amoon.ma/static/1791991149983-002.jpg) |
| [Top à maille côtelée Aya](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF8XNWR335NV45FBP45) | Chemises & Tops | 229 | Camel, Noir | [Image 006](https://api-staggin.amoon.ma/static/1791991372794-006.jpg) |
| [Pantalon large taille haute Amira](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF93FM08DQSWX861W84) | Jupes & Pantalons | 399 | Camel, Anthracite | [Image 010](https://api-staggin.amoon.ma/static/1791991459654-010.jpg) |
| [Jupe midi plissée Yasmine](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF9A8ZJ68EK7G42VZC9) | Jupes & Pantalons | 349 | Champagne, Noir | [Image 009](https://api-staggin.amoon.ma/static/1791991454168-009.jpg) |
| [Ensemble veste et pantalon Sofia](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF9CM7BPPQJB4W2B6SB) | Ensembles | 899 | Marine, Beige | [Image 008](https://api-staggin.amoon.ma/static/1791991449203-008.jpg) |
| [Gilet long ouvert Jade](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF9MN7DGRN2GH27N9DQ) | Vestes & Gilets | 379 | Écru, Taupe | [Image 012](https://api-staggin.amoon.ma/static/1791991470778-012.jpg) |
| [Veste blazer structurée Leïla](https://api-staggin.amoon.ma/app/products/prod_01M4XEHJF9WGA04RDEX11FY4DN) | Vestes & Gilets | 599 | Beige, Noir | [Image 011](https://api-staggin.amoon.ma/static/1791991465494-011.jpg) |

## Images and provenance

All twelve images are **original AI-generated fictional garment visuals**, created for this task with the built-in imagegen tool. They are not retailer photographs, downloaded stock photographs, or representations of real inventory. Each image shows both color options. No third-party image license is claimed or required from a stock-photo source. Commercial use remains subject to the applicable image-generation service terms; no exclusivity or copyright registration is represented.

PNG originals are preserved under `staging-demo/images/001.png` through `012.png`. JPEG copies retain the original dimensions and reduce upload size. The uploaded backend URLs appear in the table. No external image host is required for storefront delivery.

## Verification

- Initial import preview: **12 creates, 0 updates**; notification confirmed successful completion.
- Hosted product CSV export: **12 demo product IDs, 96 unique SKUs, all draft, all 96 MAD prices match the prepared catalog, managed inventory enabled, variant demo metadata present**.
- All sizes and color combinations were checked against the prepared import. Admin showed eight variants for every demo product.
- Product metadata and category associations were saved through Admin. Categories remain inactive.
- All five inventory pages were read after saving: **96 distinct demo SKUs, each with stock 10 and reserved 0**, totaling 960 units.
- All twelve uploaded image URLs returned HTTP 200 with image content types. All twelve also returned HTTP 200 through the hosted storefront's `/api/catalog-image` proxy.
- Final Admin product list: **12 drafts, eight variants each, twelve loaded thumbnails**. Screenshot: `completed-drafts.jpg`.
- Hosted storefront boutique HTML contained **zero demo product titles or handles**, as expected for drafts.
- No published product-page, public variant-picker, or demo checkout test was performed because publication into this shared database is blocked by the staging isolation requirement.

## Issues handled and remaining limitations

- An inventory editor fetch failure recovered after reloading. Persisted quantities were subsequently verified on all five pages.
- A thumbnail-only CSV update failed after applying the first thumbnail. The remaining thumbnails were assigned and saved directly in Admin; all twelve loaded successfully in the final list.
- Browser authentication expired during final verification. You signed in again; no credential was shared in chat.
- **Remaining:** separate staging from production before publishing the demos, activating their categories, or performing public product-page and checkout acceptance tests. The original task's requirement to verify staging isolation has not been met.

Supporting files: `created-products.json`, `verification.json`, `image-checks.json`, `hosted-products-export.csv`, `catalog.json`, and `completed-drafts.jpg`. The export predates the thumbnail correction; the final Admin image-load check and screenshot verify those corrections.
