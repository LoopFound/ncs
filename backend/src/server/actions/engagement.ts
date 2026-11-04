"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { contactSchema } from "@/lib/validation";
import { db } from "../db";
import { env } from "../env";
import { enqueue } from "../queue";
import { rateLimit, RateLimitError } from "../rate-limit";
import { clientIp } from "../request";
import { getCurrentUser } from "../session";
import { run, type ActionResult } from "./result";

async function limitByIp(bucket: string, limit: number, windowSeconds: number) {
  const rl = await rateLimit(bucket, clientIp(await headers()), limit, windowSeconds);
  if (!rl.ok) throw new RateLimitError("Too many requests. Please try again a little later.", rl.retryAfterSeconds);
}

export async function submitContactAction(input: unknown): Promise<ActionResult> {
  return run("contact.submit", async () => {
    await limitByIp("contact", 5, 3600);
    // Honeypot filled in: pretend success so bots learn nothing, and store/send nothing.
    const website = (input as { website?: unknown } | null)?.website;
    if (typeof website === "string" && website.trim() !== "") return undefined;
    const c = contactSchema.parse(input);
    const user = await getCurrentUser();
    await db.contactMessage.create({
      data: { name: c.name, email: c.email, phone: c.phone || null, subject: c.subject, message: c.message, userId: user?.id ?? null },
    });
    await enqueue("email.send", { to: c.email, template: "contact-received", data: { name: c.name, subject: c.subject } });
    return undefined;
  });
}

/** Double opt-in: stores a pending subscriber and emails a confirmation link. */
export async function subscribeNewsletterAction(email: string): Promise<ActionResult> {
  return run("newsletter.subscribe", async () => {
    await limitByIp("newsletter", 5, 3600);
    const address = z.email("Enter a valid email").parse(email.trim().toLowerCase());
    const existing = await db.newsletterSubscriber.findUnique({ where: { email: address } });
    if (existing?.status === "CONFIRMED") return undefined; // don't reveal membership
    const token = randomBytes(24).toString("base64url");
    await db.newsletterSubscriber.upsert({
      where: { email: address },
      create: { email: address, token },
      update: { token, status: "PENDING" },
    });
    await enqueue("email.send", {
      to: address,
      template: "newsletter-confirm",
      data: { url: `${env().APP_URL}/newsletter/confirm?token=${token}` },
    });
    return undefined;
  });
}
