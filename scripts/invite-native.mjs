import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const email = process.argv[2];
if (!email || !/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(email)) throw new Error("Provide the owner email as the command argument.");
const root = fileURLToPath(new URL("../", import.meta.url));
const local = path.join(root, ".local");
await mkdir(path.join(local, "config"), { recursive: true });
const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("@medusajs/cli/cli.js"), "user", "--email", email, "--invite"], {
  cwd: path.join(root, "apps/medusa"), windowsHide: true, encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  env: { ...process.env, NODE_ENV: "development", MEDUSA_LOCAL_INFRASTRUCTURE: "true", MEDUSA_WORKER_MODE: "shared", MEDUSA_DISABLE_TELEMETRY: "true", XDG_CONFIG_HOME: path.join(local, "config") }
});
if (result.error || result.status !== 0) throw new Error("Admin invitation failed. Review existing invitations in Medusa before retrying.");
const token = result.stdout.match(/Invite token:\s*([A-Za-z0-9_.-]+)/)?.[1];
if (!token) throw new Error("No invitation token returned; no invitation file written.");
const href = "http://localhost:9001/app/invite?token=" + encodeURIComponent(token);
await writeFile(path.join(local, "admin-invite.html"), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Amoon admin invitation</title><body><h1>Your Amoon admin invitation</h1><p>Open the local Medusa invitation to choose your password. This private link expires and has not been emailed.</p><a href="' + href + '">Create your admin account</a></body></html>', { mode: 0o600 });
console.log("Private admin invitation saved to .local/admin-invite.html. No email sent and no password created.");
