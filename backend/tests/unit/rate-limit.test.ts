import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/redis", () => ({
  redis: () => {
    throw new Error("redis down");
  },
}));
vi.mock("@/server/logger", () => ({
  logger: { warn: vi.fn() },
  errorInfo: (e: unknown) => ({ err: String(e) }),
}));

import { __resetMemoryLimiter, rateLimit } from "@/server/rate-limit";

describe("rateLimit during a Redis outage", () => {
  beforeEach(() => __resetMemoryLimiter());

  it("fails open for checkout", async () => {
    for (let i = 0; i < 5; i++) expect((await rateLimit("checkout", "u1", 2, 60)).ok).toBe(true);
  });

  it("enforces an in-memory limit for other buckets", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await rateLimit("contact", "1.1.1.1", 3, 60)).ok);
    expect(results).toEqual([true, true, true, false]);
  });

  it("tracks identifiers independently", async () => {
    await rateLimit("otp", "a", 1, 60);
    expect((await rateLimit("otp", "a", 1, 60)).ok).toBe(false);
    expect((await rateLimit("otp", "b", 1, 60)).ok).toBe(true);
  });
});
