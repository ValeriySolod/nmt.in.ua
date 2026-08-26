import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIp, isBlockedPath } from "@/lib/security";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const LIMIT_PAGE = 90;
const LIMIT_STATIC = 300;
const LIMIT_OTHER = 60;
const MAX_BUCKETS = 5_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size < MAX_BUCKETS) return;
  // Drop oldest half if still too large (memory guard on shared hosting).
  const keys = [...buckets.keys()].slice(0, Math.floor(buckets.size / 2));
  for (const key of keys) buckets.delete(key);
}

function take(key: string, limit: number, now: number): boolean {
  prune(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function limitFor(pathname: string): number {
  if (pathname.startsWith("/_next/static")) return LIMIT_STATIC;
  if (pathname.startsWith("/_next")) return LIMIT_OTHER;
  return LIMIT_PAGE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBlockedPath(pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const ip = clientIp(request.headers);
  const now = Date.now();
  const limit = limitFor(pathname);
  const key = `${ip}:${limit === LIMIT_STATIC ? "static" : "app"}`;

  if (!take(key, limit, now)) {
    const retryAfter = Math.max(
      1,
      Math.ceil(((buckets.get(key)?.resetAt ?? now + WINDOW_MS) - now) / 1000),
    );
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Apply to all paths except Next image optimizer internals we don't use heavily.
     * Static assets still get a higher limit via limitFor().
     */
    "/((?!_next/image).*)",
  ],
};
