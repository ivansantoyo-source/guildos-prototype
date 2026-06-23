# Vercel KV Setup — GuildOS Distributed Rate Limiting

## Overview

GuildOS uses a **distributed rate limiter** backed by Vercel KV (Redis) to protect API routes. Previously the rate limiter was in-memory only — it reset on every cold start and did not share state across Vercel's serverless function instances.

With Vercel KV, rate limit state is **persistent and shared** across all serverless invocations, so a burst of traffic across multiple instances is still correctly throttled.

## Prerequisites

- A Vercel account (the GuildOS project is already deployed at `guildos-flax.vercel.app`)
- Access to the Vercel project dashboard

## Creating a KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** in the sidebar
3. Click **Create Database**
4. Select **KV** (Vercel's managed Redis service)
5. Choose the region closest to your serverless function region (e.g., `iad1` for US East)
6. Name your database (e.g., `guildos-kv`)
7. Click **Create**

## Linking KV to the Project

### Option A: Via Vercel Dashboard (Recommended)

1. After creating the KV database, click **Connect** or **Connect Project**
2. Select the `guildos-flax` project
3. Vercel automatically adds the environment variables to your production deployment

### Option B: Manual Environment Variables

If you need to connect manually, copy these values from the KV database dashboard:

```
KV_URL=<your-kv-url>
KV_REST_API_URL=<your-rest-api-url>
KV_REST_API_TOKEN=<your-rest-api-token>
KV_REST_API_READ_ONLY_TOKEN=<your-read-only-token>
```

Set them in your Vercel project:

```bash
# From the project directory
echo "<KV_URL>" | vercel env add KV_URL production --scope vec717 -y
echo "<KV_REST_API_URL>" | vercel env add KV_REST_API_URL production --scope vec717 -y
echo "<KV_REST_API_TOKEN>" | vercel env add KV_REST_API_TOKEN production --scope vec717 -y
echo "<KV_REST_API_READ_ONLY_TOKEN>" | vercel env add KV_REST_API_READ_ONLY_TOKEN production --scope vec717 -y
```

For local development, add to `.env.local`:

```
KV_URL=<your-kv-url>
KV_REST_API_URL=<your-rest-api-url>
KV_REST_API_TOKEN=<your-rest-api-token>
KV_REST_API_READ_ONLY_TOKEN=<your-read-only-token>
```

## Graceful Degradation

The rate limiter **automatically falls back to in-memory** when KV credentials are not configured:

| Scenario | Backend | Behavior |
|----------|---------|----------|
| KV credentials in env | Vercel KV (Redis) | Shared across instances, survives cold starts |
| No KV credentials | In-memory `Map` | Per-instance, resets on cold start. Same API, just not distributed. |

Detection is automatic — no code changes needed to toggle between modes.

### In-Memory Behavior (Dev / No KV)

- Simple counter with a reset window
- Stale entries are cleaned up every 60 seconds
- Same `rateLimit()` API — returns `Promise<boolean>`

### KV Behavior (Production)

- Sliding window algorithm: 4 buckets per window, weighted by time overlap
- Key pattern: `ratelimit:{key}:{bucket_timestamp}` (e.g., `ratelimit:send-otp:user@example.com:1728400000`)
- Each bucket auto-expires after `bucketSize * 2` seconds
- Smooth transition between buckets via overlap weighting

## Performance Characteristics

| Factor | In-Memory | Vercel KV |
|--------|-----------|-----------|
| Latency per check | < 0.01 ms | ~5–15 ms (network round-trip) |
| Instance isolation | Not shared | Fully shared |
| Cold start survival | Resets | Persistent |
| Cost | Free | Vercel KV free tier: 256 MB, 50,000 req/day, 1 GB transfer/month |

KV latency of 5–15 ms is negligible for API routes that already make Supabase queries (50–200 ms), but keep in mind that every `rateLimit()` call adds a round-trip to the KV store.

## Implementation Details

### API

```typescript
// Returns true if rate limited, false if allowed
const limited = await rateLimit(key, {
  maxRequests: 10,
  windowMs: 60_000, // 60 seconds
});

// Get remaining requests for rate-limit headers
const remaining = await getRateLimitRemaining(key, {
  maxRequests: 10,
  windowMs: 60_000,
});
```

### Sliding Window Algorithm (KV mode)

```
Bucket size = windowMs / 4

Current bucket: ratelimit:{key}:{now / bucketSize}
Previous bucket: ratelimit:{key}:{now / bucketSize - 1}

weightedTotal = currentCount + (prevCount * overlapWeight)
limited = weightedTotal > maxRequests
```

This avoids the "burst at boundary" problem that simple fixed-window counters have.

## Monitoring

You can inspect rate limit keys directly from the Vercel KV dashboard, or via the Upstash Console (linked from Vercel Storage). Keys are prefixed with `ratelimit:` for easy filtering.

## Troubleshooting

- **"Too many requests" in development**: Your local in-memory state might have accumulated. Restart the dev server to clear it.
- **KV rate limit keys not expiring**: Check that `KV_REST_API_TOKEN` is set correctly. Without write access, `kv.expire()` silently fails.
- **High KV latency in production**: Verify your KV region matches your serverless function region. Mismatched regions add 50–100 ms latency.
