# GuildOS v2.3.0 -- System Architecture

> **Multi-tenant retro-gaming SaaS platform** -- AI-powered, RPG-gamified ecosystem for brick-and-mortar game stores.
> **Status:** Production-deployed on Vercel + Aegis Supabase.
> **Last updated:** 2026-06-23

---

## Quick Reference

| Item | Value |
|------|-------|
| **Production URL** | https://guildos-flax.vercel.app |
| **Demo Mode** | Append `?demo=true` to any page (bypasses auth, loads mock data) |
| **Supabase Project** | Aegis-OS-DB (`tyustwqwvjmzvuazfwkv`) |
| **Schema** | `guildos_core` (isolated from Aegis `public` -- 86 Aegis tables untouched) |
| **Vercel Project** | vec717/guildos |
| **GitHub** | ivansantoyo-source/guildos-prototype |
| **Node** | `cd frontend && npm run dev` |

---

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Turbopack) | 19 pages, 47 API routes, proxy middleware |
| **State** | Zustand 5 (persist middleware) | Demo mode, domain data, UI state |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Framer Motion | Glassmorphism, neon glow, 3D cards, page transitions |
| **Animations** | Framer Motion + CSS @property | Page transitions, card tilt, confetti, effects |
| **Audio** | Web Audio API (synthesized, no files) | 7 sounds: hover, click, success, legendary, error, notification, konami |
| **Auth** | Supabase Auth (JWT + RLS) | Passwordless OTP/magic-link, OAuth (Google/GitHub), `?demo=true` bypass |
| **Database** | Supabase PostgreSQL (Aegis project) | 13 tables in `guildos_core` schema, full RLS + triggers, `gen_random_uuid()` |
| **Cron** | Vercel Cron Jobs (6 daily) | Price sync, Oracle, B2B arbitrage, Faction war, Bounty expire, Escrow sweep |
| **AI** | NVIDIA NIM (DeepSeek-V3) + mock fallback | Synthetic Shopkeeper with 8 keyword patterns |
| **Payments** | Stripe (BYO keys per tenant) | Checkout sessions, billing portal, webhooks, Connect Express split-pay |
| **SMS** | Twilio (BYO keys per tenant) | Wandering Merchant, Score Dethroned, Oracle alerts |
| **Pricing** | PriceCharting (BYO keys per tenant) | Live market prices with demo fallback |
| **Rate Limiting** | Vercel KV + in-memory fallback | Distributed sliding window, composite IP+UA keys |
| **Realtime** | Supabase Realtime (postgres_changes) | 7 subscription hooks, demo simulation with jitter |

---

## BYO Key Architecture (Multi-Tenant SaaS)

**Platform keys** (one per platform, set in Vercel env vars):
- Supabase URL, anon key, service role key -- shared infrastructure
- CRON_SECRET, BLACKLIST_VERIFICATION_KEY

**Tenant BYO keys** (each merchant brings their own, stored in `organizations.config` JSONB):
- Stripe (publishable, secret, webhook) -- each store gets paid directly
- Twilio (account SID, auth token, phone) -- each store sends their own SMS
- PriceCharting API key -- each store's market data
- NVIDIA NIM / OpenAI key -- each store's AI shopkeeper
- IoT webhook URL -- each store's smart devices

**Graceful degradation:** If a tenant hasn't configured a key, that feature falls back to mock/simulated mode without breaking the rest of the platform.

Tenant settings page: `/settings` -- merchants configure their keys in a 3-tab UI (API Keys, Store Info, Features).

---

## Database: `guildos_core` Schema (13 Tables)

**Critical:** This shares a free-tier Supabase with the Aegis-OS app. ALL GuildOS tables are in `guildos_core` schema -- NEVER in `public`. The `public` schema has 86 Aegis tables that must never be touched.

All tables enforce RLS via `guildos_core.current_user_org_id()` which reads `auth.jwt() -> 'app_metadata' ->> 'organization_id'`.

| Table | Module | Key Feature |
|-------|--------|------------|
| `organizations` | Core | Tenant config JSONB stores BYO keys, Stripe customer/subscription IDs |
| `profiles` | Core | Faction, XP, level tier (auto-calculated by trigger) |
| `inventory` | Loot Scanner | Legendary flag (auto >=$150), scrap value, price spike flag |
| `price_history` | Loot Scanner | Market value tracking for algorithmic pricing |
| `bounties` | Quest Board | Computed `store_credit_value = base_price x scarcity_mult` |
| `nexus_lfgs` | The Nexus | LFG lobby management, funding tracking |
| `nexus_lfg_participants` | The Nexus | Lobby membership junction |
| `nexus_scoreboards` | The Nexus | Ghost Data arcade leaderboards |
| `nexus_save_rooms` | The Nexus | Room rentals with QR codes |
| `faction_standings` | Faction Wars | Monthly faction point tracking |
| `discount_codes` | Gamification | Konami Code + faction win + promotions |
| `blacklist_entries` | Security | Cross-tenant fraud ledger (100-mile radius broadcast) |
| `notifications` | System | 10 notification types in-app queue |

