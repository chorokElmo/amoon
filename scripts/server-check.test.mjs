import test from "node:test";
import assert from "node:assert/strict";
import { configurationChecks, probe } from "./server-check.mjs";
import { createServer } from "node:http";
const valid = () => ({ STOREFRONT_URL: "https://shop.example.com", MEDUSA_BACKEND_URL: "https://api.example.com", STORE_CORS: "https://shop.example.com", ADMIN_CORS: "https://api.example.com", AUTH_CORS: "https://shop.example.com,https://api.example.com", POSTGRES_PASSWORD: "a".repeat(64), JWT_SECRET: "b".repeat(64), COOKIE_SECRET: "c".repeat(64), CART_COOKIE_SECRET: "d".repeat(64), MEDUSA_PUBLISHABLE_KEY: "pk_test", MEDUSA_REGION_ID: "reg_test", MEDUSA_SALES_CHANNEL_ID: "sc_test" });
test("valid deployment uses independent secrets and origin-specific CORS", () => {
  assert.ok(Object.values(configurationChecks({ ...valid(), PRODUCT_IMAGE_ORIGINS: "https://api.example.com" })).every(Boolean));
});
test("rejects localhost, URL credentials and stale Admin origins", () => {
  for (const url of ["http://localhost:9001", "https://user:password@api.example.com", "https://api.example.com/app"]) assert.equal(configurationChecks({ ...valid(), MEDUSA_BACKEND_URL: url }).public_origins, false);
  assert.equal(configurationChecks({ ...valid(), MEDUSA_ADMIN_BACKEND_URL: "http://localhost:9001" }).admin_same_origin, false);
});
test("rejects reused secrets, URL-unsafe database passwords and disconnected catalog", () => {
  const env = valid(); env.JWT_SECRET = env.COOKIE_SECRET;
  assert.equal(configurationChecks(env).independent_secrets, false);
  assert.equal(configurationChecks({ ...valid(), POSTGRES_PASSWORD: "a/".repeat(32) }).database_password_url_safe, false);
  assert.equal(configurationChecks({ ...valid(), MEDUSA_PUBLISHABLE_KEY: "" }).catalog_configured, false);
  assert.equal(configurationChecks({ ...valid(), AUTH_CORS: "https://wrong.example.com" }).cors_matches_origins, false);
});
test("HTTP checks distinguish reachable services from a reverse-proxy failure", async () => {
  const server = createServer((req, res) => { res.writeHead(req.url === "/health" ? 200 : 502); res.end("diagnostic fixture"); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try { const base = `http://127.0.0.1:${server.address().port}`; assert.equal((await probe(base + "/health")).status, 200); await assert.rejects(probe(base + "/auth/user/providers"), /HTTP 502/); }
  finally { await new Promise(resolve => server.close(resolve)); }
});
