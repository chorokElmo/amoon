import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prepareLocal, setValue } from "./prepare-local.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = path.join(root, "apps/medusa");
const steps = [
  ["Apply database migrations", ["db:migrate"]],
  ["Configure Morocco/MAD, store defaults, sales channel and publishable key", ["exec", "./src/scripts/setup-catalog.ts"]],
  ["Configure stock location, Morocco delivery at 0 MAD and cash on delivery", ["exec", "./src/scripts/setup-checkout.ts"]],
];

async function main() {
  if (process.argv.includes("--plan")) {
    for (const [label] of steps) console.log(label);
    console.log("Copy connection values to root and storefront .env files. No changes made.");
    return;
  }

  const require = createRequire(import.meta.url);
  let cli;
  try { cli = require.resolve("@medusajs/cli/cli.js"); }
  catch { throw new Error("Dependencies are missing. Run npm ci, then npm run setup:store again."); }

  await prepareLocal();
  const settings = require("dotenv").parse(await readFile(path.join(backend, ".env")));
  const database = new URL(settings.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    throw new Error("setup:store is for localhost. DATABASE_URL must point to a local database.");
  }
  const backendUrl = new URL(settings.MEDUSA_BACKEND_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(backendUrl.hostname)) {
    throw new Error("MEDUSA_BACKEND_URL must point to your local Medusa server.");
  }
  const config = path.join(root, ".local/config");
  await mkdir(config, { recursive: true });
  const env = {
    ...process.env, ...settings, NODE_ENV: "development",
    AMOON_DELIVERY_FEE: "0", XDG_CONFIG_HOME: config, MEDUSA_DISABLE_TELEMETRY: "true",
  };
  for (const [label, args] of steps) {
    console.log(label);
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: backend, env, stdio: "inherit", windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      throw new Error("Setup stopped: " + label + ". Fix the reported error and rerun setup:store; earlier steps may have completed.");
    }
  }

  const catalog = JSON.parse(await readFile(path.join(backend, ".catalog-setup.json"), "utf8"));
  if (!/^pk_[a-zA-Z0-9]+$/.test(catalog.publishable_key || "") ||
      !/^reg_[a-zA-Z0-9]+$/.test(catalog.region_id || "") ||
      !/^sc_[a-zA-Z0-9]+$/.test(catalog.sales_channel_id || "")) {
    throw new Error("Invalid catalog setup output; storefront connection settings were not updated.");
  }
  for (const relative of [".env", "apps/storefront/.env"]) {
    const file = path.join(root, relative);
    let contents = await readFile(file, "utf8");
    for (const [key, value] of Object.entries({
      STOREFRONT_URL: "http://localhost:8000",
      MEDUSA_INTERNAL_URL: backendUrl.origin,
      MEDUSA_PUBLISHABLE_KEY: catalog.publishable_key,
      MEDUSA_REGION_ID: catalog.region_id,
      MEDUSA_SALES_CHANNEL_ID: catalog.sales_channel_id,
    })) contents = setValue(contents, key, value);
    await writeFile(file, contents, { mode: 0o600 });
  }
  console.log("Morocco/MAD, sales channel, stock location, free delivery and manual COD configured. Storefront connection values saved privately.");
  console.log("Restart Medusa and the storefront. Add your admin account, dispatch address, published products, MAD prices and stock in Admin. No products, stock quantities or orders were created.");
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
