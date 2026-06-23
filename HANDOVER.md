# GUILDOS -- Developer Handover Guide

> **For:** AI agents and developers resuming work on GuildOS.
> **Last updated:** 2026-06-23

---

## Quick Start

```bash
cd GuildOS/frontend
npm install
npm run dev
# -> http://localhost:3000

# Demo mode: append ?demo=true to any page
# http://localhost:3000/dashboard?demo=true
```

**No Supabase or API keys needed for local development** -- demo mode loads phantom data.

---

## Critical Things to Know Before Writing Code

### 1. Database Schema is `guildos_core`, NOT `public`
We share a free-tier Supabase with the Aegis-OS app. The `public` schema has 86 Aegis tables -- NEVER touch them. All GuildOS tables (13) are in `guildos_core`. Supabase clients are configured with `db: { schema: 'guildos_core' }`.

### 2. Demo Mode Priority Chain
```
URL param ?demo=true  ->  Zustand localStorage  ->  NEXT_PUBLIC_DEMO_MODE env var
```
The user's explicit choice ALWAYS wins. The env var sets the default. Check via `isDemoMode()` from `@/lib/toggles`.

### 3. Proxy Middleware Controls Auth
`src/proxy.ts` handles: Supabase session refresh -> subdomain/tenant resolution -> auth gate (skipped if `?demo=true`). Before adding new protected routes, update `protectedPaths` array.

### 4. BYO Key Architecture
Platform provides Supabase only. Each merchant brings their own Stripe, Twilio, PriceCharting, AI, IoT keys -- configured via `/settings` page, stored in `organizations.config` JSONB. No payment/SMS/pricing keys in Vercel env vars.

### 5. No Separate Backend
Vercel Cron Jobs hit Next.js API routes for scheduled tasks. The `backend/` directory is reference-only (FastAPI). All cron logic is in `/api/cron/*` routes.

### 6. CSS is `globals-v2.css`
The original `globals.css` still exists but `layout.tsx` imports `globals-v2.css`. The V2 has all premium design tokens, glassmorphism, animations, skeleton loaders, toast styles, etc.

### 7. Rate Limiting Requires Vercel KV in Production
Without Vercel KV, rate limiting is per-Vercel-instance only -- trivially bypassable by spraying across instances. Always configure KV for production. In-memory fallback warned at cold start.

### 8. Passwordless OTP Auth Only
No password-based auth. Users authenticate via email OTP (magic link + 6-digit code). Rate limited: 1 send/min/email, 5 verify/min/IP.

---

## Key Files to Read First

| File | Why |
|------|-----|
| `src/lib/store/useGuildStore.ts` | All state (30+ actions). Understanding this = understanding the app. |
| `src/lib/types/index.ts` | All TypeScript interfaces. |
| `src/mocks/phantomData.ts` | Complete demo dataset (10 items, 4 bounties, etc.). |
| `src/lib/toggles/index.ts` | Demo/production switching logic. |
| `src/lib/toggles/server.ts` | Server-side demo detection (cookies + URL params). |
| `src/proxy.ts` | Middleware: subdomain routing, auth gate, demo bypass. |
| `src/lib/types/tenant-keys.ts` | BYO key type definitions + service detection. |
| `src/lib/security/rate-limit.ts` | Distributed rate limiter (KV + in-memory fallback). |
| `src/lib/audit.ts` | Audit logging library (17 action types). |
| `src/components/ui/toaster.tsx` | Toast system. Use `toast(type, title, desc)` imperatively. |
| `src/lib/audio/sounds.ts` | Sound system. Use `playClick()`, `playSuccess()`, etc. |
| `src/lib/vitality/xp-engine.ts` | XP engine, level thresholds, tier perks. |
| `src/lib/stripe-connect.ts` | Stripe Connect split-pay for LFG lobbies. |
| `src/lib/hooks/useRealtime.ts` | Real-time subscription hook + demo simulation. |
| `src/app/api/security/csp-report/route.ts` | CSP violation report receiver. |
| `src/lib/utils/url.ts` | `demoHref()`, `isCurrentlyDemoMode()`, `persistDemoMode()`. |

---

