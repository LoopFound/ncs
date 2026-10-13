import { env } from "../../env";
import { logger } from "../../logger";
import { redis } from "../../redis";

export type SmsKind = "otp" | "order";

/** Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX); returns null if invalid. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

export function maskPhone(phone: string) {
  return phone.replace(/^(\+\d{2})\d+(\d{3})$/, "$1•••••$2");
}

/**
 * Sends an SMS. In India, commercial SMS must use DLT-registered templates, so
 * MSG91 is driven by template IDs + variables rather than free text.
 */
export async function sendSms(to: string, kind: SmsKind, text: string, vars: Record<string, string> = {}) {
  const e = env();
  if (e.SMS_PROVIDER === "console") {
    logger.info({ to: maskPhone(to), kind, text }, "[dev sms]");
    // Console mode is refused for real deployments (see env.ts), so this only runs locally / in CI.
    if (kind === "otp" && vars.otp) {
      // Lets local e2e tests read the code without a real SMS gateway.
      await redis().set(`dev:last-otp:${to}`, vars.otp, "EX", 600);
    }
    return;
  }

  const templateId = kind === "otp" ? e.MSG91_OTP_TEMPLATE_ID : e.MSG91_ORDER_TEMPLATE_ID;
  if (!e.MSG91_AUTH_KEY || !templateId) throw new Error(`MSG91 is not configured for ${kind} SMS`);

  const res = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: { authkey: e.MSG91_AUTH_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [{ mobiles: to.replace(/^\+/, ""), ...vars }],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`MSG91 responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  logger.info({ to: maskPhone(to), kind }, "sms sent");
}
