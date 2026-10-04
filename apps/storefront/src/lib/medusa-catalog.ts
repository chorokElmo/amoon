import { record, list, text, normalizeProduct, normalizeGroup, type CatalogData } from "./catalog-model";

export class CatalogUnavailable extends Error {
  constructor(public code: "configuration" | "region" | "upstream" | "capacity") { super("Catalog unavailable"); }
}
export type MedusaConfig = { url: string; publishableKey: string; regionId?: string };
type Transport = (url: string, init: RequestInit & { next?: { revalidate: number } }) => Promise<Response>;

export async function readMedusaCatalog(config: MedusaConfig, transport: Transport = fetch): Promise<CatalogData> {
  let origin: URL;
  try { origin = new URL(config.url); } catch { throw new CatalogUnavailable("configuration"); }
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || !config.publishableKey || !config.publishableKey.startsWith("pk_")) throw new CatalogUnavailable("configuration");
  const signal = AbortSignal.timeout(20000);
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(path, origin); for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await transport(url.toString(), { headers: { "x-publishable-api-key": config.publishableKey, Accept: "application/json" }, redirect: "error", signal, next: { revalidate: 30 } });
    if (!response.ok) throw new CatalogUnavailable("upstream");
    return record(await response.json());
  }
  async function all(path: string, key: string, params: Record<string, string> = {}) {
    const values: unknown[] = []; const ids = new Set<string>();
    for (let offset = 0; offset <= 1000; offset += 100) {
      const data = await get(path, { ...params, limit: "100", offset: String(offset) });
      if (!Array.isArray(data[key])) throw new CatalogUnavailable("upstream");
      const page = list(data[key]);
      if (values.length + page.length > 1000) throw new CatalogUnavailable("capacity");
      for (const value of page) { const id = text(record(value).id); if (!id || ids.has(id)) throw new CatalogUnavailable("upstream"); ids.add(id); values.push(value); }
      if (page.length < 100) return values;
    }
    throw new CatalogUnavailable("capacity");
  }
  try {
    const regions = await all("/store/regions", "regions");
    const compatible = regions.map(record).filter(region => text(region.currency_code).toLowerCase() === "mad" && list(region.countries).some(country => text(record(country).iso_2).toLowerCase() === "ma"));
    const region = config.regionId ? compatible.find(region => region.id === config.regionId) : compatible.length === 1 ? compatible[0] : null;
    if (!region) throw new CatalogUnavailable("region");
    const [products, categories, collections] = await Promise.all([
      all("/store/products", "products", { fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,*categories,*images", region_id: text(region.id), country_code: "ma", order: "id" }),
      all("/store/product-categories", "product_categories", { fields: "id,name,handle,description,parent_category_id", order: "rank" }),
      all("/store/collections", "collections", { fields: "id,title,handle", order: "id" }),
    ]);
    return { products: products.map(normalizeProduct), categories: categories.map(value => normalizeGroup(value)), collections: collections.map(value => normalizeGroup(value, true)) };
  } catch (error) { if (error instanceof CatalogUnavailable) throw error; throw new CatalogUnavailable("upstream"); }
}