## Architecture Patterns

### Data Flow
```
User clicks -> Zustand action -> API route (guildFetch) -> Supabase (production) or phantomData (demo) -> Zustand state -> React re-render
```

### Page Pattern
Every merchant page follows the same pattern:
```
"use client"
import { useGuildStore } from "@/lib/store/useGuildStore"
// Read state: const items = useGuildStore(s => s.inventory)
// Write state: const setItems = useGuildStore(s => s.setInventory)
// Loading: check if data exists, show skeleton if not
// Empty: show <EmptyState /> if array empty
// Error: try/catch, show error state with retry
// Success: render data
```

### API Route Pattern
```typescript
import { isDemoMode } from '@/lib/toggles'
export async function GET/POST(request) {
  if (isDemoMode()) return Response.json({ data: phantomData, source: 'demo' })
  // Production: query Supabase
}
```

### Rate Limiting Pattern
```typescript
import { rateLimit, buildRateLimitKey } from '@/lib/security/rate-limit'

// For IP-based endpoints (auth, shopkeeper, etc.):
const key = buildRateLimitKey(request, 'my-endpoint');
if (await rateLimit(key, { maxRequests: 10, windowMs: 60_000 })) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}

// For email-based rate limiting (e.g., OTP send):
const key = `send-otp:${email.toLowerCase()}`;
if (await rateLimit(key, { maxRequests: 1, windowMs: 60_000 })) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### Audit Logging Pattern
```typescript
import { logAction } from '@/lib/audit';

// Log any sensitive action:
await logAction({
  organizationId: 'org-123',
  profileId: 'usr-456',
  action: 'BOUNTY_FULFILL',
  resourceType: 'bounty',
  resourceId: 'bnt-789',
  metadata: { value: 150.00 },
});
```

---

## Common Tasks

### Adding a New Page
1. Create `src/app/(merchant)/new-page/page.tsx` with `"use client"`
2. Add nav item in `layout.tsx` NAV_ITEMS array
3. Add mobile nav item in `components/layout/mobile-nav.tsx` TABS array
4. Add to `proxy.ts` protectedPaths if it needs auth
5. Add phantom data in `src/mocks/phantomData.ts` if demo mode needed
6. Add store actions in `src/lib/store/useGuildStore.ts`

### Adding a New API Route
1. Create `src/app/api/new-endpoint/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Check `isDemoMode()` at top, return phantom data if true
4. Follow `guildFetch` pattern from `src/lib/api/client.ts`
5. Add rate limiting if it's auth, AI, or user-facing
6. Add audit logging if it changes sensitive state
7. Add Zod validation for all POST/PUT endpoints

### Working with the Database
- Browser client: `src/lib/supabase/client.ts` (anon key, `guildos_core` schema)
- Server client: `src/lib/supabase/server.ts` (service role, `guildos_core` schema)
- Types: `src/lib/types/database.ts` (run `bash scripts/generate-types.sh` to regenerate)
- All tables use `gen_random_uuid()` for primary keys
- All foreign keys should use `ON DELETE CASCADE`
- Never use `uuid_generate_v4()` -- it requires the `uuid-ossp` extension

### Running Migrations
```bash
# Via Supabase Management API (needs access token):
SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/migrate_final.sh

# Or paste schema.sql into Supabase SQL Editor:
# https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/sql/new
```

### Adding a New Vitality Quest
1. Add the quest definition in `src/lib/vitality/quests.ts`:
   - Add entry to `getDemoQuests()` return array
   - Define `quest_type` from supported types (STRETCH, HYDRATION, POSTURE_CHECK, EYE_REST, SOCIAL, MINDFULNESS)
   - Set `xp_reward`, `stamina_restore`, `cooldown_minutes`
   - Generate unique `qr_code_hash`
2. Add demo completion in phantom data if needed
3. The quest automatically integrates with:
   - XP engine (`xToNextTier`, `checkLevelUp`)
   - Stamina system (stamina restore, debuff clear)
   - Achievement engine (vitality quest count check)
   - Cooldown tracker (per-quest cooldown enforcement)

