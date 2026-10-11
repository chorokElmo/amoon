import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prepareLocal, setValue } from "./prepare-local.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = path.join(root, "apps/medusa");
const scopes = ["all", "core", "catalog", "checkout", "fashion"];

export function parseOptions(args) {
  const options = { docker: false, plan: false, preview: false, skipMigrations: false, scope: "all" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scope") options.scope = args[++i];
    else if (args[i] === "--docker") options.docker = true;
    else if (args[i] === "--plan") options.plan = true;
    else if (args[i] === "--preview") options.preview = true;
    else if (args[i] === "--skip-migrations") options.skipMigrations = true;
    else throw new Error("Unknown setup argument: " + args[i]);
  }
  if (!scopes.includes(options.scope)) throw new Error("Choose --scope all, core, catalog, checkout or fashion.");
  return options;
}

function run(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: root, windowsHide: true, encoding: "utf8", stdio: "inherit", ...options });
  if (result.error || result.status !== 0) throw new Error("Setup command failed. Fix the reported error and rerun; earlier steps may have completed.");
  return result.stdout || "";
}

export async function syncConnectionValues(catalog, backendUrl, workspace = root) {
  if (!/^pk_[a-zA-Z0-9]+$/.test(catalog.publishable_key || "") ||
      !/^reg_[a-zA-Z0-9]+$/.test(catalog.region_id || "") ||
      !/^sc_[a-zA-Z0-9]+$/.test(catalog.sales_channel_id || "")) {
    throw new Error("Invalid catalog output; storefront environment was not updated.");
  }
  const values = {
    MEDUSA_PUBLISHABLE_KEY: catalog.publishable_key,
    MEDUSA_REGION_ID: catalog.region_id,
    MEDUSA_SALES_CHANNEL_ID: catalog.sales_channel_id,
    ...(backendUrl ? { MEDUSA_INTERNAL_URL: new URL(backendUrl).origin } : {}),
  };
  for (const relative of [".env", "apps/storefront/.env"]) {
    const file = path.join(workspace, relative);
    let contents = await readFile(file, "utf8");
    for (const [key, value] of Object.entries(values)) contents = setValue(contents, key, value);
    await writeFile(file, contents, { mode: 0o600 });
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  if (options.plan) {
    console.log("Setup scope: " + options.scope + " (all = Morocco/MAD, channel/key, shipping/COD and fashion taxonomy).");
    console.log(options.docker ? "Use Docker; build/start the backend unless previewing." : "Use the host Medusa application and its existing local database.");
    console.log(options.preview ? "Preview only; no migrations, database writes or env updates." : "Run the unified Medusa setup and sync connection values (except fashion-only).");
    console.log("No changes made.");
    return;
  }
  const scriptArgs = [options.scope, ...(options.preview ? ["preview"] : [])];
  if (options.docker) {
    const docker = (args, capture = false) => run("docker", ["compose", ...args], capture ? { stdio: "pipe", maxBuffer: 2 * 1024 * 1024 } : {});
    if (!options.preview) {
      await prepareLocal();
      // Compose's migrate dependency applies migrations before starting the API.
      docker(["up", "-d", "--build", "--wait", "--wait-timeout", "180", "medusa", "worker"]);
    }
    docker(["exec", "-T", "-e", "MEDUSA_WORKER_MODE=shared", "medusa", "node", "node_modules/@medusajs/cli/cli.js", "exec", "./src/scripts/setup-store.js", ...scriptArgs]);
    if (options.preview || options.scope === "fashion") return;
    const catalog = JSON.parse(docker(["exec", "-T", "medusa", "node", "-p", "JSON.stringify(require('./.catalog-setup.json'))"], true));
    await syncConnectionValues(catalog);
    console.log("Connection values saved. Restart a host storefront, or recreate its container to load the new environment.");
    return;
  }

  const require = createRequire(import.meta.url);
  let cli;
  try { cli = require.resolve("@medusajs/cli/cli.js"); }
  catch { throw new Error("Dependencies are missing. Run npm ci, or use the Docker PowerShell/server launcher."); }
  if (!options.preview) await prepareLocal();
  const settings = require("dotenv").parse(await readFile(path.join(backend, ".env")));
  for (const name of ["DATABASE_URL", "MEDUSA_BACKEND_URL"]) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(settings[name]).hostname)) {
      throw new Error("Host setup is for localhost: " + name + " must be local. Use scripts/server.sh setup on the server.");
    }
  }
  const config = path.join(root, ".local/config");
  await mkdir(config, { recursive: true });
  const env = { ...process.env, ...settings, NODE_ENV: "development", MEDUSA_WORKER_MODE: "shared", XDG_CONFIG_HOME: config, MEDUSA_DISABLE_TELEMETRY: "true" };
  if (!options.skipMigrations && !options.preview) run(process.execPath, [cli, "db:migrate"], { cwd: backend, env });
  run(process.execPath, [cli, "exec", "./src/scripts/setup-store.ts", ...scriptArgs], { cwd: backend, env });
  if (options.preview || options.scope === "fashion") return;
  await syncConnectionValues(JSON.parse(await readFile(path.join(backend, ".catalog-setup.json"), "utf8")), settings.MEDUSA_BACKEND_URL);
  console.log("Store configuration and storefront connection values saved. Restart the storefront to load them.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
