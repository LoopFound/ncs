// Environment for the test run: a dedicated database and Redis DB so tests never touch dev data.
import { config } from "dotenv";

config({ quiet: true });

const devDb = process.env.DATABASE_URL ?? "postgresql://ncs:ncs@localhost:55432/ncs";
const devRedis = process.env.REDIS_URL ?? "redis://localhost:56379";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? devDb.replace(/\/[^/?]+(\?|$)/, "/ncs_test$1");
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? `${devRedis.replace(/\/\d+$/, "")}/15`;

export const testEnv: Record<string, string> = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3100",
  DATABASE_URL: TEST_DATABASE_URL,
  DATABASE_POOL_MAX: "5",
  REDIS_URL: TEST_REDIS_URL,
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123456789",
  // Secrets only — no key id, so online payment stays "unconfigured" and nothing calls Razorpay.
  RAZORPAY_KEY_ID: "",
  RAZORPAY_KEY_SECRET: "test_key_secret",
  RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
  S3_BUCKET: "ncs-media",
  S3_PRIVATE_BUCKET: "ncs-private",
  S3_PUBLIC_URL: "http://localhost:58333/ncs-media",
  SMTP_HOST: "localhost",
  EMAIL_FROM: "NCS Test <test@example.com>",
  SMS_PROVIDER: "console",
  LOG_LEVEL: "silent",
};
