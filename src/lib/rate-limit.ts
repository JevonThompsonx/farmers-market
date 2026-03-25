import { type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TooManyRequestsError } from "./errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const upstashLimiters = new Map<string, Ratelimit>();

const upstashRedis =
  process.env["UPSTASH_REDIS_REST_URL"] && process.env["UPSTASH_REDIS_REST_TOKEN"]
    ? new Redis({
        url: process.env["UPSTASH_REDIS_REST_URL"],
        token: process.env["UPSTASH_REDIS_REST_TOKEN"],
      })
    : null;

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

function clearExpiredBuckets(now: number) {
  if (buckets.size < 500) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getWindowSeconds(windowMs: number): number {
  return Math.max(1, Math.ceil(windowMs / 1000));
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  if (!upstashRedis) {
    throw new Error("Upstash Redis is not configured");
  }

  const windowSeconds = getWindowSeconds(windowMs);
  const cacheKey = `${limit}:${windowSeconds}`;
  const existing = upstashLimiters.get(cacheKey);
  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix: "farmers-market:rate-limit",
  });

  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

export async function assertRateLimit(
  req: NextRequest,
  action: string,
  options?: {
    limit?: number;
    windowMs?: number;
  },
) {
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60_000;
  const identifier = `${action}:${getClientKey(req)}`;

  if (upstashRedis) {
    const limiter = getUpstashLimiter(limit, windowMs);
    const result = await limiter.limit(identifier);

    if (!result.success) {
      throw new TooManyRequestsError();
    }

    return;
  }

  const now = Date.now();
  clearExpiredBuckets(now);

  const key = identifier;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new TooManyRequestsError();
  }

  bucket.count += 1;
}