**Triggers:** legendary flagging (items >= $150 auto-flag), level tier calculation (PEASANT/RETRO_MAGE/TIME_LORD), updated_at timestamps.

**Naming convention:** All tables use `gen_random_uuid()` for primary keys (not `uuid_generate_v4()`). All foreign keys use `ON DELETE CASCADE`.

---

## Full Route Map (19 Pages, 47 API Routes)

```
App Router:
├── /                         Landing page (hero, features, faction tease, pricing)
├── /login                    Auth + faction selection + demo quick-access
├── /onboarding               New user onboarding flow
├── /dashboard                RPG Admin Console (6 stat cards, faction chart, activity)
├── /inventory                Loot Scanner (grid/list, batch ops, scan modal, scrap yard)
├── /bounty-board             Quest Board (active/fulfilled, wizard, fulfillment workflow)
├── /nexus                   The Nexus (LFG + Ghost Data scores + Save Rooms)
├── /shopkeeper              AI Chat (voice input, markdown, follow-ups, history)
├── /analytics               Business Intelligence (KPIs, platform dist, faction mix)
├── /profile                 User profile (XP bar, badges, purchase history, edit)
├── /settings                BYO Keys (Stripe, Twilio, AI, IoT + store info + features)
├── /potions                 Potions menu, ordering
├── /[tenant]/dashboard      Subdomain-routed tenant view
├── /[tenant]/bounties       Subdomain-routed bounties
├── /[tenant]/nexus          Subdomain-routed nexus
├── /legal/terms             Terms of Service
├── /legal/privacy           Privacy Policy
├── /legal/cookies           Cookie Policy
├── /legal/refunds           Refund Policy
├── /robots.txt              SEO
├── /sitemap.xml             SEO

API Routes (47):
├── /api/inventory                   GET/POST
├── /api/bounties                    GET/POST
├── /api/bounties/{id}               GET/PUT
├── /api/bounties/price-suggest      GET
├── /api/ai/shopkeeper               POST
├── /api/ai/oracle                   POST
├── /api/vision/appraise             POST
├── /api/nexus/lfg                   GET/POST
├── /api/nexus/lfg/{id}              GET/PUT
├── /api/nexus/lfg/{id}/join         POST
├── /api/nexus/lfg/{id}/leave        POST
├── /api/nexus/lfg/{id}/pay          POST
├── /api/nexus/lfg/{id}/refund       POST
├── /api/nexus/lfg/{id}/funding-status GET
├── /api/nexus/scores                GET/POST
├── /api/nexus/rooms                 GET/POST
├── /api/nexus/rooms/{id}            GET/PUT
├── /api/nexus/rooms/book            POST
├── /api/nexus/rooms/confirm         POST
├── /api/auth/send-otp               POST
├── /api/auth/verify-otp             POST
├── /api/auth/login-attempt          POST
├── /api/identity/verify             POST
├── /api/security/blacklist          POST
├── /api/security/csp-report         POST
├── /api/wallet                      GET
├── /api/wallet/transactions         GET
├── /api/webhooks/stripe             POST
├── /api/tenant/settings             GET/PUT
├── /api/system/mode                 GET
├── /api/discounts                   GET/POST/PUT
├── /api/cron/price-sync             GET
├── /api/cron/oracle                 GET
├── /api/cron/faction-war            GET
├── /api/cron/bounty-expire          GET
├── /api/cron/escrow-sweep           GET
├── /api/b2b/arbitrage               GET
├── /api/iot/trigger                 POST
├── /api/potions/menu                GET
├── /api/potions/orders              GET/POST
├── /api/potions/orders/{id}         GET/PUT
├── /api/tavern/stations             GET/POST
├── /api/tavern/bookings             GET/POST
├── /api/tavern/bookings/{id}        GET/PUT
├── /api/vitality/quests             GET/POST
├── /api/discord/role-sync           POST
├── /api/audit/log                   POST

Middleware:
├── proxy.ts                  Subdomain routing + auth gate + demo bypass + session refresh
```

---

## Demo Mode Architecture

**Priority chain:** URL param `?demo=true` -> Zustand localStorage -> `NEXT_PUBLIC_DEMO_MODE` env var (default).

- Landing page "Launch Demo" -> `/dashboard?demo=true`
- Login "Launch Demo Mode" -> `/dashboard?demo=true`
- `proxy.ts` skips auth when `?demo=true` or `NEXT_PUBLIC_DEMO_MODE !== 'false'`
- Merchant layout detects `?demo=true` -> sets Zustand `demoMode: true` + cookie
- All 10 phantom inventory items, 4 bounties, 5 scores, 3 LFGs, 3 rooms, 3 profiles load automatically
- API routes check `isDemoMode()` -> return phantom data in demo, Supabase in production
- `isDemoModeServer(searchParams?)` accepts optional URLSearchParams for URL-first detection
- Demo-aware components: `<DemoAwareLink>`, `demoHref()` utility in `lib/utils/url.ts`
- Realtime hooks simulate events with randomized intervals + jitter in demo mode

