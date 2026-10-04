import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, readdir, lstat, cp } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const settings = require("dotenv").parse(await readFile(path.join(root, "apps/medusa/.env")));
const db = new URL(settings.DATABASE_URL);
if (db.hostname !== "127.0.0.1" || db.port !== "5434" || db.pathname !== "/amoon") throw new Error("This runner only backs up the dedicated native Amoon database.");
const pgBin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
const pgArgs = ["-h", db.hostname, "-p", db.port, "-U", decodeURIComponent(db.username), "--no-password"];
function run(binary, args) {
  const result = spawnSync(path.join(pgBin, binary + (process.platform === "win32" ? ".exe" : "")), args, {
    windowsHide: true, encoding: "utf8", stdio: "pipe", maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, PGPASSWORD: decodeURIComponent(db.password) },
  });
  // Do not print command args, database credentials or database contents on failure.
  if (result.error || result.status !== 0) throw new Error(binary + " failed; backup/restore is not verified.");
  return result.stdout;
}
const countsSql = 'SELECT json_build_object(\'orders\', (SELECT count(*) FROM "order"), \'products\', (SELECT count(*) FROM product))::text';
const counts = database => JSON.parse(run("psql", [...pgArgs, "-d", database, "-At", "-v", "ON_ERROR_STOP=1", "-c", countsSql]).trim());
const target = path.resolve(root, ".local/backups", new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomBytes(4).toString("hex"));
if (!target.startsWith(path.resolve(root, ".local/backups") + path.sep)) throw new Error("Backup path outside local backups.");
await mkdir(target, { recursive: true });
const dump = path.join(target, "database.dump");
const expected = counts("amoon");
run("pg_dump", [...pgArgs, "-d", "amoon", "--format=custom", "--no-owner", "--no-privileges", "--file", dump]);
run("pg_restore", ["--list", dump]);
const media = path.join(root, "apps/medusa/static");
async function rejectLinks(directory) {
  if ((await lstat(directory)).isSymbolicLink()) throw new Error("Review media links before backup.");
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error("Review media links before backup.");
    if (entry.isDirectory()) await rejectLinks(path.join(directory, entry.name));
  }
}
await rejectLinks(media);
await cp(media, path.join(target, "media"), { recursive: true, errorOnExist: true, force: false });
const manifest = { source: "native-amoon", createdAt: new Date().toISOString(), expectedCounts: expected,
  sha256: createHash("sha256").update(await readFile(dump)).digest("hex"), archiveReadable: true, mediaCopied: true, restoreVerified: false };
if (process.argv.includes("--verify-restore")) {
  const restored = "amoon_restore_" + randomBytes(8).toString("hex");
  run("createdb", [...pgArgs, "--template=template0", restored]);
  run("pg_restore", [...pgArgs, "--dbname", restored, "--exit-on-error", "--single-transaction", "--no-owner", "--no-privileges", dump]);
  const actual = counts(restored);
  if (actual.orders !== expected.orders || actual.products !== expected.products) throw new Error("Restored counts differ; live writes may have occurred. Isolated database retained for review.");
  manifest.restoreVerified = true;
  manifest.restoreDatabase = restored;
  console.log("Isolated restore passed; order/product counts match. No app is connected to the restored database.");
}
await writeFile(path.join(target, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
console.log("Backup saved in " + target + ". Keep this private; it contains actual store data.");
