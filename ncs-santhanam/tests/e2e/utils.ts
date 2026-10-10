import { expect, type Page } from "@playwright/test";
import { Redis } from "ioredis";
import { ADMIN, e2eEnv, MAILPIT_API } from "./env";

/** Polls Mailpit for the newest email to `to` and returns its text body. */
export async function waitForEmail(to: string, subjectIncludes: string, timeoutMs = 30_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_API}/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    if (res.ok) {
      const data = (await res.json()) as { messages: { ID: string; Subject: string }[] };
      const hit = data.messages.find((m) => m.Subject.includes(subjectIncludes));
      if (hit) {
        const msg = (await (await fetch(`${MAILPIT_API}/message/${hit.ID}`)).json()) as { Text: string; HTML: string };
        return `${msg.Text}\n${msg.HTML}`;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No "${subjectIncludes}" email for ${to} within ${timeoutMs}ms`);
}

export function firstLink(body: string, contains: string): string {
  const match = body.match(new RegExp(`https?://[^\\s"'<>]*${contains}[^\\s"'<>]*`));
  if (!match) throw new Error(`No link containing ${contains}`);
  return match[0].replace(/&amp;/g, "&");
}

/** Reads the OTP the console SMS provider stored for this number (dev/test only). */
export async function readOtp(phoneE164: string): Promise<string> {
  const redis = new Redis(e2eEnv.REDIS_URL);
  try {
    for (let i = 0; i < 40; i++) {
      const code = await redis.get(`dev:last-otp:${phoneE164}`);
      if (code) return code;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`No OTP for ${phoneE164}`);
  } finally {
    await redis.quit();
  }
}

export async function signInWithEmail(page: Page, email: string, password: string, next = "/account") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[/?]/g, "\\$&")));
}

export const signInAsAdmin = (page: Page) => signInWithEmail(page, ADMIN.email, ADMIN.password, "/admin");