---

## Passwordless Auth Flow

GuildOS uses **passwordless OTP/magic-link authentication** via Supabase Auth, with rate limiting on both the send and verify endpoints.

```
Send OTP Flow:
  Client                        API Route                    Supabase
    |                              |                            |
    |-- POST /api/auth/send-otp -->|                            |
    |   { email: "..." }          |                            |
    |                              |-- Validate (Zod schema)    |
    |                              |-- Rate limit (1/min/email) |
    |                              |                            |
    |                              |-- If demo: log OTP to     |
    |                              |   console, return mock     |
    |                              |                            |
    |                              |-- supabase.auth           |
    |                              |   .signInWithOtp() ------->|
    |                              |   (shouldCreateUser: true) |
    |                              |<-- 200 { success: true }   |
    |<-- 200 { success: true }     |                            |
    |                              |                            |
    |   [User receives email with  |                            |
    |    6-digit OTP + magic link] |                            |
    |                              |                            |
    |-- POST /api/auth/verify-otp ->|                            |
    |   { email, token }          |                            |
    |                              |-- Validate (Zod schema)    |
    |                              |-- Rate limit (5/min/IP)    |
    |                              |-- supabase.auth           |
    |                              |   .verifyOtp() ----------->|
    |                              |<-- { session, user }      |
    |                              |                            |
    |                              |-- Check profiles table   |
    |                              |   for isNewUser detection  |
    |<-- { session, user,         |                            |
    |     isNewUser, isDemo }      |                            |
```

**Security measures:**
- OTP send rate limited to 1 per 60 seconds per email address
- OTP verify rate limited to 5 per 60 seconds per IP address
- Zod validation on both endpoints with descriptive error messages
- Expired OTP detection and distinct error message
- Demo mode blocked in production environments (`process.env.NODE_ENV === 'production'` check)
- Session created via Supabase `createServerClient` with proper cookie handling

**Demo mode:** OTP is logged to `console.log()` and returned in the response for easy testing.

---

## Vercel KV Rate Limiting Architecture

GuildOS implements **distributed rate limiting** using Vercel KV (Redis-compatible) with an in-memory fallback.

### Architecture

```
                        Request
                           |
                    +------v-------+
                    |  rateLimit()  |
                    | (key, opts)   |
                    +------+-------+
                           |
              +------------+------------+
              |                         |
     +--------v--------+       +--------v--------+
     |  Vercel KV       |       |  In-Memory Map   |
     |  (distributed)   |       |  (per-instance)   |
     +--------+---------+       +--------+---------+
              |                         |
     [Shared across all        [Per-Vercel-serverless
      serverless instances]      instance only]
              |                         |
     +--------v--------+       +--------v--------+
     |  Sliding Window  |       |  Simple Counter  |
     |  (4-bucket,      |       |  (reset window)  |
     |   time-weighted)  |       +-----------------+
     +------------------+
```

### KV Sliding Window Algorithm

```
windowMs = 60000
bucketSize = windowMs / 4 = 15000ms

Current time: t
Current bucket: floor(t / 15000)
Previous bucket: Current bucket - 1

total = currentCount + (prevCount * (1 - elapsedInCurrent / bucketSize))
reject if total > maxRequests
```

Each bucket has TTL = `bucketSize * 2` (30s for a 60s window) to handle clock skew.

### Composite Key Strategy

Keys are built from the client IP (x-forwarded-for) + a hash of the user-agent header. This prevents trivial bypass via IP rotation and makes in-memory fallback harder to attack:

```
key format: "{prefix}:{ip}:{ua_hash}"
example: "send-otp:203.0.113.42:a1b2c3"
```

### Configuration Warning

In production without KV, the module emits `console.error()` at cold start:
```
CRITICAL: Vercel KV is not configured in production.
Rate limiting falls back to per-instance in-memory storage...
Attackers can bypass limits by spraying requests across instances.
```

### Rate Limited Endpoints

| Endpoint | Window | Max | Key Pattern |
|----------|--------|-----|-------------|
| `POST /api/auth/send-otp` | 60s | 1 | `send-otp:{email}` |
| `POST /api/auth/verify-otp` | 60s | 5 | `verify-otp:{ip}` |
| `POST /api/ai/shopkeeper` | 60s | 20 | `shopkeeper:{ip}:{ua_hash}` |
| `POST /api/ai/oracle` | 60s | 30 | `oracle:{ip}:{ua_hash}` |

---

## Stripe Connect Split-Pay Flow

LFG lobbies implement **multi-player split payments** via Stripe Connect Express, with escrow handling and auto-refunds.

### Architecture

