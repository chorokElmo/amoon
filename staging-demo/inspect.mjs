import { readFile, writeFile } from 'node:fs/promises';

// Read credentials into process environment; never include them in diagnostics.
const credentials = await readFile(new URL('../.env.staging-demo', import.meta.url), 'utf8');
for (const line of credentials.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && ['MEDUSA_ADMIN_API_KEY', 'MEDUSA_PUBLISHABLE_KEY'].includes(match[1])) {
    process.env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }
}
const base = 'https://api-staggin.amoon.ma';
const adminKey = process.env.MEDUSA_ADMIN_API_KEY;
const storeKey = process.env.MEDUSA_PUBLISHABLE_KEY;
if (!adminKey?.startsWith('sk_') || !storeKey?.startsWith('pk_')) {
  throw new Error('Staging Admin and publishable API keys are required in .env.staging-demo.');
}
async function get(path, params = {}) {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const headers = path.startsWith('/admin/')
    ? { Authorization: `Basic ${adminKey}` }
    : { 'x-publishable-api-key': storeKey };
  const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}
async function all(path, field, params = {}) {
  const result = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const data = await get(path, { ...params, limit: '100', offset: String(offset) });
    if (!Array.isArray(data[field])) throw new Error(`${path}: Unexpected response shape`);
    result.push(...data[field]);
    if (data[field].length < 100) return result;
  }
  throw new Error(`${path}: Inspection limit exceeded`);
}
const [stores, regions, channels, categories, locations, products, storefrontRegions] = await Promise.all([
  get('/admin/stores'),
  all('/admin/regions', 'regions'),
  all('/admin/sales-channels', 'sales_channels'),
  all('/admin/product-categories', 'product_categories'),
  all('/admin/stock-locations', 'stock_locations', { fields: 'id,name,*sales_channels' }),
  all('/admin/products', 'products', { fields: 'id,title,handle,status,*variants,+metadata' }),
  all('/store/regions', 'regions'),
]);
// Save selected catalog/configuration fields only; no credentials or customer data.
const report = {
  inspected_at: new Date().toISOString(), backend: base,
  staging_isolation_verified: false,
  stores: stores.stores?.map(s => ({ id: s.id, name: s.name, default_region_id: s.default_region_id, default_sales_channel_id: s.default_sales_channel_id })),
  regions: regions.map(r => ({ id: r.id, name: r.name, currency_code: r.currency_code, countries: r.countries?.map(c => c.iso_2) })),
  sales_channels: channels.map(c => ({ id: c.id, name: c.name, is_disabled: c.is_disabled })),
  categories: categories.map(c => ({ id: c.id, name: c.name, handle: c.handle, is_active: c.is_active, is_internal: c.is_internal })),
  stock_locations: locations.map(l => ({ id: l.id, name: l.name, sales_channels: l.sales_channels?.map(c => c.id) })),
  existing_products: products.map(p => ({ id: p.id, title: p.title, handle: p.handle, status: p.status, is_demo: p.metadata?.is_demo === true, variants: p.variants?.map(v => ({ id: v.id, sku: v.sku })) })),
  storefront_regions: storefrontRegions.map(r => ({ id: r.id, name: r.name, currency_code: r.currency_code })),
};
await writeFile(new URL('./inspection.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ products: products.length, categories: categories.length, regions: regions.length, channels: channels.length, locations: locations.length, report: 'staging-demo/inspection.json', writes_to_backend: 0 }));
