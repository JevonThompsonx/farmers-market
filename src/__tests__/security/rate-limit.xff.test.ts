import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { assertRateLimit } from "@/lib/rate-limit";

function reqWithXFF(xff: string, realIp?: string): NextRequest {
  const headers: Record<string, string> = { "x-forwarded-for": xff };
  if (realIp) headers["x-real-ip"] = realIp;
  return new NextRequest("http://localhost:3000/api/test", { headers });
}

describe("X-Forwarded-For hardening in rate limiting", () => {
  // Distinct action names keep the in-memory buckets isolated between tests.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not let a spoofed leftmost hop reset the bucket (trusts rightmost)", async () => {
    // Both requests share the same trusted (rightmost) proxy hop 203.0.113.9,
    // but present different spoofed leftmost client IPs. They must share a bucket.
    await assertRateLimit(reqWithXFF("198.51.100.7, 203.0.113.9"), "xff-share", { limit: 1, windowMs: 60_000 });
    // Second request with a *different* leftmost IP but same rightmost should be blocked.
    await expect(
      assertRateLimit(reqWithXFF("192.0.2.55, 203.0.113.9"), "xff-share", { limit: 1, windowMs: 60_000 }),
    ).rejects.toThrow();
  });

  it("gives independent buckets to different trusted (rightmost) hops", async () => {
    await assertRateLimit(reqWithXFF("10.0.0.1, 198.51.100.10"), "xff-distinct", { limit: 1, windowMs: 60_000 });
    // Different rightmost hop -> fresh bucket -> allowed.
    await expect(
      assertRateLimit(reqWithXFF("10.0.0.2, 198.51.100.11"), "xff-distinct", { limit: 1, windowMs: 60_000 }),
    ).resolves.toBeUndefined();
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    await assertRateLimit(reqWithXFF("ignored", "203.0.113.20"), "xff-realip", { limit: 1, windowMs: 60_000 });
    await expect(
      assertRateLimit(reqWithXFF("ignored", "203.0.113.20"), "xff-realip", { limit: 1, windowMs: 60_000 }),
    ).rejects.toThrow();
  });
});