### Configuring a New Station Type
Station types are managed via the Tavern system:
1. Add a new station entry to `src/app/api/tavern/stations/route.ts` demo data
2. Create a station card component or reuse `src/components/tavern/station-card.tsx`
3. Add booking logic in `src/app/api/tavern/bookings/route.ts`
4. The station appears on the Tavern live map (`src/components/tavern/live-map.tsx`)
5. Each station can have its own booking rules, capacity, and amenities

### Setting Up a New Merchant Tenant
1. Organization is created when a merchant signs up for a subscription
2. The merchant can then configure BYO keys via `/settings`:
   - Stripe keys (for direct payments to the merchant)
   - Twilio keys (for SMS features)
   - PriceCharting key (for market pricing data)
   - NVIDIA NIM / OpenAI key (for AI Shopkeeper)
   - IoT webhook URL (for smart device integration)
3. All keys are stored in `organizations.config` JSONB column
4. The merchant's subdomain is auto-configured by Vercel middleware (`src/proxy.ts`):
   - `store-name.guildos.com` routes to `/[store-name]/dashboard`
5. Add the merchant's Stripe customer/subscription IDs to the organization record
6. Verify BYO key fallback: test each feature without the merchant's keys to ensure graceful degradation

### Testing Stripe Webhooks Locally
```bash
# From the frontend/ directory:
cd /Users/vanguardestatecontrols/GuildOS/frontend

# 1. Start the dev server
npm run dev

# 2. In another terminal, start Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. You'll get a webhook signing secret (whsec_...). Set it:
echo "whsec_..." | vercel env add STRIPE_WEBHOOK_SECRET development --scope vec717 -y

# 4. Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# 5. Check Vercel/dev logs to verify:
vercel logs --scope vec717 | grep -i "stripe\|webhook"

# 6. For Stripe Connect split-pay testing:
stripe trigger payment_intent.succeeded
```

### Debugging Rate Limiting
1. **Check if KV is configured:**
   ```bash
   vercel env ls production --scope vec717 | grep KV_
   # If empty, rate limiting is per-instance only
   ```

2. **Check rate limit hits in logs:**
   ```bash
   vercel logs --scope vec717 --since 24h | grep -i "rate-limit\|429\|RATE LIMIT EXCEEDED"
   ```

3. **Verify the key pattern works:**
   ```typescript
   // Add debug logging to rateLimit() in src/lib/security/rate-limit.ts:
   const key = buildRateLimitKey(request, 'my-endpoint');
   console.log(`[debug-rate-limit] key=${key}, max=${opts.maxRequests}, windowMs=${opts.windowMs}`);
   ```

4. **Test with curl from different simulated IPs:**
   ```bash
   for IP in "1.2.3.4" "5.6.7.8" "9.10.11.12"; do
     curl -s -w "IP $IP -> HTTP %{http_code}\n" \
       -H "X-Forwarded-For: $IP" \
       -X POST "https://guildos-flax.vercel.app/api/auth/send-otp" \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com"}'
   done
   ```

5. **Fix rate limit bypass:** Configure Vercel KV via the dashboard (Operations > Storage > KV > Create Database)

### Running Load Tests
```bash
# Install k6 (if not already installed):
brew install k6
# Or: https://grafana.com/docs/k6/latest/get-started/installation/

# Create a load test script (e.g., loadtest.js):
cat > loadtest.js << 'EOF'
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20
    { duration: '30s', target: 50 },   // Ramp to 50
    { duration: '1m', target: 50 },    // Stay at 50
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
  },
};

const BASE_URL = 'https://guildos-flax.vercel.app';

export default function () {
  // Test landing page
  check(http.get(BASE_URL), { 'landing OK': (r) => r.status === 200 });

  // Test demo endpoints
  const endpoints = [
    '/api/inventory?demo=true',
    '/api/bounties?demo=true',
    '/api/nexus/lfg?demo=true',
    '/api/system/mode',
  ];
  
  for (const ep of endpoints) {
    check(http.get(`${BASE_URL}${ep}`), {
      [`${ep} OK`]: (r) => r.status < 500,
    });
  }

  sleep(1);
}
EOF

# Run the load test:
k6 run loadtest.js

# Expected results (baseline):
# - Landing page: <200ms p95
# - Demo API routes: <300ms p95
# - Error rate: <0.1%
# - No 429s when under rate limit thresholds
```

