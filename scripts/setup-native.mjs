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
if (process.argv.includes("--plan")) {
  console.log("Initialize/start the dedicated native PostgreSQL database, run the unified core setup, and sync storefront settings.");
  if (process.argv.includes("--build")) console.log("Build the Medusa backend and Admin.");
  console.log("No changes made.");
  process.exit(0);
}
if (process.platform !== "win32") throw new Error("Native provisioning requires Windows. Use the Docker server launcher on Linux.");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 12)) throw new Error("Node.js 22.12 or newer is required.");
const require = createRequire(import.meta.url);
try { require.resolve("@medusajs/cli/cli.js"); }
catch { throw new Error("Dependencies are missing. Run npm ci first."); }
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
for (const relative of [".env", "apps/storefront/.env"]) {
  const file = path.join(root, relative);
  let contents = await readFile(file, "utf8");
  contents = setValue(contents, "STOREFRONT_URL", "http://localhost:8000");
  contents = setValue(contents, "HOMEPAGE_DEMO", "false");
  await writeFile(file, contents, { mode: 0o600 });
}
run(process.execPath, [path.join(root, "scripts/setup-store.mjs"), "--scope", "core"], { env });
if (process.argv.includes("--build")) run(process.execPath, [path.join(root, "scripts/build-medusa.mjs")], { cwd: medusa, env });
console.log("Native store configured. Run npm run dev:native and npm run dev:storefront in separate terminals.");