```
+----------------+      +-----------------------+      +------------------+
|  Player Pays   |----->|  Stripe Checkout       |----->|  Platform        |
|  Their Share   |      |  (per-player session)  |      |  (receives fee)  |
+----------------+      +-----------------------+      +------------------+
                                                               |
                                                    +----------v-----------+
                                                    |  Stripe Connect      |
                                                    |  + Merchant Account  |
                                                    |  (receives balance)  |
                                                    +----------+-----------+
                                                               |
                                                    +----------v-----------+
                                                    |  Pool of Partial     |
                                                    |  Payments (escrow)   |
                                                    +----------+-----------+
                                                               |
                                                    +----------v-----------+
                                                    |  Fully Funded?       |
                                                    |  -> Release escrow   |
                                                    |  -> Auto-refund if   |
                                                    |     deadline passes  |
                                                    +----------------------+
```

### Flow Steps

1. **Host creates LFG lobby** with total cost and max players
2. **Cost per player** calculated: `Math.ceil(totalCost / maxPlayers * 100) / 100`
3. **Each player creates a Checkout Session** via `POST /api/nexus/lfg/{id}/pay`
4. **Stripe SDK** creates a `payment_intent` with `transfer_group` for Connect
5. **Funding status tracked** per lobby (totalCost, playersPaid, amountFunded)
6. **When fully funded** -- funds released to merchant's Connect Express account
7. **On deadline miss** -- `triggerAutoRefund()` reverses all partial payments
8. **Cron job** (`/api/cron/escrow-sweep`) sweeps unfunded lobbies past deadline

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/stripe-connect.ts` | Client-side: createSplitPayment, createPlayerPaymentSession, checkFunding, refund |
| `src/app/api/nexus/lfg/{id}/pay/route.ts` | Server: creates Stripe Checkout session for one player's share |
| `src/app/api/nexus/lfg/{id}/refund/route.ts` | Server: auto-refunds all partial payments |
| `src/app/api/nexus/lfg/{id}/funding-status/route.ts` | Server: returns current funding state |
| `src/app/api/cron/escrow-sweep/route.ts` | Cron: sweeps expired unfunded lobbies |

### Stripe Connect Express Onboarding

Merchants who want to receive payouts directly go through Stripe Connect Express onboarding:

```typescript
// Creates a Connect account + returns onboarding URL
const { accountId, onboardingUrl } = await createConnectAccount(merchantId, email);
```

---

## Vitality Protocol Data Flow

The Vitality Protocol is a **QR-code-based health challenge system** that rewards physical wellness with in-game XP and stamina.

### System Architecture

```
+------------------+     +---------------------+     +------------------+
|  QR Code on      |---->|  /api/vitality/     |---->|  Stamina Engine  |
|  Station Sign    |     |  quests              |     |  (drain/regen)   |
+------------------+     +---------------------+     +------------------+
                                                              |
      +-----------------------+--------------------+----------+----------+
      |                       |                    |                     |
+-----v------+        +-------v-------+   +-------v-------+    +-------v-------+
| XP Engine   |        | Achievement   |   | Debuff System  |    |  Cooldown     |
| (awards XP) |        | Checker       |   | (SEDENTARY,    |    |  Tracker      |
+-------------+        +---------------+   | DEHYDRATION,   |    |  (per quest)  |
                                           | FATIGUE,       |    +---------------+
                                           | SCREEN_FATIGUE)|
                                           +----------------+
```

### Quest Types

| Type | Description | XP | Stamina Restore | Cooldown |
|------|-------------|----|-----------------|----------|
| STRETCH | Physical stretch exercises | 50 | 20 | 60 min |
| HYDRATION | Drink water | 30 | 25 | 90 min |
| POSTURE_CHECK | Power stance / posture | 40 | 15 | 120 min |
| EYE_REST | 20/20/20 rule | 20 | 10 | 30 min |
| SOCIAL | Introduce yourself to someone new | 50 | 30 | 180 min |
| MINDFULNESS | Box breathing / meditation | 35 | 20 | 60 min |

### Stamina System

```
Stamina drain (active):     stamina -= 15 points/hour
Stamina regen (inactive):   stamina += 20 points/hour (faster than drain)
SEDENTARY debuff threshold: 3 hours consecutive activity
Debuff duration:            30 minutes
XP earning block:           true while debuff active
```

### Data Flow

```
User scans QR -> /api/vitality/quests POST
  -> validateQuestQR(quest, scannedHash)
  -> getCooldownEnd(quest)
  -> calculateXPReward('VITALITY_QUEST')
  -> checkLevelUp(oldXP, newXP)
  -> clearDebuff(staminaState)
  -> checkAchievements(stats, unlocked)
  -> { xpAwarded, staminaRestored, achievementsUnlocked, leveledUp }
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/vitality/quests.ts` | Quest logic: availability, QR validation, cooldowns, demo data |
| `src/lib/vitality/stamina.ts` | Stamina engine: drain/regen, debuffs, XP blocks, color rendering |
| `src/lib/vitality/xp-engine.ts` | XP calculation, level thresholds (PEASANT/RETRO_MAGE/TIME_LORD), tier perks |
| `src/lib/vitality/achievements.ts` | 8 achievements with check functions, 4 rarity tiers |
| `src/components/vitality/character-sheet.tsx` | Character display with stats |
| `src/components/vitality/stamina-bar.tsx` | Stamina bar UI with color coding |
| `src/components/vitality/qr-scanner.tsx` | QR code scanner for station check-in |

---

## Real-Time Subscriptions Architecture

Supabase Realtime provides **live database push** for 7 tables. The system supports both production (real subscriptions) and demo modes (simulated events with jitter).

### Subscription Architecture

```
+-------------------+     +---------------------+
|  RealtimeProvider  |---->|  (wraps app, wires  |
|  (client wrapper)  |     |   store callbacks)  |
+-------------------+     +----------+----------+
                                      |
               +----------------------+----------------------+
               |                      |                      |
     +---------v--------+   +---------v--------+   +--------v---------+
     | useInventoryRealt|   | useBountyRealtime|   | useFactionRealtim|
     | (inventory table)|   | (bounties table) |   | (faction_standngs)|
     +---------+---------+   +---------+---------+   +---------+--------+
               |                      |                      |
     +---------v--------+   +---------v--------+   +--------v---------+
     | useRealtimeSubsc|   | useRealtimeSubsc|   | useRealtimeSubsc |
     | ription()       |   | ription()       |   | ription()        |
     +---------+---------+   +---------+---------+   +---------+--------+
               |                      |                      |
     +---------v-------------------------v-------------------v--------+
     |              Generic Subscription Hook                        |
     |  Production: postgres_changes on guildos_core.{table}         |
     |  Demo: setInterval with random payloads + jitter              |
     +----------------------------------------------------------------+
