import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const root = resolve("apps/storefront/src");
const scratch = mkdtempSync(join(tmpdir(), "amoon-i18n-"));
for (const name of ["i18n", "i18n-metadata", "product-localization", "catalog-model", "cart-cookie", "checkout-model"]) {
  writeFileSync(join(scratch, name + ".js"), ts.transpileModule(readFileSync(join(root, "lib", name + ".ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
}
writeFileSync(join(scratch, "messages-ar.json"), readFileSync(join(root, "lib/messages-ar.json")));
const require = createRequire(import.meta.url);
const { translate, parseLanguage, LOCALE_COOKIE } = require(join(scratch, "i18n.js"));
const { localizeMetadata } = require(join(scratch, "i18n-metadata.js"));
const { normalizeProduct, selectCatalog, parseFilters } = require(join(scratch, "catalog-model.js"));
const { localizeProduct } = require(join(scratch, "product-localization.js"));
const { CART_COOKIE, signCart, readCartCookie } = require(join(scratch, "cart-cookie.js"));
const { parseCustomer } = require(join(scratch, "checkout-model.js"));
const dictionary = JSON.parse(readFileSync(join(root, "lib/messages-ar.json"), "utf8"));
after(() => rmSync(scratch, { recursive: true, force: true }));

test("locale defaults to French and only accepts supported preferences", () => {
  for (const value of [undefined, "", "en", "AR", "../ar"]) assert.equal(parseLanguage(value), "fr");
  assert.equal(parseLanguage("ar"), "ar");
});
test("checkout accepts Arabic customer names and addresses without altering phone validation", () => {
  const customer = parseCustomer({ full_name: "سارة الإدريسي", address: { phone: "0612345678", city: "الدار البيضاء", address_1: "شارع محمد الخامس، رقم 12" } });
  assert.equal(customer.address.first_name, "سارة");
  assert.equal(customer.address.last_name, "الإدريسي");
  assert.equal(customer.address.phone, "+212612345678");
  assert.equal(customer.address.country_code, "ma");
});
test("translations preserve French, interpolate surrounding whitespace and preserve unknown content", () => {
  assert.equal(translate("fr", "Ajouter au panier"), "Ajouter au panier");
  assert.equal(translate("ar", "Ajouter au panier"), "أضيفي إلى السلة");
  assert.equal(translate("ar", "  En stock  "), "  متوفر  ");
  assert.equal(translate("ar", "Owner-authored product name"), "Owner-authored product name");
  assert.equal(translate("ar", "__proto__"), "__proto__");
});
test("changing locale cannot alter or invalidate the signed cart identifier", () => {
  assert.notEqual(LOCALE_COOKIE, CART_COOKIE);
  const secret = "a".repeat(32), signed = signCart("cart_ABC123", secret);
  for (const language of ["fr", "ar", "fr"]) {
    const jar = `${CART_COOKIE}=${signed}; ${LOCALE_COOKIE}=${language}`;
    const value = jar.split("; ").find(cookie => cookie.startsWith(CART_COOKIE + "=")).slice(CART_COOKIE.length + 1);
    assert.equal(readCartCookie(value, secret), "cart_ABC123");
  }
});
test("Arabic product fields use only authored metadata and preserve commerce values and French fallback", () => {
  const product = normalizeProduct({ id: "prod_A", handle: "original-handle", title: "Robe originale", description: "Description française", metadata: { composition: "Coton", translations: { ar: { title: "فستان", description: "وصف عربي", size_guide: "دليل المقاسات", variants: { variant_A: "متوسط" } } } }, variants: [{ id: "variant_A", title: "M", manage_inventory: false, calculated_price: { currency_code: "mad", calculated_amount: 250, original_amount: 300 } }] });
  const localized = localizeProduct(product, "ar");
  assert.equal(localized.title, "فستان");
  assert.equal(localized.description, "وصف عربي");
  assert.equal(localized.composition, "Coton");
  assert.equal(localized.sizeGuide, "دليل المقاسات");
  assert.equal(localized.handle, product.handle);
  assert.equal(localized.variants[0].id, product.variants[0].id);
  assert.equal(localized.variants[0].price, 250);
  assert.equal(localized.variants[0].originalPrice, 300);
  assert.equal(localized.variants[0].stock, "in_stock");
  assert.equal(localizeProduct(product, "fr"), product);
  assert.equal(product.title, "Robe originale");
  const data = { products: [localized], categories: [], collections: [] };
  assert.equal(selectCatalog(data, parseFilters({ q: "Robe originale" })).total, 1);
  assert.equal(selectCatalog(data, parseFilters({ q: "فستان" })).total, 1);
});
test("missing or malformed Arabic product fields fall back without inventing content", () => {
  const product = normalizeProduct({ id: "prod_B", handle: "piece", title: "Pièce", description: "Texte", metadata: { translations: { ar: { title: 42, description: "   " } } }, variants: [] });
  assert.equal(localizeProduct(product, "ar").title, "Pièce");
  assert.equal(localizeProduct(product, "ar").description, "Texte");
});
test("metadata translates descriptions and locale while preserving canonical URLs and indexing controls", () => {
  const input = { metadataBase: new URL("https://amoon.example"), title: "Votre panier", description: "La mode féminine, avec élégance.", alternates: { canonical: "/boutique?page=2" }, robots: { index: false }, openGraph: { locale: "fr_MA" } };
  const localized = localizeMetadata(input, "ar");
  assert.equal(localized.title, "سلة مشترياتك");
  assert.equal(localized.openGraph.locale, "ar_MA");
  assert.equal(localized.metadataBase, input.metadataBase);
  assert.deepEqual(localized.alternates, input.alternates);
  assert.deepEqual(localized.robots, input.robots);
  assert.equal(input.title, "Votre panier");
});
function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]); }
test("all literal storefront UI labels and translation keys are covered", () => {
  const allowed = new Set(["Amoon Collection", "FR", "MAD", "a.", "×", "06 XX XX XX XX"]);
  const missing = [];
  for (const file of files(root).filter(file => file.endsWith(".tsx"))) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxText(node) && /[A-Za-zÀ-ÿ]/.test(node.text) && !allowed.has(node.text.trim())) missing.push(file + ": " + node.text.trim());
      if (ts.isCallExpression(node) && node.expression.getText(source) === "t" && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text;
        if (!Object.hasOwn(dictionary, key) && !Object.hasOwn(dictionary, key.trim())) missing.push(file + ": " + key);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(missing, []);
});
