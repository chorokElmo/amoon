import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prepareLocal, setValue } from "./prepare-local.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
function docker(args, capture = false) {
  const result = spawnSync("docker", args, { cwd: root, encoding: "utf8", stdio: capture ? "pipe" : "inherit", windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(capture ? "Docker engine is unavailable. Open Docker Desktop and wait for Engine running, then run npm run setup:local again." : "Docker setup step failed. Inspect the output above; existing volumes were preserved.");
  return result.stdout || "";
}
await prepareLocal();
docker(["info", "--format", "{{.ServerVersion}}"], true);
docker(["compose", "build", "medusa"]);
docker(["compose", "up", "-d", "medusa", "worker"]);
for (let attempt = 0; attempt < 90; attempt++) {
  try { const response = await fetch("http://localhost:9000/health", { signal: AbortSignal.timeout(3000) }); if (response.ok) break; } catch { /* Container may still be migrating. */ }
  if (attempt === 89) throw new Error("Medusa did not become healthy. Inspect docker compose logs medusa migrate.");
  await new Promise(resolve => setTimeout(resolve, 2000));
}
docker(["compose", "exec", "-T", "medusa", "node", "node_modules/@medusajs/cli/cli.js", "exec", "./src/scripts/setup-catalog.js"]);
const config = JSON.parse(docker(["compose", "exec", "-T", "medusa", "node", "-e", "process.stdout.write(require('node:fs').readFileSync('.catalog-setup.json','utf8'))"], true));
if (!/^pk_/.test(config.publishable_key) || typeof config.region_id !== "string" || !config.sales_channel_id?.startsWith("sc_")) throw new Error("Invalid setup output; storefront environment was not updated.");
for (const file of [".env", "apps/storefront/.env"]) {
  let contents = await readFile(path.join(root, file), "utf8");
  contents = setValue(setValue(contents, "MEDUSA_PUBLISHABLE_KEY", config.publishable_key), "MEDUSA_REGION_ID", config.region_id);
  contents = setValue(contents, "MEDUSA_SALES_CHANNEL_ID", config.sales_channel_id);
  await writeFile(path.join(root, file), contents, { mode: 0o600 });
}
const response = await fetch("http://localhost:9000/store/regions", { headers: { "x-publishable-api-key": config.publishable_key }, signal: AbortSignal.timeout(8000) });
if (!response.ok) throw new Error("Store API verification failed.");
const body = await response.json();
if (!body.regions?.some(region => region.id === config.region_id && region.currency_code === "mad" && region.countries?.some(country => country.iso_2 === "ma"))) throw new Error("Morocco / MAD region verification failed.");
console.log("Verified: Medusa Store API, Morocco / MAD region and publishable key. Restart the host storefront to load its new connection settings. Publish real products to Amoon Storefront in Admin; no demo stock was created.");
