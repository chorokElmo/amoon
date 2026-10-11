import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, ".local"), { recursive: true });
const scratch = mkdtempSync(join(root, ".local/homepage-tests-"));
const entries = [["homepage-content", "apps/medusa/src/lib/homepage-content.ts"], ["homepage-content-validation", "apps/medusa/src/lib/homepage-content-validation.ts"], ["theme-palette", "apps/medusa/src/lib/theme-palette.ts"], ["store-content", "apps/storefront/src/lib/homepage-content.ts"]];
for (const [name, file] of entries) writeFileSync(join(scratch, name + ".js"), ts.transpileModule(readFileSync(join(root, file), "utf8").replace('"../../../medusa/src/lib/homepage-content"', '"./homepage-content"'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
const require = createRequire(import.meta.url);
const { defaultHomepageContent, safeContentLink, collectionContentHref } = require(join(scratch, "homepage-content.js"));
const { HomepageContentSchema, SaveHomepageContentSchema } = require(join(scratch, "homepage-content-validation.js"));
const { parseHomepageContent, readHomepageContent } = require(join(scratch, "store-content.js"));
after(() => rmSync(scratch, { recursive: true, force: true }));
test("default content is valid, retains original sections and creates independent drafts", () => {
  const c = defaultHomepageContent(); assert(HomepageContentSchema.safeParse(c).success); assert.deepEqual(parseHomepageContent(c), c); assert.equal(c.collections, null); assert.deepEqual(c.banners, []);
  assert.equal(c.sections.find(s => s.key === "season").heading, "Des pièces pensées\npour vous.");
  c.sections[0].enabled = false; assert.equal(defaultHomepageContent().sections[0].enabled, true);
});
test("URLs reject active schemes, credentialed links, protocol-relative paths and control characters", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "//evil.test", "/\\evil.test", "https://name:password@evil.test", "http://evil.test", "/a\nb", " https://amoon.ma"]) assert.equal(safeContentLink(value), false, value);
  for (const value of ["/boutique", "/collections/a?univers=collection", "https://amoon.ma/offre"]) assert(safeContentLink(value));
  assert.equal(collectionContentHref("robe été"), "/collections/robe%20%C3%A9t%C3%A9?univers=collection");
});
test("mandatory commitments cannot be disabled and section keys cannot be lost or duplicated", () => {
  for (const transform of [c => c.sections.pop(), c => c.sections.push(c.sections[0]), c => c.sections[1].key = c.sections[0].key, c => c.sections.find(s => s.key === "trust").enabled = false]) {
    const c = defaultHomepageContent(); transform(c); assert.equal(HomepageContentSchema.safeParse(c).success, false); assert.equal(parseHomepageContent(c), null);
  }
  const c = defaultHomepageContent(); c.sections.reverse(); assert(HomepageContentSchema.safeParse(c).success);
});
test("announcement validates HEX pairs, minimum contrast and safe links", () => {
  for (const patch of [{ background: "red", color: "white" }, { background: "#000000" }, { background: "#FFFFFF", color: "#FFFFFF" }, { url: "javascript:x" }]) assert.equal(HomepageContentSchema.safeParse({ ...defaultHomepageContent(), announcement: { ...defaultHomepageContent().announcement, ...patch } }).success, false);
  const c = defaultHomepageContent(); c.announcement.background = "#000000"; c.announcement.color = "#ffffff"; assert.equal(HomepageContentSchema.parse(c).announcement.color, "#FFFFFF");
});
test("collection selection forbids duplicates and limits cards without requiring a cover", () => {
  const c = defaultHomepageContent(); const tile = { id: "card1", collection_id: "pcol1", title: "Robes", description: "", image: null, enabled: true }; c.collections = [tile]; assert(HomepageContentSchema.safeParse(c).success);
  c.collections.push({ ...tile, id: "card2" }); assert.equal(HomepageContentSchema.safeParse(c).success, false);
  c.collections = Array.from({ length: 13 }, (_, i) => ({ ...tile, id: `card${i}`, collection_id: `pcol${i}` })); assert.equal(HomepageContentSchema.safeParse(c).success, false);
});
test("enabled promotions require desktop images and buttons require a safe destination", () => {
  const c = defaultHomepageContent(); const banner = { id: "b1", title: "Offre", subtitle: "", desktop: null, mobile: null, button_text: "", url: "", enabled: false }; c.banners = [banner]; assert(HomepageContentSchema.safeParse(c).success);
  banner.enabled = true; assert.equal(HomepageContentSchema.safeParse(c).success, false);
  banner.desktop = { image_id: "image1", image_url: "https://media.example/banner.png" }; assert(HomepageContentSchema.safeParse(c).success);
  banner.button_text = "Découvrir"; assert.equal(HomepageContentSchema.safeParse(c).success, false);
  banner.url = "/boutique"; assert(HomepageContentSchema.safeParse(c).success);
  banner.url = "javascript:x"; assert.equal(HomepageContentSchema.safeParse(c).success, false); assert.equal(parseHomepageContent(c), null);
});
test("save contract rejects unknown actions, extra fields, malformed and negative revisions", () => {
  for (const patch of [{ action: "reset" }, { revision: -1 }, { revision: 1.5 }, { injected: true }]) assert.equal(SaveHomepageContentSchema.safeParse({ action: "publish", revision: 0, content: defaultHomepageContent(), ...patch }).success, false);
  assert(SaveHomepageContentSchema.safeParse({ action: "draft", revision: 0, content: defaultHomepageContent() }).success);
});
test("public fetch is uncached, only reads published content and gracefully handles outages", async () => {
  const c = defaultHomepageContent(); let calls = 0;
  const result = await readHomepageContent({ url: "http://localhost:9012", publishableKey: "pk_test" }, async (url, options) => { calls++; assert.equal(url.pathname, "/store/homepage-content"); assert.equal(options.cache, "no-store"); assert.equal(options.redirect, "error"); assert.equal(options.headers["x-publishable-api-key"], "pk_test"); return new Response(JSON.stringify({ content: c })); });
  assert.deepEqual(result, c); assert.equal(calls, 1);
  for (const transport of [async () => { throw Error("offline"); }, async () => new Response("{}", { status: 500 }), async () => new Response(JSON.stringify({ draft: c })), async () => new Response(JSON.stringify({ content: { sections: [] } }))]) assert.equal(await readHomepageContent({ url: "http://localhost:9012" }, transport), null);
});
test("storefront parser rejects active image URLs and malformed content without crashing", () => {
  for (const patch of [null, {}, { announcement: {} }, { sections: [null] }]) assert.equal(parseHomepageContent(patch), null);
  const c = defaultHomepageContent(); c.collections = [{ id: "c1", collection_id: "pcol1", title: "Robes", description: "", enabled: true, image: { image_id: "img1", image_url: "javascript:alert(1)" } }]; assert.equal(parseHomepageContent(c), null);
});
