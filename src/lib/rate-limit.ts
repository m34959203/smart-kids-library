import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function cleanup(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key);
  }
}

export function getClientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";
  return ip;
}

export interface RateLimitOptions {
  /** Logical namespace (e.g. "chatbot", "upload"). */
  bucket: string;
  /** Max requests per window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
  /** Optional explicit key (falls back to client IP). */
  key?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(req: NextRequest, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanup(now);
  const key = `${opts.bucket}:${opts.key ?? getClientKey(req)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.max - 1, resetAt };
  }

  if (existing.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: opts.max - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests", retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

/** Convenience wrapper: returns null when allowed, Response when blocked. */
export function enforceRateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const r = checkRateLimit(req, opts);
  if (!r.allowed) return rateLimitResponse(r);
  return null;
}
