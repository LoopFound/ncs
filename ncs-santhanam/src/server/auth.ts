import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, phoneNumber } from "better-auth/plugins";
import { db } from "./db";
import { env, features } from "./env";
import { redis } from "./redis";
import { enqueue } from "./queue";
import { normalizeIndianMobile, sendSms } from "./services/notifications/sms";

/** Placeholder email domain for accounts created via phone OTP (never emailed). */
export const PHONE_EMAIL_DOMAIN = "phone.ncsanthanam.invalid";

export const isPlaceholderEmail = (email: string) => email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);

function createAuth() {
  const e = env();
  const adminEmails = new Set(
    (e.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  return betterAuth({
    appName: "NCS Santhanam",
    baseURL: e.APP_URL,
    secret: e.BETTER_AUTH_SECRET,
    trustedOrigins: [e.APP_URL],
    database: prismaAdapter(db, { provider: "postgresql" }),

    // Redis is a shared cache for sessions + rate-limit counters across replicas;
    // sessions are also persisted in Postgres so a Redis flush never logs users out.
    secondaryStorage: {
      get: (key) => redis().get(`auth:${key}`),
      getAndDelete: (key) => redis().getdel(`auth:${key}`),
      increment: async (key, ttl) => {
        const [[, n]] = (await redis().multi().incr(`auth:${key}`).expire(`auth:${key}`, ttl).exec()) as [[null, number]];
        return n;
      },
      set: async (key, value, ttl) => {
        if (ttl) await redis().set(`auth:${key}`, value, "EX", ttl);
        else await redis().set(`auth:${key}`, value);
      },
      delete: async (key) => {
        await redis().del(`auth:${key}`);
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      storeSessionInDatabase: true,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },

    rateLimit: {
      enabled: true,
      storage: "secondary-storage",
      window: 60,
      max: 120,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/phone-number/send-otp": { window: 60, max: 3 },
        "/phone-number/verify": { window: 60, max: 10 },
      },
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await enqueue("email.send", { to: user.email, template: "reset-password", data: { url } });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (isPlaceholderEmail(user.email)) return;
        await enqueue("email.send", { to: user.email, template: "verify-email", data: { url } });
      },
    },

    socialProviders: features.google()
      ? { google: { clientId: e.GOOGLE_CLIENT_ID!, clientSecret: e.GOOGLE_CLIENT_SECRET!, prompt: "select_account" } }
      : {},

    account: {
      accountLinking: { enabled: true, trustedProviders: ["google", "email-password"] },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, role: adminEmails.has(user.email.toLowerCase()) ? "admin" : "user" },
          }),
        },
      },
    },

    advanced: {
      useSecureCookies: e.NODE_ENV === "production",
      cookiePrefix: "ncs",
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },

    plugins: [
      phoneNumber({
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 5,
        phoneNumberValidator: (p) => normalizeIndianMobile(p) === p,
        sendOTP: async ({ phoneNumber: to, code }) => {
          // Sent inline (not queued) so the customer gets the code immediately.
          await sendSms(to, "otp", `${code} is your NCS Santhanam verification code. It expires in 5 minutes.`, {
            otp: code,
          });
        },
        signUpOnVerification: {
          getTempEmail: (p) => `${p.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`,
          getTempName: () => "Silk Circle Member",
        },
      }),
      admin({ adminRoles: ["admin"], defaultRole: "user" }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { __ncsAuth?: Auth };

/** Lazily constructed so builds without secrets can still import route modules. */
export function getAuth(): Auth {
  if (!globalForAuth.__ncsAuth) globalForAuth.__ncsAuth = createAuth();
  return globalForAuth.__ncsAuth;
}
