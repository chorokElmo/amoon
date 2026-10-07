import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareLocal, setValue } from "./prepare-local.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const local = path.join(root, ".local");
const medusa = path.join(root, "apps/medusa");
const pgBin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
const data = path.join(local, "postgres");
const port = "5434";
const exists = async target => { try { await access(target); return true; } catch { return false; } };
function run(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: root, windowsHide: true, encoding: "utf8", stdio: "inherit", ...options });
  if (result.error || result.status !== 0) throw new Error("Native setup step failed: " + path.basename(program));
  return result.stdout;
}
await prepareLocal();
await mkdir(local, { recursive: true });
await mkdir(path.join(local, "config"), { recursive: true });
if (!await exists(path.join(pgBin, "initdb.exe"))) throw new Error("PostgreSQL binaries not found. Set PG_BIN to your installation's bin directory.");
const rootEnv = await readFile(path.join(root, ".env"), "utf8");
const password = rootEnv.match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1].trim();
if (!password) throw new Error("Missing generated database password");
if (!await exists(path.join(data, "PG_VERSION"))) {
  await mkdir(data, { recursive: true });
  const passwordFile = path.join(local, "postgres-password");
  await writeFile(passwordFile, password + "\n", { mode: 0o600 });
  run(path.join(pgBin, "initdb.exe"), ["-D", data, "-U", "amoon", "--pwfile=" + passwordFile, "--auth=scram-sha-256", "--encoding=UTF8"]);
}
const status = spawnSync(path.join(pgBin, "pg_ctl.exe"), ["-D", data, "status"], { windowsHide: true, stdio: "ignore" });
if (status.status !== 0) run(path.join(pgBin, "pg_ctl.exe"), ["-D", data, "-l", path.join(local, "postgres.log"), "-o", "-h 127.0.0.1 -p " + port, "-w", "start"]);
const dbEnv = { ...process.env, PGPASSWORD: password };
const pgArgs = ["-h", "127.0.0.1", "-p", port, "-U", "amoon"];
const found = run(path.join(pgBin, "psql.exe"), [...pgArgs, "-d", "postgres", "-At", "-c", "SELECT 1 FROM pg_database WHERE datname = 'amoon'"], { env: dbEnv, stdio: "pipe" });
if (found.trim() !== "1") run(path.join(pgBin, "createdb.exe"), [...pgArgs, "amoon"], { env: dbEnv });
let backendEnv = await readFile(path.join(medusa, ".env"), "utf8");
backendEnv = setValue(backendEnv, "DATABASE_URL", "postgres://amoon:" + encodeURIComponent(password) + "@127.0.0.1:" + port + "/amoon");
backendEnv = setValue(backendEnv, "MEDUSA_LOCAL_INFRASTRUCTURE", "true");
backendEnv = setValue(backendEnv, "MEDUSA_WORKER_MODE", "shared");
backendEnv = setValue(backendEnv, "MEDUSA_BACKEND_URL", "http://localhost:9001");
backendEnv = setValue(backendEnv, "STORE_CORS", "http://localhost:8000");
backendEnv = setValue(backendEnv, "ADMIN_CORS", "http://localhost:9001");
backendEnv = setValue(backendEnv, "AUTH_CORS", "http://localhost:8000,http://localhost:9001");
await writeFile(path.join(medusa, ".env"), backendEnv, { mode: 0o600 });
const env = { ...process.env, NODE_ENV: "development", MEDUSA_LOCAL_INFRASTRUCTURE: "true", MEDUSA_WORKER_MODE: "shared", MEDUSA_DISABLE_TELEMETRY: "true", XDG_CONFIG_HOME: path.join(local, "config") };
const require = createRequire(import.meta.url);
const cli = require.resolve("@medusajs/cli/cli.js");
run(process.execPath, [cli, "db:migrate"], { cwd: medusa, env });
run(process.execPath, [cli, "exec", "./src/scripts/setup-catalog.ts"], { cwd: medusa, env });
const settings = JSON.parse(await readFile(path.join(medusa, ".catalog-setup.json"), "utf8"));
if (!settings.publishable_key?.startsWith("pk_") || !settings.region_id || !settings.sales_channel_id?.startsWith("sc_")) throw new Error("Invalid catalog setup output");
for (const relative of [".env", "apps/storefront/.env"]) {
  const target = path.join(root, relative);
  let contents = await readFile(target, "utf8");
  contents = setValue(contents, "STOREFRONT_URL", "http://localhost:8000");
  contents = setValue(contents, "MEDUSA_INTERNAL_URL", "http://localhost:9001");
  contents = setValue(contents, "MEDUSA_PUBLISHABLE_KEY", settings.publishable_key);
  contents = setValue(contents, "MEDUSA_REGION_ID", settings.region_id);
  contents = setValue(contents, "MEDUSA_SALES_CHANNEL_ID", settings.sales_channel_id);
  contents = setValue(contents, "HOMEPAGE_DEMO", "false");
  await writeFile(target, contents, { mode: 0o600 });
}
console.log("Native database, Morocco/MAD region and catalog connection configured. No sample products created. Build Medusa, then start with npm run dev:native.");
