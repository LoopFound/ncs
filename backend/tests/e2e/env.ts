import { config } from "dotenv";

config({ quiet: true });

const devDb = process.env.DATABASE_URL ?? "postgresql://ncs:ncs@localhost:55432/ncs";
const devRedis = (process.env.REDIS_URL ?? "redis://localhost:56379").replace(/\/\d+$/, "");

export const E2E_PORT = Number(process.env.E2E_PORT ?? 3200);
export const E2E_BASE = `http://localhost:${E2E_PORT}`;
export const MAILPIT_API = process.env.MAILPIT_API ?? "http://localhost:58025/api/v1";
export const ADMIN = { email: "e2e-admin@ncs.local", name: "E2E Admin", password: "e2e-Admin-Pass-2026!" };

/** Environment for the app + worker under test: isolated database and Redis DB. */
export const e2eEnv: Record<string, string> = {
  NODE_ENV: "production",
  PORT: String(E2E_PORT),
  HOSTNAME: "localhost",
  APP_URL: E2E_BASE,
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? devDb.replace(/\/[^/?]+(\?|$)/, "/ncs_e2e$1"),
  REDIS_URL: process.env.E2E_REDIS_URL ?? `${devRedis}/14`,
  SMS_PROVIDER: "console",
  ADMIN_EMAILS: "",
  WORKER_HEALTH_PORT: "3201",
  LOG_LEVEL: "warn",
};
