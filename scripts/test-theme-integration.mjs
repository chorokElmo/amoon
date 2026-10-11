import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
const database = process.env.THEME_TEST_DATABASE_URL, origin = process.env.THEME_TEST_BACKEND_URL, email = process.env.THEME_TEST_ADMIN_EMAIL, password = process.env.THEME_TEST_ADMIN_PASSWORD;
if (!database || !origin || !email || !password) throw Error("Set THEME_TEST_DATABASE_URL, THEME_TEST_BACKEND_URL, THEME_TEST_ADMIN_EMAIL and THEME_TEST_ADMIN_PASSWORD for a dedicated local test instance.");
const dbUrl = new URL(database), url = new URL(origin);
if (!/_(?:theme|branding|slider)_test/.test(dbUrl.pathname) || !["localhost", "127.0.0.1"].includes(dbUrl.hostname) || !["localhost", "127.0.0.1"].includes(url.hostname) || ["8000", "9000", "9001"].includes(url.port)) throw Error("Refusing normal store database or remote/main backend. Use an isolated local test database.");
test("theme API: auth, draft isolation, publish contrast, optimistic conflicts, reset and unrelated data preservation", async () => {
  const client = new Client({ connectionString: database }); await client.connect();
  try {
    const unrelated = async () => ({ slider: (await client.query("select id,slides,revision from amoon_slider_config order by id")).rows, branding: (await client.query("select id,assets,revision from amoon_branding_config order by id")).rows });
    const before = await unrelated(); assert.equal((await client.query("select count(*) from amoon_theme_settings")).rows[0].count, "0", "Use a test database without an existing theme.");
    const login = await fetch(new URL("/auth/user/emailpass", origin), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); assert.equal(login.status, 200); const { token } = await login.json();
    const request = async (path, body, auth = true, key) => { const response = await fetch(new URL(path, origin), { method: body === undefined ? "GET" : "POST", headers: { ...(auth ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(key ? { "x-publishable-api-key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: response.status, body: await response.json() }; };
    assert.equal((await request("/admin/theme", undefined, false)).status, 401); assert.equal((await request("/admin/theme", { action: "reset", revision: 0 }, false)).status, 401);
    const initial = await request("/admin/theme"); assert.equal(initial.status, 200); assert.equal(initial.body.draft, null); assert.equal(initial.body.published, null);
    const colors = initial.body.presets[1].colors, defaults = initial.body.defaults;
    const keys = await request("/admin/api-keys", { title: "Theme integration test", type: "publishable" }); assert.equal(keys.status, 200); const key = keys.body.api_key.token;
    const publicTheme = () => request("/store/theme", undefined, false, key);
    assert.deepEqual((await publicTheme()).body, { colors: null, revision: 0 });
    assert.equal((await request("/admin/theme", { action: "draft", revision: 0, colors: { ...colors, text: "var(--evil)" } })).status, 400);
    const low = { ...colors, text: colors.background };
    assert.equal((await request("/admin/theme", { action: "draft", revision: 0, colors: low })).status, 200);
    assert.equal((await publicTheme()).body.colors, null);
    assert.equal((await request("/admin/theme", { action: "publish", revision: 1, colors: low })).status, 400);
    const published = await request("/admin/theme", { action: "publish", revision: 1, colors }); assert.equal(published.status, 200); assert.equal(published.body.published_revision, 1);
    assert.deepEqual((await publicTheme()).body, { colors, revision: 1 });
    assert.equal((await request("/admin/theme", { action: "publish", revision: 1, colors: defaults })).status, 409);
    assert.equal((await request("/admin/theme", { action: "draft", revision: 2, colors: defaults })).status, 200);
    assert.deepEqual((await publicTheme()).body.colors, colors, "Saving another draft must preserve the live theme.");
    const raced = await Promise.all([request("/admin/theme", { action: "draft", revision: 3, colors: defaults }), request("/admin/theme", { action: "publish", revision: 3, colors })]);
    assert.deepEqual(raced.map(result => result.status).sort(), [200, 409]);
    const persisted = (await client.query("select draft,published,revision from amoon_theme_settings where id='store'")).rows[0]; assert.equal(persisted.revision, 4); assert.deepEqual(persisted.published, colors);
    const reset = await request("/admin/theme", { action: "reset", revision: 4 }); assert.equal(reset.status, 200); assert.equal(reset.body.draft, null); assert.equal(reset.body.published, null); assert.equal((await publicTheme()).body.colors, null);
    assert.equal((await request("/admin/theme", { action: "publish", revision: 5, colors })).status, 200);
    assert.deepEqual((await client.query("select published from amoon_theme_settings where id='store'")).rows[0].published, colors);
    assert.deepEqual(await unrelated(), before);
  } finally { await client.end(); }
});
