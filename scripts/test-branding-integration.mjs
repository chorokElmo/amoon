import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { Client } from "pg";

const database = process.env.BRANDING_TEST_DATABASE_URL, origin = process.env.BRANDING_TEST_BACKEND_URL;
const email = process.env.BRANDING_TEST_ADMIN_EMAIL, password = process.env.BRANDING_TEST_ADMIN_PASSWORD;
if (!database || !origin || !email || !password) throw Error("Set BRANDING_TEST_DATABASE_URL, BRANDING_TEST_BACKEND_URL, BRANDING_TEST_ADMIN_EMAIL and BRANDING_TEST_ADMIN_PASSWORD for an isolated local test instance.");
const db = new URL(database), url = new URL(origin);
if (!/_(?:slider|branding)_test/.test(db.pathname) || !["localhost", "127.0.0.1"].includes(db.hostname) || !["localhost", "127.0.0.1"].includes(url.hostname) || ["8000", "9000", "9001"].includes(url.port)) throw Error("Use an isolated local *_branding_test or *_slider_test database and a separate backend port.");

test("branding API: admin access, uploads, slot validation, persistence, public response, revision conflict and restore; slider unchanged", async () => {
  const client = new Client({ connectionString: database }); await client.connect();
  try {
    const sliderBefore = (await client.query("select id, slides, revision from amoon_slider_config order by id")).rows;
    assert.equal((await client.query("select count(*) from amoon_branding_config")).rows[0].count, "0", "Use a database with no existing branding configuration.");
    const signIn = await fetch(new URL("/auth/user/emailpass", origin), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    assert.equal(signIn.status, 200); const { token } = await signIn.json();
    const request = async (path, body, auth = true, key) => {
      const response = await fetch(new URL(path, origin), { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "x-publishable-api-key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    const defaults = { header_logo: null, footer_logo: null, favicon: null };
    for (const path of ["/admin/branding", "/admin/branding/images"]) assert.equal((await request(path, undefined, false)).status, 401);
    assert.equal((await request("/admin/branding", { revision: 0, assets: defaults }, false)).status, 401);
    assert.equal((await request("/admin/branding/images", { slot: "header_logo", mime_type: "image/png", content: "AAAA" }, false)).status, 401);
    const initial = await request("/admin/branding"); assert.equal(initial.status, 200); assert.deepEqual(initial.body.assets, defaults);
    const ids = {};
    for (const [slot, width, height] of [["header_logo", 180, 80], ["footer_logo", 240, 100], ["favicon", 64, 64]]) {
      const bytes = await sharp({ create: { width, height, channels: 4, background: "#7A0F32" } }).png().toBuffer();
      const result = await request("/admin/branding/images", { slot, mime_type: "image/png", content: bytes.toString("base64") });
      assert.equal(result.status, 201, JSON.stringify(result.body)); ids[slot] = result.body.image.id;
      assert.equal((await fetch(result.body.image.url)).status, 200);
    }
    const svg = '<svg width="160" height="80"><rect width="160" height="80" fill="#fff"/></svg>';
    const vector = await request("/admin/branding/images", { slot: "header_logo", mime_type: "image/svg+xml", content: Buffer.from(svg).toString("base64") });
    assert.equal(vector.status, 201); assert.equal(vector.body.image.mime_type, "image/png");
    const unsafe = '<svg onload="alert(1)"><script>alert(1)</script></svg>';
    assert.equal((await request("/admin/branding/images", { slot: "header_logo", mime_type: "image/svg+xml", content: Buffer.from(unsafe).toString("base64") })).status, 400);
    assert.equal((await request("/admin/branding/images", { slot: "favicon", mime_type: "image/png", content: "AAAA" })).status, 400);
    assert.equal((await request("/admin/branding", { revision: 0, assets: { ...ids, header_logo: ids.favicon } })).status, 400);
    assert.equal((await request("/admin/branding", { revision: 0, assets: { ...ids, header_logo: "https://evil.invalid/logo.png" } })).status, 400);
    const saved = await request("/admin/branding", { revision: 0, assets: ids });
    assert.equal(saved.status, 200); assert.equal(saved.body.revision, 1); assert.deepEqual(saved.body.assets, ids);
    assert.deepEqual((await client.query("select assets from amoon_branding_config where id='store'")).rows[0].assets, ids);
    const keys = await request("/admin/api-keys", { title: "Branding integration test", type: "publishable" }); assert.equal(keys.status, 200); const key = keys.body.api_key.token;
    const publicResult = await request("/store/branding", undefined, false, key); assert.equal(publicResult.status, 200); assert.equal(publicResult.body.images.header_logo.width, 180); assert.equal(publicResult.body.images.header_logo.id, undefined);
    assert.equal((await request("/admin/branding", { revision: 0, assets: defaults })).status, 409);
    const replaced = await request("/admin/branding", { revision: 1, assets: { ...ids, header_logo: vector.body.image.id } }); assert.equal(replaced.status, 200); assert.equal(replaced.body.images.header_logo.width, 160);
    const restored = await request("/admin/branding", { revision: 2, assets: defaults }); assert.equal(restored.status, 200); assert.deepEqual(restored.body.images, defaults);
    assert.deepEqual((await request("/store/branding", undefined, false, key)).body.images, defaults);
    assert.deepEqual((await client.query("select id, slides, revision from amoon_slider_config order by id")).rows, sliderBefore);
  } finally { await client.end(); }
});