```

### Subscribed Tables

| Table | Event Types | Store Action(s) | Interval |
|-------|-------------|-----------------|----------|
| `activity_feed` | INSERT, UPDATE, DELETE | `addActivity()` | 8s (demo) |
| `inventory` | INSERT, UPDATE, DELETE | `addInventoryItem()`, `updateInventoryItem()`, `removeInventoryItem()` | 12s (demo) |
| `bounties` | INSERT, UPDATE, DELETE | `addBounty()`, `updateBounty()`, `removeBounty()` | 15s (demo) |
| `faction_standings` | INSERT, UPDATE | `setFactionStandings()` | 20s (demo) |
| `bounty_stats` | INSERT, UPDATE | `setBountyStats()` | 30s (demo) |
| `nexus_lfgs` | INSERT, UPDATE | `addLfgLobby()`, `updateLfgLobby()` | 18s (demo) |
| `nexus_lfg_participants` | INSERT, DELETE | `addLfgParticipant()`, `removeLfgParticipant()` | 22s (demo) |

### Production Enhancement for LFG Participants

In demo mode, LFG participant subscriptions use the first lobby's ID:
```typescript
useLfgParticipantsRealtime(
  useGuildStore.getState().lfgLobbies[0]?.id ?? "",
  callback,
);
```

In production, this should be enhanced to subscribe per-active-lobby for any lobby the user is participating in.

### Demo Simulation

In demo mode, events are generated at configurable intervals with:
- 60% INSERT, 25% UPDATE, 15% DELETE probability distribution
- Randomized jitter (+/- 1000ms) added to timing
- Domain-specific dummy payloads for each table type
- No actual Supabase connection established

### Connection Management

- Auto-reconnect with exponential backoff (1s -> 2s -> 4s -> 8s -> 16s -> 30s max)
- Max 5 retries before permanent "disconnected" status
- Cleanup on unmount (channel removal)
- `useRef` for callback stability (prevents re-subscription on render)

---

## CSP Violation Reporting Flow

GuildOS receives Content Security Policy violation reports via a dedicated endpoint.

### Architecture

```
+------------------+     +---------------------+     +------------------+
|  Browser          |---->|  POST /api/security/ |---->|  guildos_core   |
|  (detects CSP     |     |  csp-report           |     |  .csp_violations |
|   violation)      |     |                       |     |  table           |
+------------------+     +---------------------+     +------------------+
                                |                            |
                                |  (always returns 204)      |  (INSERT)
                                |                            |
                                v                            v
                         [console.warn if DB     [stored for
                          insert fails]           security audit]
