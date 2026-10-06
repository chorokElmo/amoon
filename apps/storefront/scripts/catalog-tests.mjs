import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

// Execute the actual TypeScript modules without adding a test framework.
// Strict typechecking remains a separate required check.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "amoon-catalog-tests-"));
for (const name of ["catalog-model", "medusa-catalog", "catalog-media", "product-model", "cart-cookie", "medusa-cart", "checkout-model", "medusa-checkout", "seo", "analytics"]) {
  const code = readFileSync(join(root, "src/lib", name + ".ts"), "utf8");
  writeFileSync(join(scratch, name + ".js"), ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const require = createRequire(import.meta.url);
const { parseFilters, normalizeProduct, selectCatalog, catalogQuery, groupByHandle } = require(join(scratch, "catalog-model.js"));
const { readMedusaCatalog } = require(join(scratch, "medusa-catalog.js"));
const { mediaTarget } = require(join(scratch, "catalog-media.js"));
const { selectedVariant, relatedProducts, variantLabel } = require(join(scratch, "product-model.js"));
const { signCart, readCartCookie, CART_AGE } = require(join(scratch, "cart-cookie.js"));
const { parseCartAction, normalizeCart, medusaCart } = require(join(scratch, "medusa-cart.js"));
const { parseCustomer, proof, validProof } = require(join(scratch, "checkout-model.js"));
const { medusaCheckout, orderReceipt, reviewData } = require(join(scratch, "medusa-checkout.js"));
const { siteOrigin, productSchema, serializeJsonLd } = require(join(scratch, "seo.js"));
const { setAnalyticsConsent, trackPageView } = require(join(scratch, "analytics.js"));
test("restored localhost media resolves to internal storage without changing product records", () => {
  const backend = "http://medusa:9000";
  assert.equal(mediaTarget("http://localhost:9001/static/real-photo.jpg", backend, "", "http://localhost:9001").href, backend + "/static/real-photo.jpg");
  assert.equal(mediaTarget("http://localhost:9001/static/real-photo.jpg", backend, ""), null);
});
test("legacy media mapping cannot reach admin routes, other origins or credential URLs", () => {
  for (const url of ["http://localhost:9001/admin/users", "http://localhost:9001/static/../admin/users", "http://localhost:9002/static/photo.jpg", "http://user:pass@localhost:9001/static/photo.jpg"]) assert.equal(mediaTarget(url, "http://medusa:9000", "", "http://localhost:9001"), null);
});
test("SEO rejects credential/path origins and escapes script injection", () => {
  assert.equal(siteOrigin("https://shop.example"), "https://shop.example");
  for (const value of ["javascript:alert(1)", "https://user:pass@shop.example", "https://shop.example/private", "invalid"]) assert.throws(() => siteOrigin(value));
  assert.equal(serializeJsonLd({ name: "</script><script>alert(1)</script>" }).includes("<"), false);
});
test("Product schema preserves actual MAD prices and omits unknown availability and invented imagery", () => {
  const product = normalizeProduct(rawProduct("seo", 150));
  product.variants[0].stock = "unknown";
  const schema = productSchema(product, "https://shop.example", []);
  assert.equal(schema.offers[0].price, 150);
  assert.equal(schema.offers[0].priceCurrency, "MAD");
  assert.equal("availability" in schema.offers[0], false);
  assert.equal("image" in schema, false);
  product.variants[0].price = null;
  assert.equal("offers" in productSchema(product, "https://shop.example", []), false);
});
test("Analytics is opt-in and excludes private routes and query strings", () => {
  const events = [];
  const originalWindow = globalThis.window;
  const originalEvent = globalThis.CustomEvent;
  globalThis.window = { dispatchEvent: event => events.push(event) };
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  try {
    assert.equal(trackPageView("/boutique"), false);
    setAnalyticsConsent("granted");
    assert.equal(trackPageView("/boutique"), true);
    for (const path of ["/commande", "/panier", "/commande/confirmation", "/boutique?q=private", "/produits/test"]) assert.equal(trackPageView(path), false);
    setAnalyticsConsent("denied");
    assert.equal(trackPageView("/"), false);
    assert.equal(events.filter(e => e.type === "amoon:analytics").length, 1);
  } finally { globalThis.window = originalWindow; globalThis.CustomEvent = originalEvent; }
});
writeFileSync(join(scratch, "cod-validation.js"), ts.transpileModule(readFileSync(join(root, "../medusa/src/lib/cod-validation.ts"), "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);
const { codIssue } = require(join(scratch, "cod-validation.js"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const option = (option_id, value) => ({ option_id, value });
const variant = (id, size, color, price, quantity = 1, extra = {}) => ({ id, options: [option("size", size), option("color", color)], manage_inventory: true, allow_backorder: false, inventory_quantity: quantity, calculated_price: { currency_code: "mad", calculated_amount: price, original_amount: price }, ...extra });
function rawProduct(id, price = 399, extra = {}) {
  return { id, handle: id, title: "Robe Élégante " + id, description: "Une silhouette fluide", created_at: "2026-01-01", options: [{ id: "size", title: "Taille" }, { id: "color", title: "Couleur" }], categories: [{ id: "robes" }], variants: [variant(id + "-v", "M", "Noir", price)], ...extra };
}
const group = (id, extra = {}) => ({ id, handle: id, name: id === "robes" ? "Robes" : id, description: "", parentId: null, ...extra });
const data = (products, categories = [group("robes")], collections = []) => ({ products: products.map(normalizeProduct), categories, collections });
const select = (products, filters = {}, scope) => selectCatalog(data(products), parseFilters(filters), scope);

test("product galleries retain actual image order and remove duplicate or empty images", () => {
  const product = normalizeProduct(rawProduct("photos", 399, { thumbnail: "https://media.example/front.jpg", images: [{ url: "https://media.example/front.jpg" }, { url: "https://media.example/back.jpg" }, { url: "" }] }));
  assert.deepEqual(product.images, ["https://media.example/front.jpg", "https://media.example/back.jpg"]);
  assert.deepEqual(normalizeProduct(rawProduct("missing")).images, []);
});
test("variant selection accepts only IDs belonging to the current product", () => {
  const product = normalizeProduct(rawProduct("choices", 399, { variants: [variant("s-noir", "S", "Noir", 399, 1), variant("m-beige", "M", "Beige", 499, 0)] }));
  assert.equal(selectedVariant(product), null);
  assert.equal(selectedVariant(product, "another-product-variant"), null);
  const selected = selectedVariant(product, "m-beige");
  assert.equal(selected.price, 499);
  assert.equal(selected.stock, "out_of_stock");
  assert.deepEqual(selected.sizes, ["M"]);
});
test("a unique variant is selected without fabricating a missing MAD price", () => {
  const product = normalizeProduct(rawProduct("single", 399, { variants: [variant("single-v", "M", "Noir", 399, 1, { calculated_price: null })] }));
  assert.equal(selectedVariant(product).id, "single-v");
  assert.equal(selectedVariant(product).price, null);
  assert.equal(selectedVariant(product, "wrong"), null);
});
test("variant descriptions retain arbitrary Medusa options and actual SKU", () => {
  const product = normalizeProduct(rawProduct("option", 399, { options: [{ id: "fabric", title: "Matière" }], variants: [variant("fabric-v", "", "", 399, 1, { sku: "AM-001", options: [option("fabric", "Lin")] })] }));
  assert.equal(variantLabel(product.variants[0]), "Matière : Lin");
  assert.equal(product.variants[0].sku, "AM-001");
});
test("related products exclude the current product and unrelated merchandise", () => {
  const catalog = data([rawProduct("current", 399, { collection_id: "capsule" }), rawProduct("category"), rawProduct("collection", 499, { collection_id: "capsule", categories: [] }), rawProduct("unrelated", 199, { categories: [] })]);
  assert.deepEqual(relatedProducts(catalog, catalog.products[0]).map(item => item.product.id).sort(), ["category", "collection"]);
});
test("size guides display only bounded owner-provided text", () => {
  assert.equal(normalizeProduct(rawProduct("guide")).sizeGuide, null);
  assert.equal(normalizeProduct(rawProduct("guide", 399, { metadata: { size_guide: "Tour de poitrine : 92 cm" } })).sizeGuide, "Tour de poitrine : 92 cm");
  assert.equal(normalizeProduct(rawProduct("guide", 399, { metadata: { size_guide: "x".repeat(12000) } })).sizeGuide.length, 10000);
});

test("all active variant filters must match the same size/color combination", () => {
  const product = rawProduct("cross", 399, { variants: [variant("a", "S", "Noir", 399), variant("b", "M", "Beige", 499)] });
  assert.equal(select([product], { taille: "M", couleur: "Noir" }).total, 0);
  assert.equal(select([product], { taille: "M", couleur: "Beige" }).items[0].price, 499);
});
test("price and stock must belong to the matching variant", () => {
  const product = rawProduct("stock", 199, { variants: [variant("a", "S", "Noir", 199, 1), variant("b", "M", "Beige", 499, 0)] });
  assert.equal(select([product], { taille: "M", disponible: "1" }).total, 0);
  assert.equal(select([product], { taille: "M", max: "200" }).total, 0);
  assert.equal(select([product], { taille: "M" }).items[0].stock, "out_of_stock");
});
test("multi-select uses OR within a facet, AND between facets", () => {
  const product = rawProduct("or", 399, { variants: [variant("a", "S", "Noir", 399), variant("b", "M", "Beige", 499)] });
  assert.equal(select([product], { taille: ["S", "M"], couleur: "Beige" }).total, 1);
  assert.equal(select([product], { taille: ["S", "L"], couleur: "Beige" }).total, 0);
});
test("search is French accent and case insensitive and safely treats punctuation", () => {
  assert.equal(select([rawProduct("a")], { q: "eLEGANTE" }).total, 1);
  assert.equal(select([rawProduct("a")], { q: "<script>" }).total, 0);
});
test("MAD amounts retain major units, use taxes, and preserve sale originals", () => {
  const product = rawProduct("tax", 399, { variants: [variant("v", "M", "Noir", 399, 1, { calculated_price: { currency_code: "mad", calculated_amount: 399, calculated_amount_with_tax: 419, original_amount: 499, original_amount_with_tax: 519 } })] });
  const item = select([product]).items[0]; assert.equal(item.price, 419); assert.equal(item.originalPrice, 519);
});
test("missing or foreign-currency prices never become zero or pass a price filter", () => {
  for (const calculated_price of [null, { currency_code: "eur", calculated_amount: 50 }, { currency_code: "mad", calculated_amount: -1 }]) {
    const product = rawProduct("no-price", 399, { variants: [variant("v", "M", "Noir", 399, 1, { calculated_price })] });
    assert.equal(select([product]).items[0].price, null); assert.equal(select([product], { min: "0" }).total, 0);
  }
});
test("unmanaged, backorder, missing inventory and sold-out states are distinct", () => {
  const cases = [[{ manage_inventory: false }, "in_stock"], [{ inventory_quantity: 0, allow_backorder: true }, "backorder"], [{ inventory_quantity: null }, "out_of_stock"], [{ inventory_quantity: undefined }, "unknown"], [{ inventory_quantity: 0 }, "out_of_stock"]];
  for (const [extra, expected] of cases) { const product = rawProduct("state", 399, { variants: [variant("v", "M", "Noir", 399, 0, extra)] }); assert.equal(select([product]).items[0].stock, expected); assert.equal(select([product], { disponible: "1" }).total, expected === "in_stock" ? 1 : 0); }
});
test("global price sorting precedes pagination and unpriced items sort last", () => {
  const products = Array.from({ length: 27 }, (_, i) => rawProduct("p" + i, 100 + i));
  assert.deepEqual(select(products, { tri: "price_desc", page: "2" }).items.map(item => item.price), Array.from({ length: 12 }, (_, i) => 114 - i));
  assert.equal(select(products, { page: "999" }).page, 3);
  const unpriced = rawProduct("empty", 100, { variants: [] });
  assert.equal(select([unpriced, rawProduct("a")], { tri: "price_desc" }).items.at(-1).price, null);
});
test("popularity uses only explicit owner ranks, with stable newest fallback", () => {
  const products = [rawProduct("a", 399, { metadata: { popularity_rank: 3 } }), rawProduct("b", 399, { metadata: { popularity_rank: 1 } }), rawProduct("c", 399, { created_at: "2026-02-01" })];
  assert.deepEqual(select(products, { tri: "popular" }).items.map(item => item.product.id), ["b", "a", "c"]);
  assert.equal(select([rawProduct("a")], { tri: "popular" }).hasPopularity, false);
});
test("category names/handles resolve and parent categories include descendants", () => {
  const catalog = data([rawProduct("child", 399, { categories: [{ id: "maxi" }] }), rawProduct("other", 399, { categories: [{ id: "vestes" }] })], [group("robes"), group("maxi", { parentId: "robes" }), group("vestes")]);
  assert.equal(selectCatalog(catalog, parseFilters({ categorie: "Robes" })).total, 1);
  assert.equal(selectCatalog(catalog, parseFilters({ categorie: "unknown" })).total, 0);
  assert.equal(selectCatalog(catalog, parseFilters({}), { kind: "category", id: "robes" }).total, 1);
});
test("collection scope cannot leak products from other collections", () => {
  const catalog = data([rawProduct("a", 399, { collection_id: "essential" }), rawProduct("b", 399, { collection_id: "other" })], [group("robes")], [group("essential")]);
  assert.equal(selectCatalog(catalog, parseFilters({}), { kind: "collection", id: "essential" }).total, 1);
  assert.equal(groupByHandle(catalog, "missing"), null);
});
test("invalid/reversed prices show validation rather than silently broadening results", () => {
  for (const params of [{ min: "500", max: "100" }, { min: "-5" }, { max: "NaN" }, { min: "1e3" }]) { assert.ok(parseFilters(params).issues.length); assert.equal(select([rawProduct("a")], params).total, 0); }
  assert.equal(parseFilters({ min: "399,50" }).min, 399.5);
});
test("query roundtrips preserve repeated facets and collection disambiguation", () => {
  const filters = parseFilters({ q: "Élégante", taille: ["S", "M"], couleur: "Écru", disponible: "1", tri: "price_desc", page: "2", univers: "collection" });
  const query = new URLSearchParams(catalogQuery(filters));
  assert.deepEqual(query.getAll("taille"), ["S", "M"]); assert.equal(query.get("univers"), "collection"); assert.equal(query.get("page"), "2");
  assert.equal(parseFilters({ tri: "constructor", page: "-1" }).sort, "newest");
});
test("input length, repeated facets and query pages are bounded", () => {
  const filters = parseFilters({ q: "x".repeat(500), taille: Array.from({ length: 50 }, (_, i) => "size" + i), page: "999999999999" });
  assert.equal(filters.q.length, 100); assert.equal(filters.sizes.length, 20); assert.equal(filters.page, 1);
});
test("media proxy allows only configured static storage and explicit HTTPS origins", () => {
  const backend = "http://medusa:9000";
  assert.equal(mediaTarget("/static/photo.png", backend, "").href, backend + "/static/photo.png");
  for (const url of ["http://169.254.169.254/latest/meta-data", "http://medusa:9000/admin/users", "http://medusa:9000/static/../admin", "https://evil.example/photo.png", "data:image/png;base64,abc", "https://user:pass@cdn.example/p.png"]) assert.equal(mediaTarget(url, backend, "https://cdn.example"), null);
  assert.equal(mediaTarget("https://cdn.example/photo.png", backend, "https://cdn.example").hostname, "cdn.example");
});

function transportFixture({ products = [rawProduct("p")], regions, fail = false, malformed = false } = {}) {
  const calls = [];
  const transport = async (url, init) => {
    calls.push({ url: new URL(url), init });
    if (fail) return new Response("{}", { status: 401 });
    const request = new URL(url); const offset = Number(request.searchParams.get("offset") || 0);
    const lists = { "/store/regions": ["regions", regions || [{ id: "reg_ma", currency_code: "mad", countries: [{ iso_2: "ma" }] }]], "/store/products": ["products", products], "/store/product-categories": ["product_categories", [{ id: "robes", name: "Robes", handle: "robes" }]], "/store/collections": ["collections", []] };
    const [key, values] = lists[request.pathname];
    return Response.json(malformed && key === "products" ? {} : { [key]: values.slice(offset, offset + 100), count: values.length });
  };
  return { transport, calls };
}
const config = { url: "http://localhost:9000", publishableKey: "pk_test_contract" };
test("adapter fetches all pages before filtering and sends actual Medusa context", async () => {
  const fixture = transportFixture({ products: Array.from({ length: 125 }, (_, i) => rawProduct("p" + i, i + 100)) });
  const catalog = await readMedusaCatalog(config, fixture.transport);
  assert.equal(catalog.products.length, 125);
  const requests = fixture.calls.filter(call => call.url.pathname === "/store/products");
  assert.deepEqual(requests.map(call => call.url.searchParams.get("offset")), ["0", "100"]);
  assert.equal(requests[0].url.searchParams.get("region_id"), "reg_ma"); assert.equal(requests[0].url.searchParams.get("country_code"), "ma");
  assert.match(requests[0].url.searchParams.get("fields"), /inventory_quantity/); assert.equal(requests[0].init.headers["x-publishable-api-key"], config.publishableKey); assert.equal(requests[0].init.redirect, "error");
  assert.equal(selectCatalog(catalog, parseFilters({ min: "220" })).total, 5);
});
test("exact-page-size catalogs load the trailing page without losing products", async () => {
  const fixture = transportFixture({ products: Array.from({ length: 100 }, (_, i) => rawProduct("p" + i)) });
  assert.equal((await readMedusaCatalog(config, fixture.transport)).products.length, 100);
  assert.equal(fixture.calls.filter(call => call.url.pathname === "/store/products").length, 2);
});
test("missing credentials fail closed before any network request", async () => {
  const fixture = transportFixture(); await assert.rejects(readMedusaCatalog({ ...config, publishableKey: "" }, fixture.transport), error => error.code === "configuration"); assert.equal(fixture.calls.length, 0);
});
test("a MAD region must include Morocco, and ambiguous regions require an ID", async () => {
  for (const regions of [[{ id: "reg_eu", currency_code: "eur", countries: [{ iso_2: "ma" }] }], [{ id: "reg_other", currency_code: "mad", countries: [{ iso_2: "fr" }] }], [{ id: "one", currency_code: "mad", countries: [{ iso_2: "ma" }] }, { id: "two", currency_code: "mad", countries: [{ iso_2: "ma" }] }]]) {
    const fixture = transportFixture({ regions }); await assert.rejects(readMedusaCatalog(config, fixture.transport), error => error.code === "region");
  }
  const fixture = transportFixture({ regions: [{ id: "one", currency_code: "mad", countries: [{ iso_2: "ma" }] }, { id: "two", currency_code: "mad", countries: [{ iso_2: "ma" }] }] });
  await readMedusaCatalog({ ...config, regionId: "two" }, fixture.transport);
  assert.equal(fixture.calls.find(call => call.url.pathname === "/store/products").url.searchParams.get("region_id"), "two");
});
test("upstream failures and malformed responses remain errors, not empty catalogs", async () => {
  for (const options of [{ fail: true }, { malformed: true }]) await assert.rejects(readMedusaCatalog(config, transportFixture(options).transport), error => error.code === "upstream");
  await assert.rejects(readMedusaCatalog(config, async () => { throw new Error("network"); }), error => error.code === "upstream");
});
test("capacity bounds fail explicitly instead of showing a truncated catalog", async () => {
  const fixture = transportFixture({ products: Array.from({ length: 1001 }, (_, i) => rawProduct("p" + i)) });
  await assert.rejects(readMedusaCatalog(config, fixture.transport), error => error.code === "capacity");
});
test("a connected store with no products is a genuine empty catalog", async () => {
  assert.equal((await readMedusaCatalog(config, transportFixture({ products: [] }).transport)).products.length, 0);
});

const cartConfig = { url: "http://backend.local", publishableKey: "pk_test", regionId: "reg_ma", salesChannelId: "sc_store" };
const rawCart = (items = [], extra = {}) => ({ id: "cart_real", currency_code: "mad", region_id: "reg_ma", sales_channel_id: "sc_store", completed_at: null, item_subtotal: 150 * items.reduce((n,i) => n+i.quantity,0), total: 150 * items.reduce((n,i) => n+i.quantity,0), tax_total: 0, discount_total: 0, items, ...extra });
const rawLine = (quantity = 1) => ({ id: "cali_item", product_id: "prod_piece", variant_id: "variant_piece", product_handle: "piece", product_title: "Pièce", variant_title: "M", quantity, unit_price: 150, total: 150 * quantity });
const eligibleProduct = () => rawProduct("prod_piece", 150, { variants: [variant("variant_piece", "M", "Noir", 150, 10)] });

test("cart cookies reject tampering, expiry, another signing key and malformed values", () => {
  const secret = "x".repeat(64); const now = 1000000000000;
  const cookie = signCart("cart_real", secret, now);
  assert.equal(readCartCookie(cookie, secret, now), "cart_real");
  assert.equal(readCartCookie(cookie.replace("cart_real", "cart_foreign"), secret, now), null);
  assert.equal(readCartCookie(cookie, "y".repeat(64), now), null);
  assert.equal(readCartCookie(cookie, secret, now + CART_AGE * 1000), null);
  for (const value of [undefined, "cart_real", "cart_real.1.x", "x".repeat(300)]) assert.equal(readCartCookie(value, secret, now), null);
  assert.throws(() => signCart("cart_real", "short"));
});
test("cart payload validation rejects fractional, excessive, zero and string quantities", () => {
  for (const quantity of [0,-1,100,1.5,"2",null]) assert.throws(() => parseCartAction({action:"add", productId:"prod_piece", variantId:"variant_piece", quantity}));
  assert.throws(() => parseCartAction({action:"update",itemId:"foreign/path",quantity:1}));
  assert.throws(() => parseCartAction({action:"complete"}));
  assert.deepEqual(parseCartAction({action:"add",productId:"prod_piece",variantId:"variant_piece",quantity:2,unitPrice:1,cartId:"cart_other"}), {action:"add",productId:"prod_piece",variantId:"variant_piece",quantity:2});
});
test("cart normalization preserves major-unit totals and strips private customer fields", () => {
  const cart = normalizeCart(rawCart([rawLine(2)], {email:"private@example.com",shipping_address:{address_1:"Private"}}), cartConfig);
  assert.equal(cart.total,300); assert.equal(cart.items[0].unitPrice,150);
  assert.equal("email" in cart,false); assert.equal("shipping_address" in cart,false);
  for (const extra of [{currency_code:"eur"},{region_id:"reg_other"},{sales_channel_id:"sc_other"},{total:null},{total:-1},{items:null},{completed_at:"2026-01-01"}]) assert.throws(() => normalizeCart(rawCart([],extra),cartConfig));
});
test("cart adapter uses fresh product prices and the backend mutation totals", async () => {
  const calls=[];
  const service=medusaCart(cartConfig, async (url, init) => {
    calls.push({url:String(url),init});
    assert.equal(init.cache,"no-store"); assert.equal(init.redirect,"error");
    if(String(url).includes("/products")) return Response.json({products:[eligibleProduct()]});
    return Response.json({cart:rawCart([rawLine(2)], {total:287,discount_total:13})});
  });
  const cart=await service.mutate(normalizeCart(rawCart(),cartConfig),{action:"add",productId:"prod_piece",variantId:"variant_piece",quantity:2});
  assert.equal(cart.total,287); assert.equal(cart.discount,13);
  assert.equal(calls.length,2);
  assert.deepEqual(JSON.parse(calls[1].init.body),{variant_id:"variant_piece",quantity:2});
  assert.ok(calls[0].url.includes("region_id=reg_ma")); assert.ok(calls[0].url.includes("sales_channel_id=sc_store")); assert.equal(new URL(calls[1].url).searchParams.get("fields"), "+items.total");
});
test("unpriced, unavailable or foreign variants never trigger a cart mutation", async () => {
  for(const product of [rawProduct("prod_piece",150,{variants:[variant("variant_piece","M","Noir",null,10)]}),rawProduct("prod_piece",150,{variants:[variant("variant_piece","M","Noir",150,0)]}),rawProduct("prod_piece",150,{variants:[variant("variant_other","M","Noir",150,10)]})]) {
    const calls=[]; const service=medusaCart(cartConfig,async (url) => {calls.push(String(url));return Response.json({products:[product]});});
    await assert.rejects(service.mutate(normalizeCart(rawCart(),cartConfig),{action:"add",productId:"prod_piece",variantId:"variant_piece",quantity:1}));
    assert.equal(calls.length,1);
  }
});
test("removal uses Medusa parent cart and permits items that became unpublished", async () => {
  const calls=[]; const service=medusaCart(cartConfig,async (url,init) => {calls.push({url:String(url),method:init.method});return Response.json({deleted:true,parent:rawCart()});});
  const empty=await service.mutate(normalizeCart(rawCart([rawLine()]),cartConfig),{action:"remove",itemId:"cali_item"});
  assert.deepEqual(empty.items,[]); assert.equal(calls.length,1); assert.equal(calls[0].method,"DELETE");
  await assert.rejects(service.mutate(normalizeCart(rawCart([rawLine()]),cartConfig),{action:"remove",itemId:"cali_other"}));
  assert.equal(calls.length,1);
});
test("quantity update is absolute and adding cannot exceed 99", async () => {
  const calls=[]; const service=medusaCart(cartConfig,async (url,init) => {calls.push({url:String(url),init});return Response.json(String(url).includes("/products")?{products:[eligibleProduct()]}:{cart:rawCart([rawLine(3)])});});
  await service.mutate(normalizeCart(rawCart([rawLine(2)]),cartConfig),{action:"update",itemId:"cali_item",quantity:3});
  assert.deepEqual(JSON.parse(calls[1].init.body),{quantity:3});
  await assert.rejects(service.mutate(normalizeCart(rawCart([rawLine(99)]),cartConfig),{action:"add",productId:"prod_piece",variantId:"variant_piece",quantity:1}));
  assert.equal(calls.length,2);
});
test("cart creation uses the configured region and channel; missing cart and server outage remain distinct", async () => {
  let payload;
  const service=medusaCart(cartConfig,async (url,init) => {payload=JSON.parse(init.body);return Response.json({cart:rawCart()});});
  await service.create(); assert.deepEqual(payload,{region_id:"reg_ma",sales_channel_id:"sc_store",shipping_address:{country_code:"ma"}});
  for(const [status,code] of [[404,"missing"],[500,"unavailable"]]) await assert.rejects(medusaCart(cartConfig,async()=>new Response("",{status})).get("cart_real"), e=>e.code===code);
});

// Checkout fixtures exist only in this test process, never in the running catalog/database.
const checkoutCustomer = () => ({email:"qa@example.test",address:{first_name:"Prénom",last_name:"Nom",address_1:"Adresse de test isolée",address_2:"",city:"Ville",postal_code:"",phone:"06 70 00 00 00",country_code:"ma"}});
const checkoutSecret = "s".repeat(64);
function checkoutHarness(extra = {}) {
  let current = rawCart([rawLine()],{shipping_total:0,shipping_methods:[],...extra.cart});
  const calls=[]; let completions=0;
  const receipt={id:"order_created",display_id:42,total:150,currency_code:"mad"};
  const transport=async(url,init) => {
    const u=new URL(url); const path=u.pathname; calls.push({path,method:init.method,body:init.body?JSON.parse(init.body):null});
    assert.equal(init.cache,"no-store");
    if(path==="/store/payment-providers")return Response.json({payment_providers:extra.noCod?[]:[{id:"pp_system_default",is_enabled:true}]});
    if(path==="/store/shipping-options")return Response.json({shipping_options:[{id:"so_free",name:"Livraison gratuite",amount:0,price_type:"flat"}]});
    if(path==="/store/products")return Response.json({products:[eligibleProduct()]});
    if(path==="/store/payment-collections")return Response.json({payment_collection:{id:"paycol_real",amount:extra.paymentAmount??current.total,payment_sessions:[{id:"payses_manual",provider_id:"pp_system_default",status:"pending",amount:current.total,currency_code:"mad"}]}});
    if(path.endsWith("/payment-sessions"))return Response.json({payment_collection:{id:"paycol_real"}});
    if(path.endsWith("/complete")){completions++;if(extra.paymentFailure)return Response.json({type:"cart",error:{type:"payment_authorization_error"}});current={...current,completed_at:"2026-10-04"};return Response.json({type:"order",order:receipt});}
    if(path.endsWith("/shipping-methods")){current={...current,shipping_methods:[{shipping_option_id:JSON.parse(init.body).option_id}]};return Response.json({cart:current});}
    if(path.startsWith("/store/orders/"))return Response.json({order:receipt});
    if(path==="/store/carts/cart_real") {if(init.method==="POST"){const b=JSON.parse(init.body);current={...current,...b};}return Response.json({cart:current});}
    throw Error("Unexpected test request "+path);
  };
  return {service:medusaCheckout(cartConfig,checkoutSecret,transport),calls,change(update){current={...current,...update};},get completions(){return completions;}};
}
test("Moroccan checkout validates required fields and normalizes actual phone formats",()=>{
  const c=parseCustomer(checkoutCustomer());assert.equal(c.address.phone,"+212670000000");
  for(const phone of ["+212670000000","00212670000000","0670000000"])assert.equal(parseCustomer({...checkoutCustomer(),address:{...checkoutCustomer().address,phone}}).address.phone,"+212670000000");
  for(const change of [{country_code:"fr"},{phone:"+33612345678"},{phone:"123"},{city:""},{address_1:"x"},{postal_code:"1234"}])assert.throws(()=>parseCustomer({...checkoutCustomer(),address:{...checkoutCustomer().address,...change}}));
  assert.throws(()=>parseCustomer({...checkoutCustomer(),email:"invalid"}));
});
test("checkout proof rejects altered totals, quantities, addresses, key and expiry",()=>{
  const state={total:150,quantity:1,address:"Actual address"};const expires=Math.floor(Date.now()/1000)+600;const token=proof(state,checkoutSecret,expires);
  assert.equal(validProof(token,state,checkoutSecret),true);
  for(const change of [{total:1},{quantity:2},{address:"Different address"}])assert.equal(validProof(token,{...state,...change},checkoutSecret),false);
  assert.equal(validProof(token,state,"z".repeat(64)),false);assert.equal(validProof(token,state,checkoutSecret,(expires+1)*1000),false);
  assert.equal(validProof("bad",state,checkoutSecret),false);
});
test("checkout accepts full Moroccan names without email and defaults country to Morocco",()=>{
  const input={full_name:"  Salma   El Amrani  ",address:{phone:"06 70 00 00 00",city:"Casablanca",address_1:"Quartier, rue, résidence",address_2:""}};
  const customer=parseCustomer(input);
  assert.equal(customer.email,null);assert.equal(customer.address.first_name,"Salma");assert.equal(customer.address.last_name,"El Amrani");assert.equal(customer.address.country_code,"ma");assert.equal(customer.address.postal_code,"");
  assert.equal(parseCustomer({...input,full_name:"Salma"}).address.last_name,"");
  for(const full_name of [""," ","S","Salma\nAmrani","x".repeat(162)])assert.throws(()=>parseCustomer({...input,full_name}));
});
test("email-free checkout clears old email, signs review and completes COD without fabricating email",async()=>{
  const h=checkoutHarness({cart:{email:"previous@example.test"}});
  const input={full_name:"Salma El Amrani",address:{phone:"0670000000",city:"Casablanca",address_1:"Quartier, rue, résidence",address_2:""}};
  const addressed=await h.service.address("cart_real",input);
  assert.equal(addressed.customer.email,null);
  const update=h.calls.find(c=>c.method==="POST"&&c.path==="/store/carts/cart_real");assert.equal(update.body.email,null);
  const state=await h.service.shipping("cart_real","so_free");assert.ok(state.review);
  const receipt=await h.service.complete("cart_real",state.review,true);assert.equal(receipt.id,"order_created");assert.equal(h.completions,1);
  assert.equal(codIssue({total:150,email:null,shipping_address:addressed.customer.address,shipping_methods:[{id:"shipping_real"}],payment_collection:{amount:150,payment_sessions:[{provider_id:"pp_system_default",status:"pending",amount:150,currency_code:"mad"}]}}),null);
});
test("checkout saves normalized addresses and selects only real backend delivery choices",async()=>{
  const h=checkoutHarness();const state=await h.service.address("cart_real",checkoutCustomer());
  assert.equal(state.customer.address.phone,"+212670000000");assert.equal(state.review,null);assert.equal(state.options[0].amount,0);
  const before=h.calls.length;await assert.rejects(h.service.shipping("cart_real","so_foreign"));assert.equal(h.calls.slice(before).some(c=>c.method==="POST"),false);
  const reviewed=await h.service.shipping("cart_real","so_free");assert.equal(reviewed.shipping,0);assert.ok(reviewed.review);
});
test("final consent, a complete address, COD and an unchanged signed review are mandatory",async()=>{
  const h=checkoutHarness();await assert.rejects(h.service.complete("cart_real","bad",false));assert.equal(h.completions,0);
  await assert.rejects(h.service.complete("cart_real","bad",true));assert.equal(h.completions,0);
  await h.service.address("cart_real",checkoutCustomer());const state=await h.service.shipping("cart_real","so_free");
  h.change({total:300,item_subtotal:300,items:[rawLine(2)]});await assert.rejects(h.service.complete("cart_real",state.review,true));assert.equal(h.completions,0);
  const noCod=checkoutHarness({noCod:true});await noCod.service.address("cart_real",checkoutCustomer());assert.equal((await noCod.service.shipping("cart_real","so_free")).review,null);
});
test("COD adapter completes only after actual payment-collection amount matches the review",async()=>{
  const h=checkoutHarness();await h.service.address("cart_real",checkoutCustomer());const state=await h.service.shipping("cart_real","so_free");
  const receipt=await h.service.complete("cart_real",state.review,true);assert.equal(receipt.total,150);assert.equal(receipt.number,"42");assert.equal(h.completions,1);
  assert.equal(h.calls.some(c=>c.path.includes("capture")),false);
  const mismatch=checkoutHarness({paymentAmount:1});await mismatch.service.address("cart_real",checkoutCustomer());const quote=await mismatch.service.shipping("cart_real","so_free");await assert.rejects(mismatch.service.complete("cart_real",quote.review,true));assert.equal(mismatch.completions,0);
});
test("a completed cart retries only Medusa's idempotent completion and never prepares a new payment",async()=>{
  const h=checkoutHarness({cart:{completed_at:"2026-10-04"}});const result=await h.service.complete("cart_real",null,true);
  assert.equal(result.id,"order_created");assert.equal(h.completions,1);assert.deepEqual(h.calls.map(c=>c.path),["/store/carts/cart_real","/store/carts/cart_real/complete"]);
});
test("HTTP 200 payment failure never becomes an order confirmation",async()=>{
  const h=checkoutHarness({paymentFailure:true});await h.service.address("cart_real",checkoutCustomer());const state=await h.service.shipping("cart_real","so_free");await assert.rejects(h.service.complete("cart_real",state.review,true));
});
test("confirmation exposes a validated order reference and actual MAD total only",()=>{
  const receipt=orderReceipt({id:"order_real",display_id:25,total:150,currency_code:"mad",email:"private@example.test",shipping_address:{address_1:"Private"}});
  assert.deepEqual(receipt,{id:"order_real",number:"25",total:150,currency:"mad"});
  for(const extra of [{currency_code:"eur"},{total:null},{id:"cart_real"}])assert.throws(()=>orderReceipt({id:"order_real",total:150,currency_code:"mad",...extra}));
});
test("backend COD validation compares payment amounts inside the completion snapshot",()=>{
  const customer=parseCustomer(checkoutCustomer());const c={total:150,email:customer.email,shipping_address:customer.address,shipping_methods:[{id:"casm_actual"}],payment_collection:{amount:150,payment_sessions:[{provider_id:"pp_system_default",status:"pending",amount:150,currency_code:"mad"}]}};
  assert.equal(codIssue(c),null); const { BigNumber } = require("@medusajs/utils"); assert.equal(codIssue({...c,total:new BigNumber(150),payment_collection:{amount:new BigNumber(150),payment_sessions:[{provider_id:"pp_system_default",status:"pending",amount:new BigNumber(150),currency_code:"mad"}]}}),null);assert.ok(codIssue({...c,total:300}));assert.ok(codIssue({...c,shipping_methods:[]}));assert.ok(codIssue({...c,shipping_address:{...customer.address,country_code:"fr"}}));assert.ok(codIssue({...c,payment_collection:{amount:150,payment_sessions:[{provider_id:"pp_system_default",status:"pending",amount:1,currency_code:"mad"}]}}));
});
test("product quantity limits use managed stock and preserve backorders", () => {
  const managed = normalizeProduct(rawProduct("limits", 150, {variants:[variant("limited", "M", "Noir", 150, 3)]}));
  assert.equal(managed.variants[0].maxQuantity, 3);
  const backorder = normalizeProduct(rawProduct("backorder", 150, {variants:[variant("back", "M", "Noir", 150, 0, {allow_backorder:true})]}));
  assert.equal(backorder.variants[0].maxQuantity, null);
  const unlimited = normalizeProduct(rawProduct("unlimited", 150, {variants:[variant("unlimited", "M", "Noir", 150, 0, {manage_inventory:false})]}));
  assert.equal(unlimited.variants[0].maxQuantity, null);
});
