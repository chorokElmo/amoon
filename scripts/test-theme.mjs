import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, ".local"), { recursive: true });
const scratch = mkdtempSync(join(root, ".local/theme-tests-"));
for (const [name, file] of [["theme-palette", "apps/medusa/src/lib/theme-palette.ts"], ["theme-validation", "apps/medusa/src/lib/theme-validation.ts"], ["theme", "apps/storefront/src/lib/theme.ts"]]) writeFileSync(join(scratch, name + ".js"), ts.transpileModule(readFileSync(join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText);
const require = createRequire(import.meta.url);
const { defaultTheme, themePresets, themeFields, contrastRatio, themeContrastChecks, readableColor } = require(join(scratch, "theme-palette.js"));
const { SaveThemeSchema } = require(join(scratch, "theme-validation.js"));
const { parseTheme, readTheme, themeProperties, themeKeys } = require(join(scratch, "theme.js"));
after(() => rmSync(scratch, { recursive: true, force: true }));

test("default theme and all presets satisfy WCAG AA text contrast", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21); assert.equal(contrastRatio("#112233", "#112233"), 1);
  for (const colors of [defaultTheme, ...themePresets.map(p => p.colors)]) {
    assert(themeContrastChecks(colors).every(check => check.pass)); assert(SaveThemeSchema.safeParse({ action: "publish", revision: 0, colors }).success);
  }
  assert.deepEqual(themeKeys, themeFields.map(([key]) => key));
});
test("strict HEX validation rejects CSS injection, missing/unknown controls, invalid actions and revisions", () => {
  for (const colors of [{ ...defaultTheme, primary: "red" }, { ...defaultTheme, primary: "#123" }, { ...defaultTheme, primary: "#123456; color:red" }, { ...defaultTheme, unknown: "#123456" }, { ...defaultTheme, text: undefined }]) assert.equal(SaveThemeSchema.safeParse({ action: "draft", revision: 0, colors }).success, false);
  for (const body of [{ action: "erase", revision: 0 }, { action: "reset", revision: -1 }, { action: "reset", revision: 0.5 }, { action: "reset", revision: 0, colors: defaultTheme }]) assert.equal(SaveThemeSchema.safeParse(body).success, false);
  assert.equal(SaveThemeSchema.parse({ action: "draft", revision: 0, colors: { ...defaultTheme, primary: "#abcdef" } }).colors.primary, "#ABCDEF");
});
test("a low-contrast draft can be saved but each unreadable surface blocks publication", () => {
  for (const patch of [{ background: defaultTheme.text }, { header: defaultTheme.text }, { footer: defaultTheme.text }, { secondary: defaultTheme.text }, { button_text: defaultTheme.button_background }]) {
    const colors = { ...defaultTheme, ...patch };
    assert(SaveThemeSchema.safeParse({ action: "draft", revision: 3, colors }).success);
    assert.equal(SaveThemeSchema.safeParse({ action: "publish", revision: 3, colors }).success, false);
    assert.equal(themeProperties(colors), undefined);
  }
});
test("default or unavailable themes leave the original CSS completely intact", () => {
  assert.equal(themeProperties(null), undefined); assert.equal(themeProperties(defaultTheme), undefined);
  assert.deepEqual(parseTheme({ colors: null, revision: 0 }), { colors: null, revision: 0 });
  assert.equal(parseTheme({ colors: { ...defaultTheme, primary: "</style><script>" }, revision: 1 }), null);
  assert.equal(parseTheme({ colors: defaultTheme, revision: -1 }), null);
});
test("published colors drive global, header/footer and button properties without CSS injection", () => {
  const colors = themePresets[1].colors, vars = themeProperties(colors);
  assert.equal(vars["--color-cream"], colors.background); assert.equal(vars["--color-ink"], colors.text); assert.equal(vars["--wine"], colors.primary);
  assert.equal(vars["--theme-header-background"], colors.header); assert.equal(vars["--theme-footer-background"], colors.footer);
  assert.equal(vars["--theme-button-background"], colors.button_background); assert.equal(vars["--theme-button-text"], colors.button_text);
  assert(Object.values(vars).every(value => /^#[0-9A-F]{6}$/.test(value)));
});
test("pale brand colors remain selectable while text links and badges derive accessible foregrounds", () => {
  const colors = { ...defaultTheme, primary: "#FFFFCC", accent: "#FFEEDD" }, vars = themeProperties(colors);
  assert.equal(vars["--wine"], "#FFFFCC"); assert(contrastRatio(vars["--theme-link"], colors.background) >= 4.5);
  assert(contrastRatio(vars["--theme-on-primary"], colors.primary) >= 4.5); assert(contrastRatio(vars["--theme-on-accent"], colors.accent) >= 4.5);
  for (const bg of ["#000000", "#777777", "#FFFFFF", "#7A0F32"]) assert(contrastRatio(readableColor("#FFFFCC", bg), bg) >= 4.5);
});
test("storefront requests only the public published palette without caching", async () => {
  const result = await readTheme({ url: "http://localhost:9001", publishableKey: "pk_test" }, async (url, init) => {
    assert.equal(String(url), "http://localhost:9001/store/theme"); assert.equal(init.cache, "no-store"); assert.equal(init.headers["x-publishable-api-key"], "pk_test");
    return Response.json({ colors: themePresets[0].colors, revision: 2 });
  });
  assert.equal(result.revision, 2); assert.equal(result.colors.primary, "#8C2548");
});
test("older backends, corrupt responses, invalid origins and network failures fall back safely", async () => {
  for (const response of [new Response("", { status: 404 }), Response.json({ colors: "invalid", revision: 1 })]) assert.equal(await readTheme({ url: "http://localhost:9001" }, async () => response), null);
  assert.equal(await readTheme({ url: "http://localhost:9001" }, async () => { throw Error("offline"); }), null);
  assert.equal(await readTheme({ url: "file:///private" }, async () => { throw Error("must not fetch"); }), null);
});