```

### Report Format

The endpoint receives standard CSP violation reports:

```json
{
  "csp-report": {
    "blocked-uri": "https://evil.com/malicious.js",
    "violated-directive": "script-src 'self'",
    "document-uri": "https://guildos-flax.vercel.app/shopkeeper",
    "source-file": "https://guildos-flax.vercel.app/_next/static/...",
    "line-number": 42
  }
}
```

### Key Behaviors

- Always returns HTTP 204 (No Content) per CSP spec, even on errors
- Logs to `csp_violations` table in `guildos_core` schema
- Falls back to `console.warn()` if DB insert fails (network, schema missing, etc.)
- Sanitizes field lengths (blocked_uri max 2048 chars, directives max 256)
- Catch-all wrapping prevents the endpoint itself from ever erroring
- Reports are queryable for security audit and incident response

### Key File

| File | Purpose |
|------|---------|
| `src/app/api/security/csp-report/route.ts` | CSP violation receiver, DB insert + console fallback |

---

## Audit Logging Architecture

All sensitive actions across the platform are logged for security and compliance.

### Architecture

```
+------------------+     +---------------------+     +------------------+
|  Client Component |---->|  logAction()         |---->|  POST /api/audit/ |
|  (useGuildStore,  |     |  (lib/audit.ts)      |     |  log              |
|   page, widget)   |     |                      |     +--------+---------+
+------------------+     +---------------------+              |
                                                               |
                                                     +---------v--------+
                                                     |  guildos_core    |
                                                     |  .audit_log      |
                                                     |  table            |
                                                     +------------------+
```

### 17 Auditable Actions

| Action | When Triggered |
|--------|---------------|
| CREATE | Item scanned, bounty posted, lobby created |
| UPDATE | Settings changed, bounty updated, profile edited |
| DELETE | Item scrapped, bounty removed |
| LOGIN | User authenticates |
| LOGOUT | User signs out |
| PAYMENT | Checkout completed, subscription paid |
| REFUND | Escrow refunded, manual refund issued |
| BOOKING | Save room or station booked |
| IDENTITY_VERIFY | Identity verification completed |
| WAIVER_ACCEPT | Legal waiver signed |
| PERMISSION_CHANGE | User role/permissions changed |
| BOUNTY_CLAIM | Bounty claimed by player |
| BOUNTY_FULFILL | Bounty fulfilled with proof |
| LFG_JOIN | Player joins an LFG lobby |
| LFG_HOST | Player creates/hosts an LFG lobby |
| SETTINGS_CHANGE | Tenant BYO key configuration changed |
| STATION_BOOK | Tavern station booked |

### Log Entry Schema

```typescript
interface AuditLogEntry {
  id: string;                    // UUID
  organization_id: string;       // Tenant org ID
  profile_id: string;            // User who performed action
  action: AuditAction;           // 17 possible values
  resource_type: string;         // e.g., "inventory", "bounty", "nexus_lfg"
  resource_id?: string;          // ID of affected resource
  metadata?: Record<string, unknown>; // Arbitrary contextual data
  ip_address?: string;           // Client IP (set server-side)
  user_agent?: string;           // Browser user agent (set server-side)
  created_at: string;            // ISO 8601 timestamp
}
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/audit.ts` | Client library: `logAction()`, `getAuditTrail()`, `getUserActions()`. 17 action types. Demo mode falls back to `console.log`. |
| `src/app/api/audit/log/route.ts` | Server endpoint: receives audit entries, validates, inserts into DB. |

---

## XSS Prevention & Security Model

### Input Validation
- Zod schemas on all API routes (Zod 4)
- LIKE wildcard escaping on search endpoints (prevents `%` / `_` injection)
- CSP headers with violation reporting

### Authentication Security
- Rate limiting on auth endpoints (1 send/min/email, 5 verify/min/IP)
- Demo mode blocked in production for verify-otp
- Service role key is server-only
- JWT session refresh in middleware

### Output Sanitization
- React's built-in XSS protection (JSX auto-escapes)
- `dangerouslySetInnerHTML` never used on user-supplied data
- AI Shopkeeper output rendered through markdown parser

### Rate Limiting Security
- Distributed (Vercel KV) preferred; in-memory fallback warned
- Composite keys (IP + user-agent hash) prevent trivial bypass
- Sliding window algorithm prevents burst attacks
- Production KV absence emits critical error

### Error Leakage Protection
- Generic error messages returned to users (no stack traces, no SQL, no column names)
- Internal errors logged server-side only
- Dev stack traces only in development mode

---

## Premium Design System

| Feature | Implementation |
|---------|---------------|
| Glassmorphism | `.glass-card`, `.glass-panel`, `.glass-modal` with backdrop-blur |
| Neon Glow V2 | 5 color variants (gold, legendary, XP, faction colors, destructive) |
| 3D Card Tilt | CSS `perspective` + Framer Motion spring on hover |
| Animated Borders | CSS `@property` based gradient border animations |
| Particle Backgrounds | CSS dot-grid patterns + moving gradients |
| Skeleton Loaders | 5 variants matching real component shapes with shimmer |
| Toast System | 5 types (success/error/warning/info/legendary) with progress bar |
| Command Palette | Cmd+K fuzzy search across inventory, bounties, navigation |
| Mobile Nav | Bottom tab bar (md:hidden) with notification badge |
| Page Transitions | Framer Motion `AnimatePresence` with staggered children |
| Sound Design | Web Audio API synthesized: hover, click, success, legendary, error, notify, konami |
| Confetti | Canvas-based particles with 7 color palettes and physics |
| Level-Up | Full-screen overlay with XP orb particles and perks display |
| Legendary Drop | Golden rays, floating dust, typewriter text, IoT trigger |
| Live Ticker | Infinite scroll horizontal ticker with color-coded events |
| Konami Code 2.0 | 6 codes: Konami, IDDQD, IDKFA, NES, GB, SNES -- each unique effect |

---

## Vercel Cron Jobs

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Price Sync | Daily 04:00 UTC | `/api/cron/price-sync` |
| Bounty Expire | Daily 04:00 UTC | `/api/cron/bounty-expire` |
| Escrow Sweep | Daily 06:00 UTC | `/api/cron/escrow-sweep` |
| B2B Arbitrage | Daily 08:00 UTC | `/api/b2b/arbitrage` |
| Oracle Engine | Daily 10:00 UTC | `/api/cron/oracle` |
| Faction War | Monthly 28-31, 23:59 UTC | `/api/cron/faction-war` |

Note: Vercel Hobby tier limits crons to max 1/day each. All endpoints are authenticated via `x-cron-secret` header matching `CRON_SECRET` env var.

---

## Environment Variables (27 vars, set on Vercel)

```
# --- Supabase (Required) ---
NEXT_PUBLIC_SUPABASE_URL          = https://tyustwqwvjmzvuazfwkv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = [Aegis anon key]
SUPABASE_SERVICE_ROLE_KEY         = [Aegis service role]

