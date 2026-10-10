"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [phoneNumberClient(), adminClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;

/** Client-side mirror of normalizeIndianMobile (kept dependency-free for the browser). */
export function toE164India(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}
