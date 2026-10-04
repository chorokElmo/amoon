import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Compilation needs configuration, but no database connection or real secrets.
// Values below exist only in the child build process and are never persisted.
const require = createRequire(import.meta.url);
const cli = require.resolve("@medusajs/cli/cli.js");
const buildConfig = process.env.XDG_CONFIG_HOME || path.resolve(".local/config");
mkdirSync(buildConfig, { recursive: true });
const result = spawnSync(process.execPath, [cli, "build"], {
  stdio: "inherit",
  windowsHide: true,
  env: {
    DATABASE_URL: "postgres://build:build@localhost/build",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "build-only-unused-secret-000000000000",
    COOKIE_SECRET: "build-only-unused-secret-111111111111",
    STORE_CORS: "http://localhost:8000",
    ADMIN_CORS: "http://localhost:9000",
    AUTH_CORS: "http://localhost:8000,http://localhost:9000",
    ...process.env,
    XDG_CONFIG_HOME: buildConfig,
    MEDUSA_DISABLE_TELEMETRY: "true",
  },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
