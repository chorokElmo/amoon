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
const scratch = mkdtempSync(join(root, ".local/branding-tests-"));
for (const [name, file] of [["branding-validation", "apps/medusa/src/lib/branding-validation.ts"], ["branding-images", "apps/medusa/src/lib/branding-images.ts"], ["branding", "apps/storefront/src/lib/branding.ts"]]) {
  writeFileSync(join(scratch, name + ".js"), ts.transpileModule(readFileSync(join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
}
const require = createRequire(import.meta.url);
const { SaveBrandingSchema, UploadBrandingSchema } = require(join(scratch, "branding-validation.js"));
const { validateBrandingImage, sanitizeLogoSvg } = require(join(scratch, "branding-images.js"));
const { readBranding, parseBranding } = require(join(scratch, "branding.js"));
const defaults = { header_logo: null, footer_logo: null, favicon: null };
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="80" viewBox="0 0 180 80"><rect width="180" height="80" fill="#7a0f32"/></svg>';
const image = { url: "http://localhost:9001/static/branding-test.png", width: 64, height: 64, mime_type: "image/png" };
const png = (width, height) => sharp({ create: { width, height, channels: 4, background: "#7A0F3280" } }).png().toBuffer();
after(() => rmSync(scratch, { recursive: true, force: true }));

test("branding saves accept defaults and reject arbitrary URLs, unknown slots and invalid revisions", () => {
  assert.deepEqual(SaveBrandingSchema.parse({ revision: 2, assets: defaults }).assets, defaults);
  for (const value of [{ revision: -1, assets: defaults }, { revision: 0, assets: { ...defaults, extra: null } }, { revision: 0, assets: { ...defaults, header_logo: null }, url: "https://evil.invalid" }]) assert.equal(SaveBrandingSchema.safeParse(value).success, false);
  assert.equal(UploadBrandingSchema.safeParse({ slot: "header_logo", mime_type: "image/png", content: "not-base64" }).success, false);
});
test("PNG/JPG/WebP logos decode to metadata-free PNG without losing their dimensions", async () => {
  for (const format of ["png", "jpeg", "webp"]) {
    const input = await sharp(await png(180, 80)).toFormat(format).toBuffer();
    const result = await validateBrandingImage(input.toString("base64"), `image/${format}`, "header_logo");
    const meta = await sharp(result.data).metadata();
    assert.equal(result.width, 180); assert.equal(result.height, 80); assert.equal(meta.format, "png"); assert.equal(meta.exif, undefined);
  }
});
test("safe SVG is reconstructed and rasterized; gradients and paths remain supported", async () => {
  assert.match(sanitizeLogoSvg(Buffer.from(svg)).toString(), /xmlns=/);
  const result = await validateBrandingImage(Buffer.from(svg).toString("base64"), "image/svg+xml", "footer_logo");
  assert.equal((await sharp(result.data).metadata()).format, "png"); assert.equal(result.width, 180);
  const gradient = '<svg width="80" height="80"><defs><linearGradient id="a"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></linearGradient></defs><path d="M0 0 L80 0 L80 80 Z" fill="url(#a)"/></svg>';
  assert.equal((await validateBrandingImage(Buffer.from(gradient).toString("base64"), "image/svg+xml", "header_logo")).width, 80);
});
test("SVG scripts, events, entity expansion, CSS, embedded HTML and external references are rejected", () => {
  for (const dangerous of [
    '<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"></svg>', '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>',
    '<svg><image href="https://evil.invalid/a"/></svg>', '<svg><foreignObject/></svg>', '<svg style="fill:red"/>', '<svg><use href="#x"/></svg>',
    '<svg><rect fill="url(https://evil.invalid/a)"/></svg>', '<svg width="1" width="2"/>', '<svg><g></svg>', '<svg/><svg/>', '<svg><!--comment--></svg>',
  ]) assert.throws(() => sanitizeLogoSvg(Buffer.from(dangerous)), dangerous);
});
test("corrupt, disguised, animated and oversized logos are rejected", async () => {
  const input = await png(80, 80);
  await assert.rejects(validateBrandingImage(input.toString("base64"), "image/jpeg", "header_logo"));
  await assert.rejects(validateBrandingImage(input.subarray(0, 40).toString("base64"), "image/png", "header_logo"));
  await assert.rejects(validateBrandingImage(Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64"), "image/png", "footer_logo"));
  await assert.rejects(validateBrandingImage((await png(4097, 1)).toString("base64"), "image/png", "header_logo"));
  const pixels = Buffer.alloc(32 * 64 * 4, 255); pixels.fill(0, 32 * 32 * 4);
  const animated = await sharp(pixels, { raw: { width: 32, height: 64, channels: 4, pageHeight: 32 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  await assert.rejects(validateBrandingImage(animated.toString("base64"), "image/webp", "header_logo"));
});
test("PNG favicons must be square and 16–512 pixels, under 1 MiB", async () => {
  assert.equal((await validateBrandingImage((await png(64, 64)).toString("base64"), "image/png", "favicon")).width, 64);
  for (const [width, height] of [[32, 64], [15, 15], [513, 513]]) await assert.rejects(validateBrandingImage((await png(width, height)).toString("base64"), "image/png", "favicon"));
  await assert.rejects(validateBrandingImage(Buffer.alloc(1024 * 1024 + 1).toString("base64"), "image/png", "favicon"));
  await assert.rejects(validateBrandingImage(Buffer.from(svg).toString("base64"), "image/svg+xml", "favicon"));
});
function icoFrame(bytes, width = 32) {
  const header = Buffer.alloc(22); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header[6] = width; header[7] = width; header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(bytes.length, 14); header.writeUInt32LE(22, 18); return Buffer.concat([header, bytes]);
}
test("ICO PNG and 32-bit DIB frames decode safely to PNG; malformed offsets are rejected", async () => {
  const ico = icoFrame(await png(32, 32));
  assert.equal((await validateBrandingImage(ico.toString("base64"), "image/x-icon", "favicon")).width, 32);
  const dib = Buffer.alloc(40 + 32 * 32 * 4 + 4 * 32); dib.writeUInt32LE(40, 0); dib.writeInt32LE(32, 4); dib.writeInt32LE(64, 8); dib.writeUInt16LE(1, 12); dib.writeUInt16LE(32, 14); dib.fill(255, 40, 40 + 32 * 32 * 4);
  assert.equal((await validateBrandingImage(icoFrame(dib).toString("base64"), "image/vnd.microsoft.icon", "favicon")).height, 32);
  ico.writeUInt32LE(0xffffffff, 18);
  await assert.rejects(validateBrandingImage(ico.toString("base64"), "image/x-icon", "favicon"));
  await assert.rejects(validateBrandingImage(icoFrame(dib).toString("base64"), "image/x-icon", "header_logo"));
});
test("storefront validates assets, reads uncached and retains defaults during backend outages", async () => {
  assert.deepEqual(parseBranding({ images: defaults }), { images: defaults });
  assert.equal(parseBranding({ images: { ...defaults, favicon: { ...image, url: "javascript:alert(1)" } } }), null);
  assert.equal(parseBranding({ images: { ...defaults, favicon: { ...image, width: 32.5 } } }), null);
  const result = await readBranding({ url: "http://localhost:9001", publishableKey: "pk_test" }, async (url, init) => {
    assert.equal(String(url), "http://localhost:9001/store/branding"); assert.equal(init.cache, "no-store"); assert.equal(init.headers["x-publishable-api-key"], "pk_test");
    return Response.json({ images: { ...defaults, favicon: image } });
  });
  assert.equal(result.images.favicon.width, 64);
  assert.equal(await readBranding({ url: "http://localhost:9001" }, async () => { throw Error("offline"); }), null);
});
