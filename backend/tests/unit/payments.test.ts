import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  webhookEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  markRazorpayPaid: vi.fn(),
  recordPaymentFailure: vi.fn(),
  recordRefundOutcome: vi.fn(),
}));

vi.mock("@/server/db", () => ({ db: { webhookEvent: m.webhookEvent } }));
vi.mock("@/server/env", () => ({ env: () => ({ RAZORPAY_WEBHOOK_SECRET: "whsec", RAZORPAY_KEY_SECRET: "k" }), features: { razorpay: () => true } }));
vi.mock("@/server/services/orders", () => ({
  markRazorpayPaid: m.markRazorpayPaid,
  recordPaymentFailure: m.recordPaymentFailure,
  recordRefundOutcome: m.recordRefundOutcome,
}));
vi.mock("@/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  errorInfo: (e: unknown) => ({ err: String(e) }),
}));

import { POST } from "@/app/api/webhooks/razorpay/route";
import { hmacHex, isRetryableRazorpayError, withRetry } from "@/server/services/payments/razorpay";
import { logger } from "@/server/logger";

function send(event: object, headers: Record<string, string> = { "x-razorpay-event-id": "evt_1" }) {
  const body = JSON.stringify(event);
  return POST(
    new Request("http://localhost/api/webhooks/razorpay", {
      method: "POST",
      body,
      headers: { "x-razorpay-signature": hmacHex("whsec", body), ...headers },
    }),
  );
}

const refundEvent = (event: string) => ({ event, payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_1", status: "x" } } } });

beforeEach(() => {
  vi.clearAllMocks();
  m.webhookEvent.findUnique.mockResolvedValue(null);
  m.webhookEvent.create.mockResolvedValue({});
  m.webhookEvent.update.mockResolvedValue({});
  m.recordRefundOutcome.mockResolvedValue(1);
});

describe("razorpay webhook route", () => {
  it("rejects events without an event id instead of inventing one", async () => {
    const res = await send(refundEvent("refund.processed"), {});
    expect(res.status).toBe(400);
    expect(m.webhookEvent.create).not.toHaveBeenCalled();
    expect(m.recordRefundOutcome).not.toHaveBeenCalled();
  });

  it("tolerates a concurrent duplicate insert (P2002) but fails on other database errors", async () => {
    m.webhookEvent.create.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));
    expect((await send(refundEvent("refund.processed"))).status).toBe(200);

    m.webhookEvent.create.mockRejectedValueOnce(Object.assign(new Error("db down"), { code: "P1001" }));
    const res = await send(refundEvent("refund.processed"));
    expect(res.status).toBe(500);
    expect(m.recordRefundOutcome).toHaveBeenCalledTimes(1);
  });

  it("maps refund events to outcomes and warns when no refund row matches", async () => {
    await send(refundEvent("refund.failed"));
    expect(m.recordRefundOutcome).toHaveBeenCalledWith("rfnd_1", "failed", undefined);

    m.recordRefundOutcome.mockResolvedValueOnce(0);
    await send(refundEvent("refund.processed"));
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ providerRefundId: "rfnd_1" }), expect.stringContaining("matched no refund"));
  });

  it("returns 500 so Razorpay retries when processing throws", async () => {
    m.markRazorpayPaid.mockRejectedValueOnce(new Error("boom"));
    const res = await send({ event: "payment.captured", payload: { payment: { entity: { id: "p", order_id: "o" } } } });
    expect(res.status).toBe(500);
  });
});

describe("razorpay retry policy", () => {
  it("retries network errors, 429 and 5xx but not 4xx", () => {
    expect(isRetryableRazorpayError(new Error("ETIMEDOUT"))).toBe(true);
    expect(isRetryableRazorpayError({ statusCode: 503 })).toBe(true);
    expect(isRetryableRazorpayError({ statusCode: 429 })).toBe(true);
    expect(isRetryableRazorpayError({ statusCode: 400 })).toBe(false);
  });

  it("succeeds after transient failures and stops at the attempt limit", async () => {
    const flaky = vi.fn().mockRejectedValueOnce({ statusCode: 502 }).mockResolvedValueOnce("ok");
    await expect(withRetry(flaky, 3, 1)).resolves.toBe("ok");
    expect(flaky).toHaveBeenCalledTimes(2);

    const down = vi.fn().mockRejectedValue({ statusCode: 500 });
    await expect(withRetry(down, 3, 1)).rejects.toEqual({ statusCode: 500 });
    expect(down).toHaveBeenCalledTimes(3);
  });

  it("does not retry validation errors", async () => {
    const bad = vi.fn().mockRejectedValue({ statusCode: 400 });
    await expect(withRetry(bad, 3, 1)).rejects.toBeDefined();
    expect(bad).toHaveBeenCalledTimes(1);
  });
});
