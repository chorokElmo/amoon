import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, ".local"), { recursive: true });
const scratch = mkdtempSync(join(root, ".local/slider-tests-"));
for (const [name, file] of [
  ["slider-validation", "apps/medusa/src/lib/slider-validation.ts"],
  ["slider-images", "apps/medusa/src/lib/slider-images.ts"],
  ["homepage-slider", "apps/storefront/src/lib/homepage-slider.ts"],
]) {
  writeFileSync(join(scratch, name + ".js"), ts.transpileModule(readFileSync(join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
}
const require = createRequire(import.meta.url);
const { SaveSliderSchema, UploadSliderImageSchema, safeSlideLink, MAX_IMAGE_BYTES } = require(join(scratch, "slider-validation.js"));
const { validateSliderImage } = require(join(scratch, "slider-images.js"));
const { fallbackHomepageSlides, parseHomepageSlider, readHomepageSlider } = require(join(scratch, "homepage-slider.js"));
const slide = { ...fallbackHomepageSlides("/images/hero-amoon-rack.png", "Collection Amoon")[0], image_id: null, enabled: true };
after(() => rmSync(scratch, { recursive: true, force: true }));

test("valid ordered slides retain enabled flags and editable text", () => {
  const result = SaveSliderSchema.parse({ revision: 3, slides: [{ ...slide, id: "second", enabled: false }, slide] });
  assert.equal(result.slides[0].id, "second"); assert.equal(result.slides[0].enabled, false);
});
test("a configured empty slider is valid and does not restore the fallback", () => {
  assert.equal(SaveSliderSchema.parse({ revision: 1, slides: [] }).slides.length, 0);
  assert.deepEqual(parseHomepageSlider({ configured: true, slides: [] }), { configured: true, slides: [] });
});
test("duplicate slide IDs, excessive slides and invalid revisions are rejected", () => {
  for (const body of [{ revision: 0, slides: [slide, slide] }, { revision: 0, slides: Array.from({ length: 13 }, (_, i) => ({ ...slide, id: `s-${i}` })) }, { revision: -1, slides: [] }, { revision: 1.5, slides: [] }]) assert.equal(SaveSliderSchema.safeParse(body).success, false);
});
test("unsafe button URLs and mismatched secondary buttons are rejected", () => {
  for (const link of ["javascript:alert(1)", "data:text/html,hello", "//evil.example", "/\\evil.example", "https://user:pass@evil.example", "http://evil.example", " /boutique", "/\nevil.example"]) assert.equal(safeSlideLink(link), false, link);
  for (const link of ["/boutique", "/boutique?q=robes", "https://example.com/collection"]) assert.equal(safeSlideLink(link), true);
  assert.equal(SaveSliderSchema.safeParse({ revision: 0, slides: [{ ...slide, secondary_link: "" }] }).success, false);
});
test("image payload validation rejects arbitrary content and unsupported formats", () => {
  for (const body of [{ mime_type: "image/svg+xml", content: "PHN2Zz4=" }, { mime_type: "image/png", content: "not-base64!" }]) assert.equal(UploadSliderImageSchema.safeParse(body).success, false);
});
test("JPEG, PNG and WebP are decoded and re-encoded by the existing image decoder", async () => {
  for (const format of ["jpeg", "png", "webp"]) {
    const bytes = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#7A0F32" } }).toFormat(format).toBuffer();
    const result = await validateSliderImage(bytes.toString("base64"), `image/${format}`);
    assert.equal(result.width, 120); assert.equal(result.height, 80);
    assert.equal((await sharp(result.data).metadata()).format, format);
  }
});
test("corrupt, disguised, oversized and excessive-dimension images are rejected", async () => {
  const png = await sharp({ create: { width: 120, height: 80, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(validateSliderImage(png.toString("base64"), "image/jpeg"));
  await assert.rejects(validateSliderImage(png.subarray(0, 45).toString("base64"), "image/png"));
  await assert.rejects(validateSliderImage(Buffer.from("<svg></svg>").toString("base64"), "image/png"));
  await assert.rejects(validateSliderImage(Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64"), "image/png"));
  const wide = await sharp({ create: { width: 6001, height: 1, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(validateSliderImage(wide.toString("base64"), "image/png"));
});
test("storefront rejects malformed and unsafe responses", () => {
  for (const data of [null, {}, { configured: true, slides: [{ ...slide, button_link: "javascript:alert(1)" }] }, { configured: true, slides: [slide, slide] }]) assert.equal(parseHomepageSlider(data), null);
});
test("storefront reads fresh saved slides using the publishable API key", async () => {
  const result = await readHomepageSlider({ url: "http://localhost:9001", publishableKey: "pk_test" }, async (url, init) => {
    assert.equal(String(url), "http://localhost:9001/store/homepage-slider");
    assert.equal(init.cache, "no-store"); assert.equal(init.headers["x-publishable-api-key"], "pk_test");
    return Response.json({ configured: true, slides: [slide] });
  });
  assert.equal(result.slides[0].title, slide.title);
});
test("backend outages and older backends preserve the existing fallback", async () => {
  assert.equal(await readHomepageSlider({ url: "http://localhost:9001" }, async () => new Response("", { status: 404 })), null);
  assert.equal(await readHomepageSlider({ url: "http://localhost:9001" }, async () => { throw new Error("offline"); }), null);
  assert.equal(fallbackHomepageSlides("/images/hero-amoon-rack.png", "Amoon").length, 3);
});
