import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]).default("info"),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().min(1),

  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  ADMIN_EMAILS: optional,

  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,

  S3_ENDPOINT: optional,
  S3_REGION: z.string().default("ap-south-1"),
  S3_BUCKET: z.string().min(1),
  S3_PRIVATE_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_FORCE_PATH_STYLE: bool,
  S3_PUBLIC_URL: z.url(),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: optional,
  SMTP_PASS: optional,
  EMAIL_FROM: z.string().min(3),

  SMS_PROVIDER: z.enum(["console", "msg91"]).default("console"),
  MSG91_AUTH_KEY: optional,
  MSG91_SENDER_ID: optional,
  MSG91_OTP_TEMPLATE_ID: optional,
  MSG91_ORDER_TEMPLATE_ID: optional,

  SENTRY_DSN: optional,
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Validated environment. Parsed lazily so `next build` (which has no secrets)
 * can import server modules; the server calls it at startup via instrumentation.ts.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const e = parsed.data;
  // Production builds run locally (e2e, smoke tests) may use dev-only providers.
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(e.APP_URL);
  if (e.NODE_ENV === "production" && !isLocalhost) {
    if (e.SMS_PROVIDER === "console") {
      throw new Error("SMS_PROVIDER=console is not allowed in production");
    }
    if (e.APP_URL.startsWith("http://")) {
      throw new Error("APP_URL must use https in production");
    }
  }
  cached = e;
  return e;
}

export const features = {
  razorpay: () => Boolean(env().RAZORPAY_KEY_ID && env().RAZORPAY_KEY_SECRET),
  google: () => Boolean(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET),
};