**Load test profiles:**
| Profile | Users | Duration | Target |
|---------|-------|----------|--------|
| Light | 20 concurrent | 2 min | Verify no regression |
| Moderate | 50 concurrent | 3 min | Check rate limiting and DB queries |
| Heavy | 100+ concurrent | 5 min | Identify bottlenecks (Pro plan required) |

### Interpreting Sentry Errors (When Integrated)

When Sentry or error tracking is added:

```typescript
// Error types to watch for in Sentry dashboard:

// 1. API Route Errors
//    - Rate limit bypass attempts (429 with expected patterns)
//    - Invalid Zod schema violations (400 with validation details)
//    - Stripe webhook signature failures (401)
//    - Supabase connection timeouts (500)

// 2. Client-Side Errors
//    - "useSearchParams() should be wrapped in a Suspense boundary"
//    - "Cannot read properties of undefined" -- store state missing
//    - Framer Motion transition errors with reducedMotion=true

// 3. Auth Errors
//    - OTP send failures (SMTP misconfigured, rate limited)
//    - OTP verification expired tokens
//    - Session refresh failures (JWT expired, revoked)

// 4. Database Errors
//    - `relation "guildos_core.X" does not exist` -- missing table
//    - `permission denied for schema guildos_core` -- RLS issue
//    - `column X does not exist` -- schema migration needed
```

**Common Sentry error patterns and fixes:**

| Error Pattern | Likely Cause | Fix |
|---------------|-------------|-----|
| `isDemoModeServer is not a function` | Import path wrong | Check `@/lib/toggles/server` exports |
| `status=429 across all endpoints` | Rate limit key collision | Check `buildRateLimitKey()` is using unique prefixes |
| `Supabase AuthApiError: Email rate limit exceeded` | Supabase SMTP rate limit | Wait, or upgrade Supabase plan |
| `stripe.WebhookSignatureVerificationError` | Wrong `STRIPE_WEBHOOK_SECRET` | Verify Stripe Dashboard vs Vercel env var |
| `relation "guildos_core.csp_violations" does not exist` | Missing table | Apply schema migration |
| `TypeError: Failed to fetch` with status 0 | CORS or network error | Check `nextUrl.origin` in API routes |

---

## Deploying

```bash
cd frontend
vercel deploy --prod --yes --scope vec717
# -> https://guildos-flax.vercel.app

# Set env vars on Vercel:
echo "value" | vercel env add KEY production --scope vec717 -y
```

## Rollback

```bash
# Rollback to previous deploy
vercel rollback --scope vec717

# Or deploy a known-good commit
git checkout <last-good-commit>
cd frontend && vercel deploy --prod --yes --scope vec717
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | `cd frontend && npm install` |
| Blank page on /dashboard | Append `?demo=true` OR check NEXT_PUBLIC_DEMO_MODE env var |
| Redirect to /login | Proxy auth gate active -- use `?demo=true` or sign in |
| CSS missing | Ensure `globals-v2.css` is imported in `layout.tsx` |
| Build fails | `npm run build` -- check TypeScript errors first |
| Supabase connection error | Check env vars on Vercel; demo mode works without Supabase |
| Framer Motion errors | Check `reducedMotion` in Zustand store; disable animations |
| useSearchParams() error | Must be wrapped in Suspense OR use `window.location.search` client-side |
| Voice input not working | Only Chrome/Edge support Web Speech API |
| Rate limiting ineffective | Vercel KV not configured -- set KV env vars |
| 429 on every request | Rate limit key collision -- check key prefixes in `rate-limit.ts` |
| Stripe webhook not firing | Check webhook endpoint URL and signing secret match |
| Realtime subscriptions not working | Enable replication in Supabase Dashboard > Database > Replication |
| OTP not sending | Verify SMTP configured in Supabase Dashboard > Auth > SMTP |
| Demo mode showing real data | Check `isDemoMode()` is called correctly in the API route |
| CSP violation spam | Check `content-security-policy` header or violating third-party scripts |
