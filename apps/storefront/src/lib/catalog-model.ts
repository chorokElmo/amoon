export type SearchParams = Record<string, string | string[] | undefined>;
export type Stock = "in_stock" | "backorder" | "out_of_stock" | "unknown";
export type CatalogVariant = { maxQuantity?: number | null; id: string; title: string; options: { name: string; value: string }[]; sku: string | null; sizes: string[]; colors: string[]; price: number | null; originalPrice: number | null; stock: Stock };
export type CatalogProduct = { imageFit?: "contain" | "cover"; id: string; handle: string; title: string; description: string; composition?: string | null; thumbnail: string | null; images: string[]; sizeGuide: string | null; createdAt: number; popularity: number | null; categoryIds: string[]; collectionId: string | null; variants: CatalogVariant[] };
export type CatalogGroup = { id: string; handle: string; name: string; description: string; parentId: string | null };
export type CatalogData = { products: CatalogProduct[]; categories: CatalogGroup[]; collections: CatalogGroup[] };
export const sortChoices = { newest: "Nouveautés", price_asc: "Prix croissant", price_desc: "Prix décroissant", popular: "Populaires" } as const;
export type Filters = { q: string; categories: string[]; sizes: string[]; colors: string[]; min: number | null; max: number | null; available: boolean; sort: keyof typeof sortChoices; page: number; issues: string[]; universe: "collection" | null };
export const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const text = (value: unknown): string => typeof value === "string" ? value : "";
const amount = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

export function normalizeGroup(value: unknown, collection = false): CatalogGroup {
  const group = record(value);
  if (!text(group.id) || !text(group.handle) || !text(collection ? group.title : group.name)) throw new Error("Invalid catalog group");
  return { id: text(group.id), handle: text(group.handle), name: text(collection ? group.title : group.name), description: text(group.description), parentId: text(group.parent_category_id) || null };
}

export function normalizeProduct(value: unknown): CatalogProduct {
  const product = record(value);
  if (!text(product.id) || !text(product.title) || !text(product.handle)) throw new Error("Invalid product");
  const optionTitles = new Map(list(product.options).map(item => { const option = record(item); return [text(option.id), fold(text(option.title))]; }));
  const optionNames = new Map(list(product.options).map(item => { const option = record(item); return [text(option.id), text(option.title)]; }));
  const variants = list(product.variants).map(item => {
    const variant = record(item); const price = record(variant.calculated_price);
    const sizes: string[] = []; const colors: string[] = []; const options: CatalogVariant["options"] = [];
    for (const item of list(variant.options)) {
      const option = record(item); const title = optionTitles.get(text(option.option_id)) || fold(text(record(option.option).title));
      const value = text(option.value).trim();
      const name = optionNames.get(text(option.option_id)) || text(record(option.option).title);
      if (value && name) options.push({ name, value });
      if (value && ["taille", "tailles", "size", "sizes"].includes(title)) sizes.push(value);
      if (value && ["couleur", "couleurs", "color", "colors", "colour", "colours"].includes(title)) colors.push(value);
    }
    let stock: Stock = "unknown";
    if (variant.manage_inventory === false || (typeof variant.inventory_quantity === "number" && variant.inventory_quantity > 0)) stock = "in_stock";
    else if (variant.allow_backorder === true) stock = "backorder";
    else if (variant.inventory_quantity === null || typeof variant.inventory_quantity === "number") stock = "out_of_stock";
    const isMad = text(price.currency_code).toLowerCase() === "mad";
    return { maxQuantity: variant.manage_inventory === true && variant.allow_backorder !== true && typeof variant.inventory_quantity === "number" ? Math.max(0, Math.floor(variant.inventory_quantity)) : null, id: text(variant.id), title: text(variant.title), options, sku: text(variant.sku) || null, sizes, colors, stock, price: isMad ? amount(price.calculated_amount_with_tax) ?? amount(price.calculated_amount) : null, originalPrice: isMad ? amount(price.original_amount_with_tax) ?? amount(price.original_amount) : null };
  });
  const rank = amount(record(product.metadata).popularity_rank);
  const images = [...new Set([text(product.thumbnail), ...list(product.images).map(image => text(record(image).url))].filter(Boolean))];
  return { imageFit: record(product.metadata).image_fit === "cover" ? "cover" : "contain", id: text(product.id), handle: text(product.handle), title: text(product.title), description: text(product.description), composition: text(record(product.metadata).composition).trim().slice(0, 10000) || null, thumbnail: images[0] || null, images, sizeGuide: text(record(product.metadata).size_guide).trim().slice(0, 10000) || null, createdAt: Date.parse(text(product.created_at)) || 0, popularity: rank, categoryIds: list(product.categories).map(item => text(record(item).id)).filter(Boolean), collectionId: text(product.collection_id) || text(record(product.collection).id) || null, variants };
}

export function parseFilters(params: SearchParams, defaultSort: Filters["sort"] = "newest"): Filters {
  const first = (name: string) => { const value = params[name]; return typeof value === "string" ? value : Array.isArray(value) ? value[0] || "" : ""; };
  const many = (name: string) => [...new Set((typeof params[name] === "string" ? [params[name]] : Array.isArray(params[name]) ? params[name] : []).map(v => v.trim().slice(0, 100)).filter(Boolean))].slice(0, 20);
  const issues: string[] = [];
  const number = (name: string) => { const value = first(name).trim(); if (!value) return null; if (!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value)) { issues.push("Le prix doit être un montant positif en MAD."); return null; } return Number(value.replace(",", ".")); };
  const min = number("min"); const max = number("max");
  if (min !== null && max !== null && min > max) issues.push("Le prix minimum doit être inférieur au prix maximum.");
  const sort = first("tri");
  const page = /^\d{1,5}$/.test(first("page")) ? Math.max(1, Number(first("page"))) : 1;
  return { q: first("q").trim().slice(0, 100), categories: many("categorie"), sizes: many("taille"), colors: many("couleur"), min, max, available: first("disponible") === "1", sort: Object.hasOwn(sortChoices, sort) ? sort as Filters["sort"] : defaultSort, page, issues: [...new Set(issues)], universe: first("univers") === "collection" ? "collection" : null };
}

