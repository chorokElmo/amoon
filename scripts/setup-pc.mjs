import { access, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const steps = [
  ["Configure PostgreSQL, migrations, Morocco/MAD and the storefront connection", ["scripts/setup-native.mjs"]],
  ["Configure free Morocco delivery and cash on delivery", ["scripts/configure-checkout.mjs"]],
  ["Build the Medusa backend and Admin", ["node_modules/@medusajs/cli/cli.js", "build"]],
];
if (process.argv.includes("--plan")) {
  for (const [label] of steps) console.log(label);
  console.log("No changes made. Install dependencies with npm ci before setup.");
} else {
  if (process.platform !== "win32") throw new Error("Use docs/new-server.md for Linux production installation.");
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error("Node.js 22.12 or newer is required.");
  try { await access(path.join(root, "node_modules/@medusajs/cli/cli.js")); }
  catch { throw new Error("Dependencies are missing. Run npm ci in the project folder first."); }
  const pgBin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
  try { await access(path.join(pgBin, "initdb.exe")); }
  catch { throw new Error("Install PostgreSQL 18, or set PG_BIN to the PostgreSQL bin directory."); }
  const config = path.join(root, ".local/config");
  await mkdir(config, { recursive:true });
  const env = { ...process.env, MEDUSA_LOCAL_INFRASTRUCTURE:"true", MEDUSA_WORKER_MODE:"shared", MEDUSA_DISABLE_TELEMETRY:"true", XDG_CONFIG_HOME:config };
  for (const [label, args] of steps) {
    console.log(label);
    const build = args[1] === "build";
    const command = build ? [path.join(root, args[0]), "build"] : [path.join(root,args[0])];
    const result = spawnSync(process.execPath, command, {cwd:build ? path.join(root,"apps/medusa") : root, env, stdio:"inherit", windowsHide:true});
    if (result.error || result.status !== 0) throw new Error("Setup stopped at: " + label + ". Fix the reported error before restarting setup.");
  }
  console.log("Setup complete. Run npm run dev:native and npm run dev:storefront in separate terminals.");
  console.log("An empty database has no products or admin account. See docs/new-pc.md for invitations and store transfer.");
}
