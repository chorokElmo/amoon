import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
const dir = new URL('./', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', dir), 'utf8'));
const products = JSON.parse(await readFile(new URL('created-products.json', dir), 'utf8'));
const imageChecks = JSON.parse(await readFile(new URL('image-checks.json', dir), 'utf8'));
const rows = parse(await readFile(new URL('hosted-products-export.csv', dir)), { columns: true });
const variants = rows.filter(r => r['Variant Sku']?.startsWith('AMOON-DEMO-'));
const checks = {
  report_date: '2026-10-15',
  products_created: products.length,
  variants: variants.length,
  unique_skus: new Set(variants.map(v => v['Variant Sku'])).size,
  all_prices_match: variants.every(v => Number(v['Variant Price MAD']) === catalog.products.find(p => p.handle === v['Product Handle'])?.price_mad),
  all_draft_at_export: variants.every(v => v['Product Status'] === 'draft'),
  all_manage_inventory: variants.every(v => v['Variant Manage Inventory'] === 'true'),
  all_backorders_disabled: variants.every(v => v['Variant Allow Backorder'] === 'false'),
  all_variant_options_match: variants.every(v => {
    const product = catalog.products.find(p => p.handle === v['Product Handle']);
    const options = { [v['Variant Option 1 Name']]: v['Variant Option 1 Value'], [v['Variant Option 2 Name']]: v['Variant Option 2 Value'] };
    const color = product?.colors.find(c => c.name === options.Couleur);
    return product && color && catalog.sizes.includes(options.Taille) && v['Variant Sku'] === `AMOON-DEMO-${product.code}-${color.code}-${options.Taille}`;
  }),
  variant_demo_metadata: variants.every(v => v['Variant Metadata.is_demo'] === 'true'),
  inventory_admin_verified: { unique_skus: 96, stocked_quantity_each: 10, reserved_quantity_each: 0, total_units: 960, location: 'Amoon Collection' },
  final_admin_verified: { drafts: 12, variants_each: 8, thumbnails_loaded: 12 },
  images: imageChecks,
  storefront_demo_listings_found: 0,
  staging_isolated: false,
  published: false,
};
if (checks.products_created !== 12 || checks.unique_skus !== 96 || !checks.all_prices_match || !checks.all_draft_at_export || !checks.all_variant_options_match || !checks.all_backorders_disabled) throw new Error('Catalog verification failed');
await writeFile(new URL('verification.json', dir), JSON.stringify(checks, null, 2) + '\n');
const table = products.map(p => {
  const item = catalog.products.find(c => c.handle === p.handle);
  return `| [${p.title}](https://api-staggin.amoon.ma/app/products/${p.id}) | ${item.category} | ${p.price_mad} | ${item.colors.map(c => c.name).join(', ')} | [Image ${item.code}](${p.image}) |`;
}).join('\n');
const report = `# AMOON demo catalog report — 15 October 2026

## Result

Created **12 draft products**, **96 variants**, **96 unique AMOON-DEMO SKUs**, and **960 demo inventory units** through the existing hosted Medusa Admin, import workflows, product APIs and file storage. Created and assigned all five requested categories as inactive categories. No real products were overwritten or deleted. The original published “Jupe femme” remains present with its original product ID and one variant.

**Publication is intentionally blocked:** you confirmed staging does not have a separate database. These drafts therefore exist in the shared Admin database. Nothing was published. Separate staging infrastructure is still needed to test published demo product pages without affecting the live store.

No commit, push, rebuild or deployment was performed. Existing storefront source edits were left untouched.

## Configuration inspected

- Local project Medusa dependencies: **2.21.2**; hosted runtime version not independently established.
- Backend: https://api-staggin.amoon.ma; storefront: https://staggin.amoon.ma.
- Authentication: your existing signed-in browser session; no password, session token or secret API key was extracted, printed or saved. The initially prepared environment-file helper was not needed.
- Region: **Maroc**, MAD, ID \`reg_01M4M16BPE4GQSP2P9D36ZQWJ1\`.
- Sales channel: **Amoon Storefront**, ID \`sc_01M4M16BS1VZAAY7VC02P28WD4\`. Admin indicated two sales channels in total; demos are assigned only to Amoon Storefront.
- Inventory location: **Amoon Collection**, ID \`sloc_01M4M16MGW09TNCPVKF5GJQMKA\`.
- File provider: Medusa local file provider; saved images use the hosted backend's \`/static\` URLs.

## Created products

Every product has S, M, L and XL in each of two colors, eight variants per product, ten units per SKU, managed inventory, and backorders disabled. Prices are MAD currency amounts, not centime values. French descriptions explicitly identify the fictional demo characteristics and prices. Product metadata contains \`demo_batch=amoon-staging-demo-2026-10-14\` and \`is_demo="true"\`; variant metadata also identifies the demo batch. The string value on product metadata reflects Admin's text metadata editor.

| Product / Admin link | Category | MAD | Colors | Uploaded source |
|---|---|---:|---|---|
${table}

## Images and provenance

All twelve images are **original AI-generated fictional garment visuals**, created for this task with the built-in imagegen tool. They are not retailer photographs, downloaded stock photographs, or representations of real inventory. Each image shows both color options. No third-party image license is claimed or required from a stock-photo source. Commercial use remains subject to the applicable image-generation service terms; no exclusivity or copyright registration is represented.

PNG originals are preserved under \`staging-demo/images/001.png\` through \`012.png\`. JPEG copies retain the original dimensions and reduce upload size. The uploaded backend URLs appear in the table. No external image host is required for storefront delivery.

## Verification

- Initial import preview: **12 creates, 0 updates**; notification confirmed successful completion.
- Hosted product CSV export: **12 demo product IDs, 96 unique SKUs, all draft, all 96 MAD prices match the prepared catalog, managed inventory enabled, variant demo metadata present**.
- All sizes and color combinations were checked against the prepared import. Admin showed eight variants for every demo product.
- Product metadata and category associations were saved through Admin. Categories remain inactive.
- All five inventory pages were read after saving: **96 distinct demo SKUs, each with stock 10 and reserved 0**, totaling 960 units.
- All twelve uploaded image URLs returned HTTP 200 with image content types. All twelve also returned HTTP 200 through the hosted storefront's \`/api/catalog-image\` proxy.
- Final Admin product list: **12 drafts, eight variants each, twelve loaded thumbnails**. Screenshot: \`completed-drafts.jpg\`.
- Hosted storefront boutique HTML contained **zero demo product titles or handles**, as expected for drafts.
- No published product-page, public variant-picker, or demo checkout test was performed because publication into this shared database is blocked by the staging isolation requirement.

## Issues handled and remaining limitations

- An inventory editor fetch failure recovered after reloading. Persisted quantities were subsequently verified on all five pages.
- A thumbnail-only CSV update failed after applying the first thumbnail. The remaining thumbnails were assigned and saved directly in Admin; all twelve loaded successfully in the final list.
- Browser authentication expired during final verification. You signed in again; no credential was shared in chat.
- **Remaining:** separate staging from production before publishing the demos, activating their categories, or performing public product-page and checkout acceptance tests. The original task's requirement to verify staging isolation has not been met.

Supporting files: \`created-products.json\`, \`verification.json\`, \`image-checks.json\`, \`hosted-products-export.csv\`, \`catalog.json\`, and \`completed-drafts.jpg\`. The export predates the thumbnail correction; the final Admin image-load check and screenshot verify those corrections.
`;
await writeFile(new URL('report.md', dir), report);
console.log('Report saved. 12 drafts, 96 prices verified, 96 unique SKUs; publication remains blocked.');
