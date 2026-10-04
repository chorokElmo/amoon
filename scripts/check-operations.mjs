import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const config = path.join(root, ".local/config");
await mkdir(config, { recursive: true });
const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("@medusajs/cli/cli.js"), "exec", "./src/scripts/check-operations.ts"], {
  cwd: path.join(root, "apps/medusa"),
  env: { ...process.env, NODE_ENV: "development", XDG_CONFIG_HOME: config, MEDUSA_DISABLE_TELEMETRY: "true" },
  stdio: "inherit", windowsHide: true,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
