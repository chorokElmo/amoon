import { record, text, list, normalizeProduct } from "./catalog-model";
export type CartItem = { id: string; productId: string; variantId: string; handle: string; title: string; variant: string; quantity: number; unitPrice: number; total: number; thumbnail: string | null };
export type Cart = { id: string; items: CartItem[]; subtotal: number; total: number; tax: number; discount: number };
export class CartError extends Error { constructor(public code: "configuration" | "unavailable" | "invalid" | "product" | "missing", public status = 503) { super(code); } }
export type CartAction = { action: "add"; productId: string; variantId: string; quantity: number } | { action: "update"; itemId: string; quantity: number } | { action: "remove"; itemId: string };
const identifier = (v: unknown) => typeof v === "string" && /^[a-z]+_[a-zA-Z0-9]+$/.test(v) && v.length < 100;
export function parseCartAction(input: unknown): CartAction {
  const v = record(input);
  const quantity = Number.isInteger(v.quantity) && Number(v.quantity) >= 1 && Number(v.quantity) <= 99;
  if (v.action === "add" && identifier(v.productId) && identifier(v.variantId) && quantity) return { action: "add", productId: String(v.productId), variantId: String(v.variantId), quantity: Number(v.quantity) };
  if (v.action === "update" && identifier(v.itemId) && quantity) return { action: "update", itemId: String(v.itemId), quantity: Number(v.quantity) };
  if (v.action === "remove" && identifier(v.itemId)) return { action: "remove", itemId: String(v.itemId) };
  throw new CartError("invalid", 400);
}
const amount = (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw new CartError("unavailable"); return v; };
export type CartConfig = { url: string; publishableKey: string; regionId: string; salesChannelId: string };
export function normalizeCart(input: unknown, config: CartConfig): Cart {
  const c = record(input);
  if (!identifier(c.id) || c.region_id !== config.regionId || c.sales_channel_id !== config.salesChannelId || c.currency_code !== "mad") throw new CartError("configuration");
  if (c.completed_at) throw new CartError("missing", 404);
  if (!Array.isArray(c.items)) throw new CartError("unavailable");
  return { id: text(c.id), subtotal: amount(c.item_subtotal), total: amount(c.total), tax: amount(c.tax_total), discount: amount(c.discount_total), items: list(c.items).map(value => {
    const i = record(value);
    if (!identifier(i.id) || !Number.isInteger(i.quantity) || Number(i.quantity) < 1 || !identifier(i.product_id) || !identifier(i.variant_id)) throw new CartError("unavailable");
    return { id: text(i.id), productId: text(i.product_id), variantId: text(i.variant_id), handle: text(i.product_handle), title: text(i.product_title) || text(i.title), variant: text(i.variant_title), quantity: Number(i.quantity), unitPrice: amount(i.unit_price), total: amount(i.total), thumbnail: text(i.thumbnail) || null };
  }) };
}
export function medusaCart(config: CartConfig, transport: typeof fetch = fetch) {
  let origin: URL;
  try { origin = new URL(config.url); } catch { throw new CartError("configuration"); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || !config.publishableKey.startsWith("pk_") || !identifier(config.regionId) || !identifier(config.salesChannelId)) throw new CartError("configuration");
  async function request(path: string, method = "GET", body?: unknown) {
    try {
      const url = new URL(path, origin);
      if (url.pathname.startsWith("/store/carts")) url.searchParams.set("fields", "+items.total");
      const response = await transport(url, { method, headers: { "x-publishable-api-key": config.publishableKey, Accept: "application/json", "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new CartError(response.status === 404 ? "missing" : response.status < 500 ? "product" : "unavailable", response.status === 404 ? 404 : response.status < 500 ? 409 : 503);
      return record(await response.json());
    } catch (error) { if (error instanceof CartError) throw error; throw new CartError("unavailable"); }
  }
  async function eligible(productId: string, variantId: string) {
    const params = new URLSearchParams({ id: productId, sales_channel_id: config.salesChannelId, region_id: config.regionId, country_code: "ma", fields: "*variants.calculated_price,+variants.inventory_quantity", limit: "1" });
    const products = list((await request("/store/products?" + params)).products);
    if (products.length !== 1 || record(products[0]).id !== productId) throw new CartError("product", 409);
    const product = normalizeProduct(products[0]);
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant || variant.price === null || !["in_stock", "backorder"].includes(variant.stock)) throw new CartError("product", 409);
  }
  return {
    request,
    async get(id: string) { return normalizeCart((await request("/store/carts/" + encodeURIComponent(id))).cart, config); },
    async create() { return normalizeCart((await request("/store/carts", "POST", { region_id: config.regionId, sales_channel_id: config.salesChannelId, shipping_address: { country_code: "ma" } })).cart, config); },
    eligible,
    async mutate(cart: Cart, action: CartAction) {
      const base = "/store/carts/" + encodeURIComponent(cart.id) + "/line-items";
      if (action.action === "add") {
        if ((cart.items.find(i => i.variantId === action.variantId)?.quantity || 0) + action.quantity > 99) throw new CartError("invalid", 400);
        await eligible(action.productId, action.variantId);
        return normalizeCart((await request(base, "POST", { variant_id: action.variantId, quantity: action.quantity })).cart, config);
      }
      const item = cart.items.find(i => i.id === action.itemId);
      if (!item) throw new CartError("invalid", 400);
      if (action.action === "update") {
        await eligible(item.productId, item.variantId);
        return normalizeCart((await request(base + "/" + encodeURIComponent(item.id), "POST", { quantity: action.quantity })).cart, config);
      }
      return normalizeCart((await request(base + "/" + encodeURIComponent(item.id), "DELETE")).parent, config);
    },
  };
}
