import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  order: { findMany: vi.fn(), findUnique: vi.fn() },
  cart: { deleteMany: vi.fn() },
  verification: { deleteMany: vi.fn() },
  session: { deleteMany: vi.fn() },
  enqueue: vi.fn(),
  expireOrder: vi.fn(),
}));

vi.mock("@/server/db", () => ({ db: { order: m.order, cart: m.cart, verification: m.verification, session: m.session } }));
vi.mock("@/server/env", () => ({ env: () => ({ APP_URL: "http://x" }) }));
vi.mock("@/server/queue", () => ({ enqueue: m.enqueue }));
vi.mock("@/server/services/notifications/email", () => ({ renderEmail: vi.fn(), sendEmail: vi.fn() }));
vi.mock("@/server/services/notifications/sms", () => ({ sendSms: vi.fn() }));
vi.mock("@/server/services/orders", () => ({ expireOrder: m.expireOrder }));
vi.mock("@/server/services/invoices", () => ({ generateInvoice: vi.fn() }));
vi.mock("@/server/auth", () => ({ isPlaceholderEmail: () => false }));
vi.mock("@/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
  errorInfo: (e: unknown) => ({ err: String(e) }),
}));

import { handlers, resendSuffix } from "@/worker/handlers";
import { isFinalFailure, reportDeadJob } from "@/worker/alert";
import { logger } from "@/server/logger";

const job = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  m.cart.deleteMany.mockResolvedValue({ count: 0 });
  m.verification.deleteMany.mockResolvedValue({ count: 0 });
  m.session.deleteMany.mockResolvedValue({ count: 0 });
  m.enqueue.mockResolvedValue({});
});

describe("maintenance.cleanup", () => {
  it("keeps sweeping when one order fails to expire", async () => {
    m.order.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }]).mockResolvedValueOnce([]);
    m.expireOrder.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(true);
    const res = (await handlers["maintenance.cleanup"]({}, job)) as { expiredOrders: number; expireFailures: number };
    expect(m.expireOrder).toHaveBeenCalledTimes(3);
    expect(res).toMatchObject({ expiredOrders: 2, expireFailures: 1 });
    expect(logger.error).toHaveBeenCalled();
  });

  it("re-enqueues invoice and confirmation for paid orders without an invoice", async () => {
    m.order.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "o1" }, { id: "o2" }]);
    m.enqueue.mockRejectedValueOnce(new Error("redis down")); // o1 fails, o2 still processed
    const res = (await handlers["maintenance.cleanup"]({}, job)) as { invoicesRequeued: number };
    const where = m.order.findMany.mock.calls[1][0].where;
    expect(where).toMatchObject({ paymentStatus: "PAID", invoiceKey: null });
    expect(m.enqueue).toHaveBeenCalledWith("invoice.generate", { orderId: "o2" }, expect.objectContaining({ jobId: expect.stringContaining("invoice-o2-sweep") }));
    expect(m.enqueue).toHaveBeenCalledWith("order.placed", { orderId: "o2" }, expect.any(Object));
    expect(res.invoicesRequeued).toBe(1);
  });
});

describe("notification job ids", () => {
  it("keeps the deduping id for automatic enqueues and varies it for explicit resends", async () => {
    m.order.findUnique.mockResolvedValue({
      id: "o1", number: "N1", email: "a@b.c", phone: "1", paymentMethod: "COD", paymentStatus: "PENDING",
      items: [], shipment: null, user: { name: "A B" }, cancelReason: null, grandTotal: 1,
    });
    await handlers["order.status-changed"]({ orderId: "o1", status: "DELIVERED" }, job);
    await handlers["order.status-changed"]({ orderId: "o1", status: "DELIVERED", resend: 1700 } as never, job);
    const ids = m.enqueue.mock.calls.map((c) => c[2].jobId);
    expect(ids).toEqual(["order-delivered-o1", "order-delivered-o1-r1700"]);
  });

  it("sanitises the resend marker", () => {
    expect(resendSuffix({ resend: "a:b c" })).toBe("-rabc");
    expect(resendSuffix({})).toBe("");
    expect(resendSuffix(null)).toBe("");
  });
});

describe("dead job reporting", () => {
  it("detects the final attempt", () => {
    expect(isFinalFailure({ attemptsMade: 5, opts: { attempts: 5 } })).toBe(true);
    expect(isFinalFailure({ attemptsMade: 2, opts: { attempts: 5 } })).toBe(false);
    expect(isFinalFailure(undefined)).toBe(false);
  });

  it("logs job_dead and posts to the webhook when configured, never throwing", async () => {
    process.env.ALERT_WEBHOOK_URL = "http://hook.test/x";
    const f = vi.fn().mockRejectedValue(new Error("net"));
    await expect(reportDeadJob({ queue: "q", name: "email.send", id: "1", attemptsMade: 5, attempts: 5, error: new Error("x") }, f as never)).resolves.toBeUndefined();
    expect(f).toHaveBeenCalledOnce();
    expect(vi.mocked(logger.error).mock.calls[0][0]).toMatchObject({ event: "job_dead", queue: "q" });
    delete process.env.ALERT_WEBHOOK_URL;
  });

  it("does not call a webhook when none is configured", async () => {
    const f = vi.fn();
    await reportDeadJob({ queue: "q", attemptsMade: 1, attempts: 1, error: "x" }, f as never);
    expect(f).not.toHaveBeenCalled();
  });
});