export function catalogQuery(filters: Filters, changes: Partial<Filters> = {}) {
  const value = { ...filters, ...changes }; const params = new URLSearchParams();
  if (value.universe) params.set("univers", value.universe);
  if (value.q) params.set("q", value.q);
  for (const [key, values] of [["categorie", value.categories], ["taille", value.sizes], ["couleur", value.colors]] as const) for (const item of values) params.append(key, item);
  if (value.min !== null) params.set("min", String(value.min)); if (value.max !== null) params.set("max", String(value.max));
  if (value.available) params.set("disponible", "1"); if (value.sort !== "newest") params.set("tri", value.sort); if (value.page > 1) params.set("page", String(value.page));
  return params.toString();
}

export function matchingVariants(product: CatalogProduct, filters: Filters): CatalogVariant[] {
  return product.variants.filter(variant => (!filters.sizes.length || variant.sizes.some(value => filters.sizes.some(size => fold(size) === fold(value)))) && (!filters.colors.length || variant.colors.some(value => filters.colors.some(color => fold(color) === fold(value)))) && (filters.min === null || (variant.price !== null && variant.price >= filters.min)) && (filters.max === null || (variant.price !== null && variant.price <= filters.max)) && (!filters.available || variant.stock === "in_stock"));
}

export function descendantIds(categories: CatalogGroup[], id: string): Set<string> {
  const result = new Set([id]);
  for (let size = -1; size !== result.size;) { size = result.size; for (const group of categories) if (group.parentId && result.has(group.parentId)) result.add(group.id); }
  return result;
}
export function groupByHandle(data: CatalogData, handle: string) {
  const category = data.categories.find(group => group.handle === handle);
  if (category) return { group: category, kind: "category" as const };
  const collection = data.collections.find(group => group.handle === handle);
  return collection ? { group: collection, kind: "collection" as const } : null;
}
export function selectCatalog(data: CatalogData, filters: Filters, scope?: { kind: "category" | "collection"; id: string }, pageSize = 12) {
  const scopeIds = scope?.kind === "category" ? descendantIds(data.categories, scope.id) : null;
  const scoped = data.products.filter(product => !scope || (scope.kind === "collection" ? product.collectionId === scope.id : product.categoryIds.some(id => scopeIds?.has(id))));
  const categoryIds = new Set<string>();
  for (const value of filters.categories) { const group = data.categories.find(group => [group.id, group.handle, group.name].some(name => fold(name) === fold(value))); if (group) for (const id of descendantIds(data.categories, group.id)) categoryIds.add(id); }
  const query = fold(filters.q);
  const results = filters.issues.length ? [] : scoped.filter(product => (!query || fold(product.title + " " + product.description).includes(query)) && (!filters.categories.length || product.categoryIds.some(id => categoryIds.has(id)))).map(product => ({ product, variants: matchingVariants(product, filters) })).filter(item => item.variants.length > 0 || (!filters.sizes.length && !filters.colors.length && filters.min === null && filters.max === null && !filters.available && item.product.variants.length === 0)).map(item => {
    const prices = item.variants.filter(variant => variant.price !== null).sort((a, b) => a.price! - b.price!);
    return { ...item, price: prices[0]?.price ?? null, originalPrice: prices[0]?.originalPrice ?? null, priceVaries: prices.some(variant => variant.price !== prices[0]?.price), stock: item.variants.some(v => v.stock === "in_stock") ? "in_stock" : item.variants.some(v => v.stock === "backorder") ? "backorder" : item.variants.some(v => v.stock === "unknown") ? "unknown" : "out_of_stock" };
  });
  results.sort((a, b) => {
    if (filters.sort === "price_asc" || filters.sort === "price_desc") { if (a.price === null && b.price !== null) return 1; if (b.price === null && a.price !== null) return -1; if (a.price !== null && b.price !== null && a.price !== b.price) return filters.sort === "price_asc" ? a.price - b.price : b.price - a.price; }
    if (filters.sort === "popular") { const rankA = a.product.popularity ?? Infinity; const rankB = b.product.popularity ?? Infinity; if (rankA !== rankB) return rankA < rankB ? -1 : 1; }
    return b.product.createdAt - a.product.createdAt || a.product.id.localeCompare(b.product.id);
  });
  const pages = Math.max(1, Math.ceil(results.length / pageSize)); const page = Math.min(filters.page, pages);
  const unique = (values: string[]) => [...new Map(values.map(value => [fold(value), value])).values()].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const variants = scoped.flatMap(product => product.variants);
  const sizeOrder = ["xxxs", "xxs", "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl"];
  const sizes = unique(variants.flatMap(v => v.sizes)).sort((a, b) => { const rank = (value: string) => { const index = sizeOrder.indexOf(fold(value)); return index < 0 ? 100 : index; }; return rank(a) - rank(b) || a.localeCompare(b, "fr", { numeric: true }); });
  return { items: results.slice((page - 1) * pageSize, page * pageSize), total: results.length, page, pages, sizes, colors: unique(variants.flatMap(v => v.colors)), hasPopularity: scoped.some(product => product.popularity !== null) };
}
export type CatalogItem = ReturnType<typeof selectCatalog>["items"][number];
export const formatMad = (value: number) => new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(value);
