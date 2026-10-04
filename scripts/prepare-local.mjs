import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
export function setValue(contents, name, value) {
  if (/[\r\n]/.test(value)) throw new Error("Invalid configuration value");
  const expression = new RegExp("^" + name + "=.*$", "m");
  return expression.test(contents) ? contents.replace(expression, () => name + "=" + value) : contents.trimEnd() + "\n" + name + "=" + value + "\n";
}
export async function prepareLocal() {
  async function existing(relative, example) {
    try { return await readFile(path.join(root, relative), "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; return readFile(path.join(root, example), "utf8"); }
  }
  let environment = await existing(".env", ".env.example");
  const values = () => Object.fromEntries(environment.split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)]; }));
  for (const name of ["POSTGRES_PASSWORD", "JWT_SECRET", "COOKIE_SECRET", "CART_COOKIE_SECRET"]) if (!values()[name]) environment = setValue(environment, name, randomBytes(32).toString("hex"));
  if (!values().POSTGRES_PORT) environment = setValue(environment, "POSTGRES_PORT", "5433");
  const config = values();
  if (config.JWT_SECRET.length < 32 || config.COOKIE_SECRET.length < 32 || config.CART_COOKIE_SECRET.length < 32) throw new Error("Existing JWT/COOKIE/CART secrets are too short; no files changed.");
  await writeFile(path.join(root, ".env"), environment, { mode: 0o600 });
  let medusa = await existing("apps/medusa/.env", "apps/medusa/.env.example");
  if (!medusa.match(/^DATABASE_URL=(?!.*YOUR_URL_SAFE_PASSWORD).+$/m)) medusa = setValue(medusa, "DATABASE_URL", "postgres://" + (config.POSTGRES_USER || "amoon") + ":" + encodeURIComponent(config.POSTGRES_PASSWORD) + "@localhost:" + config.POSTGRES_PORT + "/" + (config.POSTGRES_DB || "amoon"));
  for (const name of ["JWT_SECRET", "COOKIE_SECRET"]) if (!medusa.match(new RegExp("^" + name + "=.+$", "m"))) medusa = setValue(medusa, name, config[name]);
  await writeFile(path.join(root, "apps/medusa/.env"), medusa, { mode: 0o600 });
  let storefront = await existing("apps/storefront/.env", "apps/storefront/.env.example");
  if (!storefront.match(/^CART_COOKIE_SECRET=.+$/m)) storefront = setValue(storefront, "CART_COOKIE_SECRET", config.CART_COOKIE_SECRET);
  if ((storefront.match(/^CART_COOKIE_SECRET=(.*)$/m)?.[1] || "").length < 32) throw new Error("Existing storefront cart signing secret is too short.");
  await writeFile(path.join(root, "apps/storefront/.env"), storefront, { mode: 0o600 });
  console.log("Local environment files prepared. Secrets remain in ignored .env files; existing values preserved.");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepareLocal();