# --- App (Required) ---
NEXT_PUBLIC_APP_URL               = https://guildos-flax.vercel.app
NEXT_PUBLIC_DEMO_MODE             = false

# --- Stripe (Optional) ---
STRIPE_SECRET_KEY                 = sk_test_...
STRIPE_WEBHOOK_SECRET             = whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_PRICE_MERCHANT             = price_...
STRIPE_PRICE_WIZARD               = price_...
STRIPE_PRICE_TIME_LORD            = price_...

# --- Twilio (Optional) ---
TWILIO_ACCOUNT_SID                = AC...
TWILIO_AUTH_TOKEN                 = ...
TWILIO_PHONE_NUMBER               = +15551234567

# --- AI (Optional) ---
NVIDIA_NIM_API_KEY                = nvapi-...

# --- PriceCharting (Optional) ---
PRICECHARTING_API_KEY             = ...

# --- Cron (Required) ---
CRON_SECRET                       = guildos-cron-prod-v1-2026

# --- Vercel KV (Required in production) ---
KV_URL                            = redis://...
KV_REST_API_URL                   = https://...
KV_REST_API_TOKEN                 = ...
KV_REST_API_READ_ONLY_TOKEN       = ...

# --- Security (Required) ---
BLACKLIST_VERIFICATION_KEY        = ...
IOT_WEBHOOK_URL                   = https://...
```

Tenant BYO keys (Stripe, Twilio, PriceCharting, AI, IoT) are NOT in Vercel env vars -- each tenant configures their own via the `/settings` page, stored in `organizations.config` JSONB.

---

## Project Structure

```
GuildOS/
├── DEPLOY.md                            # Production deployment guide
├── OPS.md                               # Operations runbook
├── STATE.md                             # Build status + known issues
├── ARCHITECTURE.md                      # This file
├── HANDOVER.md                          # Dev setup guide
├── AGENTS.md                            # AI agent behavior rules
├── CLAUDE.md                            # Project overview (root README)
├── schema.sql                           # 13 tables, RLS, triggers (guildos_core)
├── vercel.json                          # Build config + 6 cron jobs
├── .env.example                         # 27 documented env vars
├── GuildOS_PRD.md                       # Product requirements
├── frontend/
│   ├── package.json                     # Next.js 16 + deps
│   ├── .env.local                       # Local Supabase credentials (gitignored)
│   ├── playwright.config.ts             # E2E test config
│   ├── e2e/
│   │   ├── smoke.spec.ts                # 8 smoke tests
│   │   └── critical-path.spec.ts        # 5 critical-path tests
│   ├── src/
│   │   ├── proxy.ts                     # Middleware: subdomain + auth + demo bypass
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root: fonts, metadata, Konami, CommandPalette, Toaster, ErrorBoundary
│   │   │   ├── globals-v2.css           # Premium design system (glassmorphism, neon, animations)
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── login/page.tsx           # Auth + faction + forgot password + demo
│   │   │   ├── onboarding/page.tsx      # New user onboarding
│   │   │   ├── auth/callback/route.ts   # Supabase OAuth callback
│   │   │   ├── robots.ts / sitemap.ts   # SEO
│   │   │   ├── (merchant)/              # 8 merchant pages
│   │   │   ├── [tenant]/                # Subdomain-routed views
│   │   │   ├── legal/                   # Terms, privacy, cookies, refunds
│   │   │   └── api/                     # 47 API route handlers
│   │   ├── lib/
│   │   │   ├── types/                   # TS interfaces, database types, tenant keys, speech types
│   │   │   ├── store/useGuildStore.ts   # Zustand (30+ actions)
│   │   │   ├── api/client.ts            # guildFetch() canonical client
│   │   │   ├── supabase/                # Browser + server clients
│   │   │   ├── toggles/                 # Demo/production switching (client + server)
│   │   │   ├── integrations/            # Stripe, Twilio, PriceCharting
│   │   │   ├── notifications/dispatcher.ts
│   │   │   ├── animations/index.ts      # Framer Motion variants
│   │   │   ├── audio/sounds.ts          # Web Audio API synthesized sounds
│   │   │   ├── hooks/                   # useVoiceInput, useKeyboardShortcut, useIntersectionObserver, useRealtime, useFocusTrap
│   │   │   ├── security/rate-limit.ts   # Distributed rate limiter
│   │   │   ├── validation/schemas.ts    # Zod 4 schemas
│   │   │   ├── audit.ts                # Audit logging library
│   │   │   ├── discord.ts              # Discord OAuth + role sync
│   │   │   ├── identity.ts             # Stripe Identity verification
│   │   │   ├── wallet.ts               # Digital wallet engine
│   │   │   ├── stripe-connect.ts       # Stripe Connect split-pay
│   │   │   ├── error-handler.ts         # Unified error classification
│   │   │   ├── arbitrage/engine.ts      # B2B arbitrage logic
│   │   │   ├── compliance/pawn.ts       # Pawn shop compliance
│   │   │   ├── vitality/               # Quests, stamina, XP engine, achievements
│   │   │   └── utils/url.ts            # demoHref(), isCurrentlyDemoMode(), persistDemoMode()
│   │   ├── components/
│   │   │   ├── ui/                      # Command palette, toaster, skeleton, confirm-dialog, button, empty-state, demo-aware-link, data-table, global-error-boundary
│   │   │   ├── effects/                 # Confetti, level-up, legendary-drop
│   │   │   ├── widgets/                 # Live-ticker, faction-war-live, achievement-toast, xp-bar, demo-banner
│   │   │   ├── layout/mobile-nav.tsx
│   │   │   ├── providers/realtime-provider.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── konami/KonamiListener.tsx
│   │   │   ├── legal/                  # Cookie consent, parental gate, waiver modal, signature pad
│   │   │   ├── payment/payment-method-selector.tsx
│   │   │   ├── tavern/                 # Error-boundary, live-map, station-card
│   │   │   ├── vitality/               # Character-sheet, qr-scanner, stamina-bar
│   │   │   └── bounties/leaderboard.tsx
│   │   └── mocks/phantomData.ts         # 10 inventory + 4 bounties + 5 scores + 3 LFGs + 3 rooms + profiles
│   └── public/manifest.json             # PWA manifest
├── scripts/
│   ├── migrate_final.sh                 # Migration via Supabase Management API
│   ├── migrate.sh                       # Migration via psql
│   ├── run_migration.py                 # Python direct-connect migration
│   ├── production_setup.sh              # One-shot production setup
│   └── generate-types.sh                # Supabase TypeScript types generator
├── supabase/
│   ├── config.toml                      # Local dev config
│   ├── email-templates/                 # Custom HTML email templates
│   └── migrations/0000_initial_schema.sql
└── backend/                             # FastAPI (reference -- replaced by Vercel Cron + API routes)
```

---

## Key Architectural Decisions

1. **No separate backend** -- Vercel Cron Jobs + Next.js API routes replace the FastAPI backend. No Render/Railway needed. 6 cron jobs on Vercel schedule.

2. **Demo-first architecture** -- Demo mode is the default. `?demo=true` bypasses auth. All API routes gracefully fall back to mock data. This enables zero-config demos for investors and offline development.

3. **BYO keys, not platform keys** -- Each merchant brings their own Stripe/Twilio/PriceCharting/AI keys. The platform only provides Supabase. This reduces platform costs, improves security, and gives merchants control.

4. **Isolated schema** -- `guildos_core` schema on a shared Supabase project. Zero collision with Aegis `public` schema (86 tables). Migration scripts verify Aegis tables are untouched after each run.

5. **User choice beats env var** -- Demo mode priority: URL param > localStorage > env var. The user's explicit choice always wins. This prevents the "I clicked demo but nothing happens" bug.

6. **Rate limiting is distributed, not per-instance** -- Vercel KV provides shared counters across all serverless instances. Without KV, rate limiting is trivially bypassable by spraying requests. Critical warning emitted at cold start when KV is missing in production.

7. **Passwordless OTP auth** -- No password management. Users authenticate via 6-digit OTP sent to email. Rate limited at send (1/min/email) and verify (5/min/IP) to prevent brute force.

8. **Stripe Connect split-pay** -- LFG lobbies use per-player Checkout Sessions with escrow tracking. Auto-refund on expiry. Connect Express for direct payouts to merchants.

9. **Real-time with demo simulation** -- Supabase Realtime subscriptions for live data. When Supabase Realtime isn't enabled or in demo mode, events are generated client-side with realistic timing and payloads.
