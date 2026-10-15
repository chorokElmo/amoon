import { readFile, writeFile } from 'node:fs/promises';
const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));
const headers = ['Product Handle', 'Product Title', 'Product Subtitle', 'Product Description', 'Product Status', 'Product External Id', 'Product Discountable', 'Product Sales Channel 1', 'Variant Title', 'Variant SKU', 'Variant Manage Inventory', 'Variant Allow Backorder', 'Variant Price MAD', 'Variant Option 1 Name', 'Variant Option 1 Value', 'Variant Option 2 Name', 'Variant Option 2 Value', 'Variant Metadata'];
const rows = catalog.products.flatMap(product => product.colors.flatMap(color => catalog.sizes.map(size => [
  product.handle, product.title, 'AMOON — Collection de démonstration', product.description, 'draft', `${catalog.batch}-${product.code}`, 'false', 'sc_01M4M16BS1VZAAY7VC02P28WD4', `${color.name} / ${size}`, `AMOON-DEMO-${product.code}-${color.code}-${size}`, 'true', 'false', product.price_mad, 'Taille', size, 'Couleur', color.name, JSON.stringify(catalog.metadata),
])));
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
await writeFile(new URL('./products-draft.csv', import.meta.url), [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n');
console.log('Prepared 12 new draft products, 96 managed variants. No existing IDs, no publication.');
