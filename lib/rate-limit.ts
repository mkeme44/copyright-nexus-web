/**
 * lib/rate-limit.ts
 *
 * Simple in-memory IP-based rate limiter.
 * Limits each IP to RATE_LIMIT_PER_DAY queries per calendar day (UTC).
 *
 * Note: In-memory means the counter resets on Vercel cold starts.
 * For a fully public tool this is acceptable — it prevents abuse
 * without requiring a database. Upgrade to Vercel KV if needed.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // UTC midnight timestamp
}

const store = new Map<string, RateLimitEntry>();

function getTodayMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.getTime();
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const limit = parseInt(process.env.RATE_LIMIT_PER_DAY ?? "20", 10);
  const now = Date.now();
  const entry = store.get(ip);

  // Expired or new entry
  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: getTodayMidnight() });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, limit };
}
