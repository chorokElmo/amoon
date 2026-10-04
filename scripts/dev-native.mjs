import { spawn } from "node:child_process";
import { mkdir, readFile, access, lstat, realpath, readdir, rmdir, symlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const config = path.join(root, ".local/config");
await mkdir(config, { recursive: true });
const require = createRequire(import.meta.url);
const backend = path.join(root, "apps/medusa");
await access(path.join(backend, ".medusa/server/public/admin/index.html"));
const persistentUploads = path.resolve(backend, "static");
const servedUploads = path.resolve(backend, ".medusa/server/static");
for (const target of [persistentUploads, servedUploads]) if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error("Upload path is outside the project");
await mkdir(persistentUploads, { recursive: true });
let linked = false;
try {
  const info = await lstat(servedUploads);
  if (info.isSymbolicLink()) {
    if (await realpath(servedUploads) !== await realpath(persistentUploads)) throw new Error("Unexpected upload link; review it before starting.");
    linked = true;
  } else {
    if ((await readdir(servedUploads)).length) throw new Error("Existing compiled-folder uploads need moving into apps/medusa/static before restart; no files removed.");
    await rmdir(servedUploads);
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }
if (!linked) await symlink(persistentUploads, servedUploads, process.platform === "win32" ? "junction" : "dir");
const environment = require("dotenv").parse(await readFile(path.join(backend, ".env")));
// Serve the compiled Admin locally; avoid the development dependency optimizer.
const child = spawn(process.execPath, [require.resolve("@medusajs/cli/cli.js"), "start", "--host", "127.0.0.1", "--port", "9001"], {
  cwd: path.join(backend, ".medusa/server"), windowsHide: true, stdio: "inherit",
  env: { ...process.env, ...environment, NODE_ENV: "local", MEDUSA_LOCAL_INFRASTRUCTURE: "true", MEDUSA_WORKER_MODE: "shared", MEDUSA_DISABLE_TELEMETRY: "true", XDG_CONFIG_HOME: config }
});
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
