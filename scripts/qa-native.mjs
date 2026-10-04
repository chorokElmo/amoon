import assert from "node:assert/strict";

// Public read requests and rejected payloads only. Never submits customer data or an order.
const origin = process.env.QA_STOREFRONT_URL || "http://localhost:8000";
const url = new URL(origin);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !["http:", "https:"].includes(url.protocol)) throw new Error("Native QA requires a loopback storefront.");
let checks = 0;
async function request(path, options = {}) {
  return fetch(new URL(path, origin), { ...options, redirect: "error", signal: AbortSignal.timeout(30000) });
}
async function check(name, run) { await run(); checks++; console.log("PASS " + name); }
await check("public pages and security headers", async () => {
  for (const path of ["/", "/boutique", "/collections", "/nouveautes", "/contact", "/panier", "/commande"]) {
    const r = await request(path); assert.equal(r.status, 200);
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.equal(r.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(r.headers.has("x-powered-by"), false);
    const html = await r.text();
    if (["/panier", "/commande"].includes(path)) assert.match(html, /name="robots" content="noindex/);
  }
});
await check("anonymous and forged carts reveal no customer/cart data", async () => {
  for (const path of ["/api/cart", "/api/checkout"]) {
    for (const cookie of [undefined, "amoon_cart=cart_forged.9999999999.invalid"]) {
      const r = await request(path, cookie ? { headers: { cookie } } : {});
      assert.equal(r.status, 200); assert.match(r.headers.get("cache-control") || "", /private.*no-store/);
      assert.match(r.headers.get("vary") || "", /cookie/i);
      const body = await r.json(); assert.equal(body[path === "/api/cart" ? "cart" : "checkout"], null);
    }
  }
});
await check("cart and checkout reject foreign origins, invalid JSON and oversized bodies", async () => {
  for (const path of ["/api/cart", "/api/checkout"]) {
    const headers = { Origin: url.origin, "Content-Type": "application/json" };
    for (const [options, expected] of [
      [{ headers: { ...headers, Origin: "https://invalid.example" }, body: "{}" }, 403],
      [{ headers: { ...headers, "Content-Type": "text/plain" }, body: "{}" }, 415],
      [{ headers, body: "{" }, 400],
      [{ headers, body: JSON.stringify({ extra: "x".repeat(9000) }) }, 413],
    ]) assert.equal((await request(path, { method: "POST", ...options })).status, expected);
  }
});
await check("sitemap excludes private routes and local robots blocks crawling", async () => {
  const sitemap = await request("/sitemap.xml"); assert.equal(sitemap.status, 200);
  const xml = await sitemap.text(); assert.match(xml, /<urlset/); assert.doesNotMatch(xml, /<loc>[^<]*(?:\/panier|\/commande|\/api\/)/);
  const robots = await request("/robots.txt"); assert.equal(robots.status, 200); assert.match(await robots.text(), /Disallow: \/\s/);
});
console.log(`${checks} native QA groups passed. No cart, customer or order mutation was submitted.`);
