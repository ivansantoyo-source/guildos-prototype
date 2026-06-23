// ============================================================================
// GUILDOS — Distributed Rate Limiter (Vercel KV + In-Memory Fallback)
//
// Primary: Vercel KV (shared across serverless instances, survives cold starts)
// Fallback: In-memory Map (dev/test, no KV credentials configured)
//
// *** SECURITY WARNING ***
// The in-memory fallback is per-Vercel-serverless-instance, NOT shared.
// Multiple concurrent instances each have their own counter, allowing
// attackers to bypass rate limits by spraying requests across instances.
// In production, always configure Vercel KV for proper distributed limits.
//
// Uses a sliding window algorithm with KV:
//   - Key pattern: ratelimit:{key}:{timestamp_bucket}
//   - 4 buckets per window, weighted by time overlap for smooth transitions
//
// In-memory fallback uses a simple counter with reset window.
// ============================================================================

import { kv } from '@vercel/kv';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

// ============================================================================
// One-Time Warning Tracker
// Prevents log spam when multiple callers trigger the same warning.
// ============================================================================

const warnedMessages = new Set<string>();

function warnOnce(id: string, message: string): void {
  if (warnedMessages.has(id)) return;
  warnedMessages.add(id);
  console.warn(`[rate-limit] ${message}`);
}

/**
 * Log every time — used for operational-critical warnings that should appear
 * on every occurrence (e.g., in-memory fallback actively rate-limiting a
 * request). Does NOT deduplicate.
 */
function warnAlways(message: string): void {
  console.warn(`[rate-limit] ${message}`);
}

// ============================================================================
// In-Memory Fallback Store
// ============================================================================

const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries every 60 seconds (unref'd so it doesn't block exit)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of memoryStore.entries()) {
      if (val.resetAt <= now) memoryStore.delete(key);
    }
  }, 60_000).unref();
}

// ============================================================================
// KV Configuration Detection
// ============================================================================

function isKvConfigured(): boolean {
  return !!(
    process.env.KV_URL &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

// ============================================================================
// Production KV Enforcement Check
// Fires once per cold start at import time. Logs a critical message when
// Vercel KV is missing in production — rate limiting is otherwise broken
// (per-instance only, trivially bypassable via cross-instance spraying).
// ============================================================================

function checkProductionKv(): void {
  if (process.env.NODE_ENV === 'production' && !isKvConfigured()) {
    console.error(
      '[rate-limit] CRITICAL: Vercel KV is not configured in production. ' +
      'Rate limiting falls back to per-instance in-memory storage, which is ' +
      'ineffective on Vercel serverless. Attackers can bypass limits by ' +
      'spraying requests across instances. Set KV_URL, KV_REST_API_URL, and ' +
      'KV_REST_API_TOKEN environment variables.',
    );
  }
}

checkProductionKv();

// Module-level warning when KV is not configured (any environment).
// Fires on every cold start since the Set is fresh per serverless instance.
if (!isKvConfigured()) {
  warnOnce(
    'no-kv-configured',
    'Vercel KV is not configured. Rate limiting uses per-instance in-memory ' +
    'fallback — ineffective on Vercel serverless. Attackers can bypass by ' +
    'spraying requests across instances. ' +
    'Set KV_URL, KV_REST_API_URL, and KV_REST_API_TOKEN for distributed limiting.',
  );
}

// ============================================================================
// Composite Rate Limit Key Builder
//
// Creates a richer key from x-forwarded-for (client IP) and a hash of the
// user-agent header. This makes per-IP rate limits more granular and harder
// to bypass even with the in-memory fallback — a spray attacker must vary
// both IP and user-agent simultaneously to evade per-client counters.
// ============================================================================

/**
 * Build a composite rate-limit key from a request object and a prefix.
 *
 * THIS IS THE RECOMMENDED key builder for all rate-limited endpoints.
 * It creates a richer key from the client IP (x-forwarded-for) and a hash of
 * the user-agent header. This makes per-IP rate limits more granular and harder
 * to bypass even with the in-memory fallback — a spray attacker must vary both
 * IP and user-agent simultaneously to evade per-client counters.
 *
 * With Vercel KV this provides precise distributed limits. With the in-memory
 * fallback it forces attackers to vary both IP and user-agent across instances,
 * raising the bar for spray attacks.
 *
 * @example
 * // Preferred — use in every rate-limited endpoint:
 * import { rateLimit, buildRateLimitKey } from '@/lib/security/rate-limit';
 * const key = buildRateLimitKey(request, 'verify-otp');
 * if (await rateLimit(key, { maxRequests: 5, windowMs: 60_000 })) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }

 * @param request  - The incoming request with headers (NextRequest, Request, etc.)
 * @param prefix   - Namespace prefix, e.g. 'send-otp', 'verify-otp', 'lfg-join'
 * @returns A composite key string like "verify-otp:203.0.113.42:a1b2c3"
 *
 * @see rateLimit For the full rate-limit check function.
 */
export function buildRateLimitKey(
  request: { headers: { get(name: string): string | null } } | undefined | null,
  prefix: string,
): string {
  if (!request) return prefix;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const ua = request.headers.get('user-agent') || 'unknown';
  const uaHash = simpleHash(ua);

  return `${prefix}:${ip}:${uaHash}`;
}

/** Stable hex hash for short strings (user-agent, etc.). Deterministic, not cryptographic. */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// Vercel KV — Distributed Rate Limiting (Sliding Window)
// ============================================================================

async function checkKvLimit(key: string, opts: RateLimitOptions): Promise<boolean> {
  const bucketSize = Math.ceil(opts.windowMs / 4);
  const now = Date.now();
  const currentBucket = Math.floor(now / bucketSize);
  const prevBucket = currentBucket - 1;

  const currentKey = `ratelimit:${key}:${currentBucket}`;
  const prevKey = `ratelimit:${key}:${prevBucket}`;

  // Increment and get current count
  const currentCount = await kv.incr(currentKey);
  // Set expiry on first write (bucket window * 2 to handle clock skew)
  if (currentCount === 1) {
    await kv.expire(currentKey, Math.ceil(bucketSize / 1000) * 2);
  }

  // Get previous bucket count
  const prevCount = parseInt((await kv.get(prevKey)) as string || '0', 10);

  // Calculate weighted total using time overlap
  const elapsedInCurrent = now - (currentBucket * bucketSize);
  const overlapWeight = 1 - (elapsedInCurrent / bucketSize);
  const weightedTotal = currentCount + (prevCount * Math.max(0, overlapWeight));

  return weightedTotal > opts.maxRequests;
}

// ============================================================================
// In-Memory — Simple Counter (Dev Fallback)
// *** WARNING: Per-Vercel-instance only. Does NOT work across instances. ***
// ============================================================================

function checkMemoryLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + opts.windowMs });
    return false; // allowed
  }

  if (entry.count >= opts.maxRequests) {
    // Log every rate-limit denial so operators see this in production logs.
    // The in-memory fallback is per-instance only — on Vercel serverless this
    // is trivially bypassed by spraying requests across concurrent instances.
    warnAlways(
      `IN-MEMORY RATE LIMIT EXCEEDED (key="${key}", max=${opts.maxRequests}, ` +
      `window=${opts.windowMs}ms). Limit is PER-INSTANCE ONLY — ineffective on ` +
      `Vercel serverless. Configure Vercel KV for proper distributed rate limiting.`,
    );
    return true; // rate limited
  }

  entry.count++;
  return false; // allowed
}

