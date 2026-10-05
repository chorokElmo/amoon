import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function configurationChecks(env) {
  const origin = value => { try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && u.pathname === "/" && !u.search && !u.hash && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname); } catch { return false; } };
  const includes = (value, wanted) => (value || "").split(",").map(x => x.trim()).includes(wanted);
  const secrets = [env.POSTGRES_PASSWORD, env.JWT_SECRET, env.COOKIE_SECRET, env.CART_COOKIE_SECRET];
  return {
    public_origins: origin(env.STOREFRONT_URL) && origin(env.MEDUSA_BACKEND_URL),
    cors_matches_origins: includes(env.STORE_CORS, env.STOREFRONT_URL) && includes(env.ADMIN_CORS, env.MEDUSA_BACKEND_URL) && includes(env.AUTH_CORS, env.STOREFRONT_URL) && includes(env.AUTH_CORS, env.MEDUSA_BACKEND_URL),
    independent_secrets: secrets.every(s => typeof s === "string" && s.length >= 32) && new Set(secrets).size === 4,
    database_password_url_safe: /^[A-Za-z0-9_-]{32,}$/.test(env.POSTGRES_PASSWORD || ""),
    catalog_configured: /^pk_/.test(env.MEDUSA_PUBLISHABLE_KEY || "") && /^reg_/.test(env.MEDUSA_REGION_ID || "") && /^sc_/.test(env.MEDUSA_SALES_CHANNEL_ID || ""),
    admin_same_origin: !env.MEDUSA_ADMIN_BACKEND_URL || env.MEDUSA_ADMIN_BACKEND_URL === "/" || env.MEDUSA_ADMIN_BACKEND_URL === env.MEDUSA_BACKEND_URL,
    public_media_origin_allowed: includes(env.PRODUCT_IMAGE_ORIGINS, env.MEDUSA_BACKEND_URL),
  };
}

export async function probe(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function main() {
  let env = { ...process.env };
  const index = process.argv.indexOf("--env");
  if (index >= 0) {
    const text = await readFile(process.argv[index + 1], "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  const checks = configurationChecks(env);
  console.log(JSON.stringify({ configuration: checks }, null, 2));
  if (Object.values(checks).some(v => !v)) process.exitCode = 1;
  if (process.argv.includes("--config-only")) return;
  if (!checks.public_origins) return;
  const tests = {
    backend_health: async () => { await probe(env.MEDUSA_BACKEND_URL + "/health"); },
    admin_login_provider: async () => { const data = await (await probe(env.MEDUSA_BACKEND_URL + "/auth/user/providers")).json(); if (!data.providers?.some(p => p.id === "emailpass" || p.identifier === "emailpass")) throw new Error("Email/password provider missing"); },
    auth_cors: async () => { const r = await probe(env.MEDUSA_BACKEND_URL + "/auth/user/providers", { headers: { Origin: env.STOREFRONT_URL } }); if (r.headers.get("access-control-allow-origin") !== env.STOREFRONT_URL || r.headers.get("access-control-allow-credentials") !== "true") throw new Error("Storefront origin or session credentials not allowed"); },
    storefront_health: async () => { const r = await probe(env.STOREFRONT_URL + "/api/health"); let data; try { data = await r.json(); } catch { throw new Error("Health endpoint returned non-JSON content"); } if (data.status !== "ok" || data.service !== "amoon-storefront") throw new Error("Incorrect storefront health response"); },
    real_catalog_connection: async () => { const u = new URL("/store/products", env.MEDUSA_BACKEND_URL); u.searchParams.set("limit", "1"); u.searchParams.set("region_id", env.MEDUSA_REGION_ID || ""); const data = await (await probe(u, { headers: { "x-publishable-api-key": env.MEDUSA_PUBLISHABLE_KEY || "" } })).json(); if (!Array.isArray(data.products)) throw new Error("Invalid catalog response"); },
  };
  for (const [name, test] of Object.entries(tests)) {
    try { await test(); console.log(`PASS ${name}`); }
    catch (error) { console.log(`FAIL ${name}: ${error.cause?.code || error.message}`); process.exitCode = 1; }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error("Unable to read deployment configuration. No credentials printed."); process.exitCode = 1; });
