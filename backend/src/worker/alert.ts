import { logger, errorInfo } from "@/server/logger";

export interface DeadJob {
  queue: string;
  name?: string;
  id?: string;
  attemptsMade: number;
  attempts: number;
  error: unknown;
}

/** True when a failed job has used its last attempt (BullMQ will not retry it). */
export function isFinalFailure(job: { attemptsMade: number; opts?: { attempts?: number } } | undefined): boolean {
  if (!job) return false;
  return job.attemptsMade >= (job.opts?.attempts ?? 1);
}

/**
 * Logs a permanently failed job under a distinct `event: "job_dead"` key (alert on this in
 * your log pipeline) and, when ALERT_WEBHOOK_URL is set, POSTs a Slack/Discord-style JSON
 * message. Never throws: alerting must not break the worker.
 */
export async function reportDeadJob(dead: DeadJob, fetchImpl: typeof fetch = fetch): Promise<void> {
  const info = errorInfo(dead.error);
  logger.error(
    { event: "job_dead", queue: dead.queue, job: dead.name, id: dead.id, attempts: dead.attemptsMade, ...info },
    "job exhausted all retries",
  );
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!url) return;
  const message = `NCS worker: job ${dead.name ?? "?"} (${dead.id ?? "?"}) on ${dead.queue} failed permanently after ${dead.attemptsMade}/${dead.attempts} attempts`;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: message, content: message }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) logger.warn({ status: res.status }, "alert webhook rejected the notification");
  } catch (err) {
    logger.warn(errorInfo(err), "could not deliver alert webhook");
  }
}
