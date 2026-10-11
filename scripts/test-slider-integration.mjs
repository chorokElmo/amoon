import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { Client } from "pg";

// This suite writes test banners and refuses to run against a normal store database or a remote server.
const database = process.env.SLIDER_TEST_DATABASE_URL;
const origin = process.env.SLIDER_TEST_BACKEND_URL;
const password = process.env.SLIDER_TEST_ADMIN_PASSWORD;
const email = process.env.SLIDER_TEST_ADMIN_EMAIL;
if (!database || !origin || !password || !email) throw new Error("Set SLIDER_TEST_DATABASE_URL, SLIDER_TEST_BACKEND_URL, SLIDER_TEST_ADMIN_EMAIL and SLIDER_TEST_ADMIN_PASSWORD for a dedicated test instance.");
const dbUrl = new URL(database), url = new URL(origin);
if (!dbUrl.pathname.includes("_slider_test") || !["localhost", "127.0.0.1"].includes(dbUrl.hostname) || !["localhost", "127.0.0.1"].includes(url.hostname) || ["8000", "9000", "9001"].includes(url.port)) throw new Error("Use a separate local *_slider_test database and backend port, never the running store.");

test("isolated database: admin auth, validated uploads, ordered saves, disabled slides, conflicts and persistence", async () => {
  const client = new Client({ connectionString: database });
  await client.connect();
  try {
    const [config] = (await client.query("SELECT id FROM amoon_slider_config WHERE id='homepage'")).rows;
    assert.equal(config, undefined, "The test database must have no existing slider config.");
    const signIn = await fetch(new URL("/auth/user/emailpass", origin), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    assert.equal(signIn.status, 200);
    const token = (await signIn.json()).token;
    const request = async (path, body, auth = true, extraHeaders = {}) => {
      const response = await fetch(new URL(path, origin), { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await request("/admin/homepage-slider", undefined, false)).status, 401);
    assert.equal((await request("/admin/homepage-slider", { revision: 0, slides: [] }, false)).status, 401);
    assert.equal((await request("/admin/homepage-slider/images", { mime_type: "image/png", content: "AAAA" }, false)).status, 401);
    const initial = await request("/admin/homepage-slider");
    assert.equal(initial.status, 200); assert.equal(initial.body.configured, false);
    const pixel = await sharp({ create: { width: 160, height: 100, channels: 3, background: "#7A0F32" } }).png().toBuffer();
    const upload = await request("/admin/homepage-slider/images", { mime_type: "image/png", content: pixel.toString("base64") });
    assert.equal(upload.status, 201, JSON.stringify(upload.body));
    const image = upload.body.image;
    assert.equal(image.width, 160);
    assert.equal((await fetch(image.url)).status, 200, "Uploaded image must be served by this test backend.");
    assert.equal((await request("/admin/homepage-slider/images", { mime_type: "image/png", content: Buffer.from("<svg></svg>").toString("base64") })).status, 400);
    const slide = { id: "first", title: "Collection test", description: "Description test", eyebrow: "AMOON", button_label: "Découvrir", button_link: "/boutique", secondary_label: "", secondary_link: "", image_id: image.id, image_url: image.url, image_alt: "Image test", enabled: true, position: "center", zoom: 1 };
    assert.equal((await request("/admin/homepage-slider", { revision: 0, slides: [{ ...slide, image_id: null, image_url: "https://evil.example/image.svg" }] })).status, 400);
    assert.equal((await request("/admin/homepage-slider", { revision: 0, slides: [{ ...slide, button_link: "javascript:alert(1)" }] })).status, 400);
    const ordered = [{ ...slide, id: "second", title: "Second", enabled: false }, slide];
    const saved = await request("/admin/homepage-slider", { revision: 0, slides: ordered });
    assert.equal(saved.status, 200, JSON.stringify(saved.body)); assert.equal(saved.body.revision, 1);
    assert.deepEqual(saved.body.slides.map(slide => slide.id), ["second", "first"]);
    const persisted = (await client.query("SELECT slides, revision FROM amoon_slider_config WHERE id='homepage'")).rows[0];
    assert.equal(persisted.revision, 1); assert.deepEqual(persisted.slides.map(slide => slide.id), ["second", "first"]);
    // A publishable key is created only in this isolated database. No catalog or products are seeded.
    const createKey = await request("/admin/api-keys", { title: "Slider integration test", type: "publishable" });
    assert.equal(createKey.status, 200, JSON.stringify(createKey.body));
    const key = createKey.body.api_key.token;
    const publicSlides = await request("/store/homepage-slider", undefined, false, { "x-publishable-api-key": key });
    assert.equal(publicSlides.status, 200); assert.deepEqual(publicSlides.body.slides.map(slide => slide.id), ["first"]);
    assert.equal(publicSlides.body.slides[0].image_id, undefined);
    assert.equal((await request("/admin/homepage-slider", { revision: 0, slides: [] })).status, 409);
    assert.equal((await request("/admin/homepage-slider", { revision: 1, slides: [slide, { ...slide, id: "second" }] })).status, 200);
    const reordered = await request("/store/homepage-slider", undefined, false, { "x-publishable-api-key": key });
    assert.deepEqual(reordered.body.slides.map(slide => slide.id), ["first", "second"]);
    assert.equal((await request("/admin/homepage-slider", { revision: 2, slides: [] })).status, 200);
    const empty = await request("/store/homepage-slider", undefined, false, { "x-publishable-api-key": key });
    assert.deepEqual(empty.body, { configured: true, slides: [] });
    const replacement = await request("/admin/homepage-slider", { revision: 3, slides: [{ ...slide, title: "Persisted test banner", image_url: "https://untrusted.example/replaced.jpg" }] });
    assert.equal(replacement.body.slides[0].image_url, image.url, "The backend resolves the validated image record rather than trusting a submitted URL.");
    assert.equal((await client.query("SELECT slides->0->>'title' AS title FROM amoon_slider_config WHERE id='homepage'")).rows[0].title, "Persisted test banner");
  } finally { await client.end(); }
});
