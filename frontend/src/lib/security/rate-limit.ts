// ============================================================================
// GUILDOS — Simple In-Memory Rate Limiter
// For API routes only. In production, replace with Redis or Vercel KV.
// ============================================================================

const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { success: true, remaining: options.maxRequests - 1 };
  }

  if (entry.count >= options.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: options.maxRequests - entry.count };
}

// Clean up stale entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000).unref();
}
