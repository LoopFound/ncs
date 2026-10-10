import { Queue, type JobsOptions } from "bullmq";
import { createQueueConnection } from "./redis";

/** Every background job the worker understands, with its payload. */
export interface JobPayloads {
  "email.send": { to: string; template: EmailTemplate; data: Record<string, unknown> };
  "sms.send": { to: string; kind: "order"; text: string; vars?: Record<string, string> };
  "order.placed": { orderId: string };
  "order.expire": { orderId: string };
  "order.status-changed": { orderId: string; status: string };
  "invoice.generate": { orderId: string };
  "maintenance.cleanup": Record<string, never>;
}

export type JobName = keyof JobPayloads;

export type EmailTemplate =
  | "verify-email"
  | "reset-password"
  | "order-confirmation"
  | "order-shipped"
  | "order-delivered"
  | "order-cancelled"
  | "newsletter-confirm"
  | "contact-received";

export const QUEUE_NAMES = {
  notifications: "ncs-notifications",
  orders: "ncs-orders",
} as const;

const queueFor: Record<JobName, keyof typeof QUEUE_NAMES> = {
  "email.send": "notifications",
  "sms.send": "notifications",
  "order.placed": "orders",
  "order.expire": "orders",
  "order.status-changed": "orders",
  "invoice.generate": "orders",
  "maintenance.cleanup": "orders",
};

const defaults: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 10_000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

const globalForQueues = globalThis as unknown as { __ncsQueues?: Map<string, Queue> };

function queue(name: keyof typeof QUEUE_NAMES): Queue {
  globalForQueues.__ncsQueues ??= new Map();
  let q = globalForQueues.__ncsQueues.get(name);
  if (!q) {
    q = new Queue(QUEUE_NAMES[name], { connection: createQueueConnection(), defaultJobOptions: defaults });
    globalForQueues.__ncsQueues.set(name, q);
  }
  return q;
}

export async function enqueue<N extends JobName>(name: N, payload: JobPayloads[N], opts?: JobsOptions) {
  return queue(queueFor[name]).add(name, payload, opts);
}

export async function closeQueues() {
  await Promise.all([...(globalForQueues.__ncsQueues?.values() ?? [])].map((q) => q.close()));
  globalForQueues.__ncsQueues?.clear();
}
