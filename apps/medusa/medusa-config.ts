import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required configuration: ${name}`);
  return value;
}

function secret(name: string): string {
  const value = required(name);
  if (value.length < 32) throw new Error(`${name} must contain at least 32 characters`);
  return value;
}

const workerMode = process.env.MEDUSA_WORKER_MODE || "shared";
if (!["shared", "server", "worker"].includes(workerMode)) throw new Error("Invalid MEDUSA_WORKER_MODE");
const localInfrastructure = process.env.MEDUSA_LOCAL_INFRASTRUCTURE === "true";
if (localInfrastructure && (process.env.NODE_ENV === "production" || workerMode === "worker")) {
  throw new Error("Local infrastructure is development-only and cannot run a separate worker");
}
const redisUrl = localInfrastructure ? undefined : required("REDIS_URL");

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: required("DATABASE_URL"),
    redisUrl,
    workerMode: workerMode as "shared" | "server" | "worker",
    http: {
      storeCors: required("STORE_CORS"), adminCors: required("ADMIN_CORS"), authCors: required("AUTH_CORS"),
      jwtSecret: secret("JWT_SECRET"), cookieSecret: secret("COOKIE_SECRET")
    }
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    // Bundled Admin follows its own origin, so moving servers cannot retain localhost.
    backendUrl: process.env.MEDUSA_ADMIN_BACKEND_URL || "/",
    maxUploadFileSize: 10 * 1024 * 1024
  },
  modules: localInfrastructure ? [
    { resolve: "@medusajs/medusa/fulfillment", options: { providers: [{ resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" }] } },
    { resolve: "@medusajs/medusa/caching", options: { in_memory: { enable: true } } },
    { resolve: "@medusajs/medusa/event-bus-local" },
    { resolve: "@medusajs/medusa/workflow-engine-inmemory" },
    { resolve: "@medusajs/medusa/file", options: { providers: [{ resolve: "@medusajs/medusa/file-local", id: "local", options: { backend_url: "http://localhost:9001/static" } }] } }
  ] : [
    { resolve: "@medusajs/medusa/file", options: { providers: [{ resolve: "@medusajs/medusa/file-local", id: "local", options: { backend_url: required("MEDUSA_BACKEND_URL").replace(/\/$/, "") + "/static" } }] } },
    { resolve: "@medusajs/medusa/fulfillment", options: { providers: [{ resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" }] } },
    { resolve: "@medusajs/medusa/caching", options: { providers: [{ resolve: "@medusajs/caching-redis", id: "caching-redis", is_default: true, options: { redisUrl } }] } },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
    { resolve: "@medusajs/medusa/locking", options: { providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } }] } }
  ]
});