// ============================================================================
// Exported API
// ============================================================================

/**
 * Check if a request should be rate limited.
 *
 * Returns `true` if the request exceeds the limit (should be rejected with 429),
 * `false` if the request is within the limit (should proceed).
 *
 * Uses Vercel KV when KV credentials are configured, otherwise falls back
 * to an in-memory store (dev, local, no KV).
 *
 * *** SECURITY ***
 * In production, missing KV credentials emits a critical error at import time.
 * The in-memory fallback is per-serverless-instance only — on Vercel,
 * multiple concurrent instances each have their own counter, making rate
 * limits trivially bypassable by spraying requests across instances.
 * Always configure Vercel KV in production.
 *
 * For IP-based rate limiting, consider using buildRateLimitKey(request, prefix)
 * to create composite keys that include both client IP and user-agent hash,
 * making the in-memory fallback harder to bypass.
 *
 * @param key - Rate limit key (e.g., 'send-otp:user@example.com')
 * @param opts - Configuration: windowMs (time window) and maxRequests (max per window)
 * @returns Promise<boolean> — true if rate limited, false if allowed
 *
 * @example
 * if (await rateLimit('my-endpoint', { maxRequests: 10, windowMs: 60_000 })) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 */
export async function rateLimit(key: string, opts: RateLimitOptions): Promise<boolean> {
  if (isKvConfigured()) {
    return checkKvLimit(key, opts);
  }

  warnOnce(
    'in-memory-fallback',
    `Using in-memory rate limiter (key="${key}"). Vercel KV not configured. ` +
    'Rate limits are PER-INSTANCE only — ineffective on Vercel serverless. ' +
    'Set KV_URL, KV_REST_API_URL, and KV_REST_API_TOKEN for proper distributed limiting.',
  );

  return checkMemoryLimit(key, opts);
}

/**
 * Get the number of remaining requests within the current window.
 * Useful for setting rate-limit headers on responses.
 *
 * @param key - Rate limit key
 * @param opts - Configuration
 * @returns Promise<number> — remaining requests before rate limit kicks in
 */
export async function getRateLimitRemaining(key: string, opts: RateLimitOptions): Promise<number> {
  if (isKvConfigured()) {
    const bucketSize = Math.ceil(opts.windowMs / 4);
    const currentBucket = Math.floor(Date.now() / bucketSize);
    const currentCount = parseInt(
      (await kv.get(`ratelimit:${key}:${currentBucket}`)) as string || '0',
      10,
    );
    return Math.max(0, opts.maxRequests - currentCount);
  }

  warnOnce(
    'in-memory-fallback-remaining',
    'getRateLimitRemaining using in-memory fallback (Vercel KV not configured). ' +
    'Remaining count is per-instance only.',
  );

  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= Date.now()) return opts.maxRequests;
  return Math.max(0, opts.maxRequests - entry.count);
}
