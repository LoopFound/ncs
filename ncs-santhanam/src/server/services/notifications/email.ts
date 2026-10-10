import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../env";
import { logger } from "../../logger";
import type { EmailTemplate } from "../../queue";
import { formatINR } from "@/lib/money";

let transport: Transporter | undefined;

function mailer(): Transporter {
  if (transport) return transport;
  const e = env();
  transport = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: e.SMTP_USER && e.SMTP_PASS ? { user: e.SMTP_USER, pass: e.SMTP_PASS } : undefined,
    pool: true,
    maxConnections: 5,
  });
  return transport;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F5F1E8;font-family:Georgia,'Times New Roman',serif;color:#0B1B4D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e6dfcf">
<tr><td style="background:#0B1B4D;padding:20px 28px;color:#E5C158;font-size:22px;letter-spacing:1px">NCS Santhanam</td></tr>
<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333">
<h1 style="font-family:Georgia,serif;font-weight:normal;color:#0B1B4D;font-size:24px;margin:0 0 16px">${esc(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 28px;background:#FAF7F0;font-family:Arial,sans-serif;font-size:12px;color:#666">
NCS Santhanam Silks · Kancheepuram, Tamil Nadu</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#0B1B4D;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;letter-spacing:1px;font-size:13px;text-transform:uppercase">${esc(label)}</a></p>`;

interface OrderEmailData {
  number: string;
  name: string;
  url: string;
  grandTotal: number;
  paymentMethod: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  carrier?: string;
  awb?: string;
  trackingUrl?: string | null;
  reason?: string | null;
}

function itemsTable(items: OrderEmailData["items"], grandTotal: number) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.quantity}</td><td align="right" style="padding:6px 0">${formatINR(i.lineTotal)}</td></tr>`,
    )
    .join("");
  return `<table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0">${rows}
<tr><td style="padding:8px 0;font-weight:bold">Total (incl. GST)</td><td align="right" style="padding:8px 0;font-weight:bold">${formatINR(grandTotal)}</td></tr></table>`;
}

export function renderEmail(template: EmailTemplate, data: Record<string, unknown>): RenderedEmail {
  switch (template) {
    case "verify-email": {
      const url = String(data.url);
      return {
        subject: "Verify your email — NCS Santhanam",
        html: layout("Confirm your email", `<p>Welcome to NCS Santhanam. Please confirm your email address to finish creating your account.</p>${button(url, "Verify email")}<p style="font-size:12px;color:#666">If you didn't create an account, you can ignore this email.</p>`),
        text: `Confirm your email for NCS Santhanam: ${url}`,
      };
    }
    case "reset-password": {
      const url = String(data.url);
      return {
        subject: "Reset your password — NCS Santhanam",
        html: layout("Reset your password", `<p>We received a request to reset your password. This link expires in 1 hour.</p>${button(url, "Choose a new password")}<p style="font-size:12px;color:#666">If you didn't request this, no action is needed.</p>`),
        text: `Reset your NCS Santhanam password: ${url}`,
      };
    }
    case "order-confirmation": {
      const d = data as unknown as OrderEmailData;
      const pay = d.paymentMethod === "COD" ? "Cash on delivery — please keep the amount ready." : "Payment received.";
      return {
        subject: `Order ${d.number} confirmed — NCS Santhanam`,
        html: layout(`Thank you, ${d.name}`, `<p>Your order <strong>${esc(d.number)}</strong> is confirmed. ${pay}</p>${itemsTable(d.items, d.grandTotal)}${button(d.url, "View your order")}`),
        text: `Order ${d.number} confirmed. Total ${formatINR(d.grandTotal)}. ${d.url}`,
      };
    }
    case "order-shipped": {
      const d = data as unknown as OrderEmailData;
      const track = d.trackingUrl ? button(d.trackingUrl, "Track shipment") : "";
      return {
        subject: `Order ${d.number} has shipped`,
        html: layout("Your order is on its way", `<p>Order <strong>${esc(d.number)}</strong> has been dispatched via ${esc(d.carrier)} (AWB ${esc(d.awb)}).</p>${track}${button(d.url, "View your order")}`),
        text: `Order ${d.number} shipped via ${d.carrier}, AWB ${d.awb}. ${d.trackingUrl ?? d.url}`,
      };
    }
    case "order-delivered": {
      const d = data as unknown as OrderEmailData;
      return {
        subject: `Order ${d.number} delivered`,
        html: layout("Delivered with care", `<p>Order <strong>${esc(d.number)}</strong> has been delivered. We hope your weave brings you joy — we'd love to hear what you think.</p>${button(d.url, "Review your purchase")}`),
        text: `Order ${d.number} delivered. ${d.url}`,
      };
    }
    case "order-cancelled": {
      const d = data as unknown as OrderEmailData;
      return {
        subject: `Order ${d.number} cancelled`,
        html: layout("Order cancelled", `<p>Order <strong>${esc(d.number)}</strong> has been cancelled.${d.reason ? ` Reason: ${esc(d.reason)}.` : ""} Any amount paid online will be refunded to the original payment method within 5–7 business days.</p>${button(d.url, "View order")}`),
        text: `Order ${d.number} cancelled. ${d.url}`,
      };
    }
    case "newsletter-confirm": {
      const url = String(data.url);
      return {
        subject: "Confirm your subscription — The Silk Circle",
        html: layout("One more step", `<p>Please confirm you'd like to receive previews of new weaves and showroom invitations from NCS Santhanam.</p>${button(url, "Confirm subscription")}`),
        text: `Confirm your subscription: ${url}`,
      };
    }
    case "contact-received": {
      return {
        subject: "We've received your message — NCS Santhanam",
        html: layout("Thank you for writing to us", `<p>Dear ${esc(data.name)}, our concierge team has received your message and will reply within one business day.</p><blockquote style="border-left:3px solid #C9A227;margin:16px 0;padding-left:12px;color:#555">${esc(data.subject)}</blockquote>`),
        text: `We've received your message: ${String(data.subject)}`,
      };
    }
  }
}

export async function sendEmail(to: string, rendered: RenderedEmail) {
  const info = await mailer().sendMail({ from: env().EMAIL_FROM, to, ...rendered });
  logger.info({ to: to.replace(/(.{2}).*(@.*)/, "$1***$2"), messageId: info.messageId, subject: rendered.subject }, "email sent");
}
