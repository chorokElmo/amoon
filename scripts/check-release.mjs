import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const env = require("dotenv").parse(await readFile(path.join(root, ".env")));
function publicOrigin(value) {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && u.pathname === "/" && !u.search && !u.hash && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname); } catch { return false; }
}
function cors(value, origins) {
  const entries = (value || "").split(",").map(v => v.trim());
  return entries.length > 0 && entries.every(v => publicOrigin(v) && origins.includes(v));
}
const secrets = [env.POSTGRES_PASSWORD, env.JWT_SECRET, env.COOKIE_SECRET, env.CART_COOKIE_SECRET];
const checks = {
  storefront_https_origin: publicOrigin(env.STOREFRONT_URL),
  backend_https_origin: publicOrigin(env.MEDUSA_BACKEND_URL),
  independent_secrets: secrets.every(s => typeof s === "string" && s.length >= 32) && new Set(secrets).size === 4,
  store_cors: cors(env.STORE_CORS, [env.STOREFRONT_URL]),
  admin_cors: cors(env.ADMIN_CORS, [env.MEDUSA_BACKEND_URL]),
  auth_cors: cors(env.AUTH_CORS, [env.STOREFRONT_URL, env.MEDUSA_BACKEND_URL]),
  catalog_credentials_present: /^pk_/.test(env.MEDUSA_PUBLISHABLE_KEY || "") && /^reg_/.test(env.MEDUSA_REGION_ID || "") && /^sc_/.test(env.MEDUSA_SALES_CHANNEL_ID || ""),
  demo_disabled: env.HOMEPAGE_DEMO !== "true",
};
console.log(JSON.stringify({ configurationChecks: checks, note: "Configuration check only. Does not verify TLS, DNS, restore, owner dispatch data, live order concurrency or deployment." }, null, 2));
if (Object.values(checks).some(v => !v)) process.exitCode = 2;
