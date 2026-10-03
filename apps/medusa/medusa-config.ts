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
const redisUrl = required("REDIS_URL");

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
  admin: { disable: process.env.DISABLE_MEDUSA_ADMIN === "true", backendUrl: process.env.MEDUSA_BACKEND_URL },
  modules: [
    { resolve: "@medusajs/medusa/caching", options: { providers: [{ resolve: "@medusajs/caching-redis", id: "caching-redis", is_default: true, options: { redisUrl } }] } },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
    { resolve: "@medusajs/medusa/locking", options: { providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } }] } }
  ]
});
