# GuildOS v2.0 — System Architecture

> **Multi-tenant retro-gaming SaaS platform** — AI-powered, RPG-gamified ecosystem for brick-and-mortar game stores.
> **Status:** Production-deployed on Vercel + Aegis Supabase.
> **Last updated:** 2026-06-22

---

## Quick Reference

| Item | Value |
|------|-------|
| **Production URL** | https://guildos-flax.vercel.app |
| **Demo Mode** | Append `?demo=true` to any page (bypasses auth, loads mock data) |
| **Supabase Project** | Aegis-OS-DB (`tyustwqwvjmzvuazfwkv`) |
| **Schema** | `guildos_core` (isolated from Aegis `public` — 86 Aegis tables untouched) |
| **Vercel Project** | vec717/guildos |
| **GitHub** | ivansantoyo-source/guildos-prototype |
| **Node** | `cd frontend && npm run dev` |

---

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Turbopack) | 33 pages, 22 API routes, proxy middleware |
| **State** | Zustand 5 (persist middleware) | Demo mode, domain data, UI state |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Framer Motion | Glassmorphism, neon glow, 3D cards, page transitions |
| **Animations** | Framer Motion + CSS @property | Page transitions, card tilt, confetti, effects |
| **Audio** | Web Audio API (synthesized, no files) | 7 sounds: hover, click, success, legendary, error, notification, konami |
| **Auth** | Supabase Auth (JWT + RLS) | Multi-tenant sessions with `?demo=true` bypass |
| **Database** | Supabase PostgreSQL (Aegis project) | 13 tables in `guildos_core` schema, full RLS + triggers |
| **Cron** | Vercel Cron Jobs (4 daily) | Price sync, Oracle, B2B arbitrage, Faction war |
| **AI** | NVIDIA NIM (DeepSeek-V3) + mock fallback | Synthetic Shopkeeper with 8 keyword patterns |
| **Payments** | Stripe (BYO keys per tenant) | Checkout sessions, billing portal, webhooks |
| **SMS** | Twilio (BYO keys per tenant) | Wandering Merchant, Score Dethroned, Oracle alerts |
| **Pricing** | PriceCharting (BYO keys per tenant) | Live market prices with demo fallback |

---

## BYO Key Architecture (Multi-Tenant SaaS)

**Platform keys** (one per platform, set in Vercel env vars):
- Supabase URL, anon key, service role key — shared infrastructure
- CRON_SECRET, BLACKLIST_VERIFICATION_KEY

**Tenant BYO keys** (each merchant brings their own, stored in `organizations.config` JSONB):
- Stripe (publishable, secret, webhook) — each store gets paid directly
- Twilio (account SID, auth token, phone) — each store sends their own SMS
- PriceCharting API key — each store's market data
- NVIDIA NIM / OpenAI key — each store's AI shopkeeper
- IoT webhook URL — each store's smart devices

**Graceful degradation:** If a tenant hasn't configured a key, that feature falls back to mock/simulated mode without breaking the rest of the platform.

Tenant settings page: `/settings` — merchants configure their keys in a 3-tab UI (API Keys, Store Info, Features).

---

## Database: `guildos_core` Schema (13 Tables)

**Critical:** This shares a free-tier Supabase with the Aegis-OS app. ALL GuildOS tables are in `guildos_core` schema — NEVER in `public`. The `public` schema has 86 Aegis tables that must never be touched.

All tables enforce RLS via `guildos_core.current_user_org_id()` which reads `auth.jwt() -> 'app_metadata' ->> 'organization_id'`.

| Table | Module | Key Feature |
|-------|--------|------------|
| `organizations` | Core | Tenant config JSONB stores BYO keys |
| `profiles` | Core | Faction, XP, level tier (auto-calculated by trigger) |
| `inventory` | Loot Scanner | Legendary flag (auto ≥$150), scrap value, price spike flag |
| `price_history` | Loot Scanner | Market value tracking for algorithmic pricing |
| `bounties` | Quest Board | Computed `store_credit_value = base_price × scarcity_mult` |
| `nexus_lfgs` | The Nexus | LFG lobby management |
| `nexus_lfg_participants` | The Nexus | Lobby membership junction |
| `nexus_scoreboards` | The Nexus | Ghost Data arcade leaderboards |
| `nexus_save_rooms` | The Nexus | Room rentals with QR codes |
| `faction_standings` | Faction Wars | Monthly faction point tracking |
| `discount_codes` | Gamification | Konami Code + faction win + promotions |
| `blacklist_entries` | Security | Cross-tenant fraud ledger (100-mile radius broadcast) |
| `notifications` | System | 10 notification types in-app queue |

**Triggers:** legendary flagging, level tier calculation, updated_at timestamps.

---

## Full Route Map (33 Pages, 22 API Routes)

```
App Router:
├── /                         Landing page (hero, features, faction tease, pricing)
├── /login                    Auth + faction selection + demo quick-access
├── /dashboard                RPG Admin Console (6 stat cards, faction chart, activity)
├── /inventory                Loot Scanner (grid/list, batch ops, scan modal, scrap yard)
├── /bounty-board             Quest Board (active/fulfilled, wizard, fulfillment workflow)
├── /nexus                   The Nexus (LFG + Ghost Data scores + Save Rooms)
├── /shopkeeper              AI Chat (voice input, markdown, follow-ups, history)
├── /analytics               Business Intelligence (KPIs, platform dist, faction mix)
├── /profile                 User profile (XP bar, badges, purchase history, edit)
├── /settings                BYO Keys (Stripe, Twilio, AI, IoT + store info + features)
├── /[tenant]/dashboard      Subdomain-routed tenant view
├── /[tenant]/bounties       Subdomain-routed bounties
├── /[tenant]/nexus          Subdomain-routed nexus
├── /robots.txt              SEO
├── /sitemap.xml             SEO

API Routes:
├── /api/ai/shopkeeper       POST  DeepSeek-V3 chat (NVIDIA NIM + 8-pattern mock)
├── /api/ai/oracle           POST  Predictive tag-matching engine
├── /api/inventory            GET/POST  Inventory CRUD with filters
├── /api/bounties             GET/POST  Bounty management
├── /api/nexus/lfg            GET/POST  LFG lobby management
├── /api/nexus/scores         GET/POST  Scoreboard entries
├── /api/vision/appraise      POST  Image scan + market appraisal
├── /api/iot/trigger          POST  Smart device webhook (legendary drops)
├── /api/b2b/arbitrage        GET   Cross-tenant inventory matching (cron)
├── /api/security/blacklist   POST  Fraud report broadcasting
├── /api/discounts            GET/POST/PUT  Discount code CRUD
├── /api/system/mode          GET   Current mode, tier, features, service status
├── /api/tenant/settings      GET/PUT  Tenant BYO key configuration
├── /api/cron/price-sync      GET   Daily 04:00 UTC price check
├── /api/cron/oracle          GET   Daily 10:00 UTC Oracle engine
├── /api/cron/faction-war     GET   Monthly (28-31) 23:59 faction resolution
├── /api/webhooks/stripe      POST  Stripe subscription lifecycle events
├── /auth/callback            GET   Supabase auth code exchange

Middleware:
├── proxy.ts                  Subdomain routing + auth gate + demo bypass
```

---

## Demo Mode Architecture

**Priority chain:** URL param `?demo=true` → Zustand localStorage → `NEXT_PUBLIC_DEMO_MODE` env var (default).

- Landing page "Launch Demo" → `/dashboard?demo=true`
- Login "Launch Demo Mode" → `/dashboard?demo=true`
- `proxy.ts` skips auth when `?demo=true` or `NEXT_PUBLIC_DEMO_MODE !== 'false'`
- Merchant layout detects `?demo=true` → sets Zustand `demoMode: true` + cookie
- All 10 phantom inventory items, 4 bounties, 5 scores, 3 LFGs, 3 rooms, 3 profiles load automatically
- API routes check `isDemoMode()` → return phantom data in demo, Supabase in production

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
| Command Palette | ⌘K fuzzy search across inventory, bounties, navigation |
| Mobile Nav | Bottom tab bar (md:hidden) with notification badge |
| Page Transitions | Framer Motion `AnimatePresence` with staggered children |
| Sound Design | Web Audio API synthesized: hover, click, success, legendary, error, notify, konami |
| Confetti | Canvas-based particles with 7 color palettes and physics |
| Level-Up | Full-screen overlay with XP orb particles and perks display |
| Legendary Drop | Golden rays, floating dust, typewriter text, IoT trigger |
| Live Ticker | Infinite scroll horizontal ticker with color-coded events |
| Konami Code 2.0 | 6 codes: Konami, IDDQD, IDKFA, NES, GB, SNES — each unique effect |

---

## Vercel Cron Jobs

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Price Sync | Daily 04:00 UTC | `/api/cron/price-sync` |
| Oracle Engine | Daily 10:00 UTC | `/api/cron/oracle` |
| B2B Arbitrage | Daily 08:00 UTC | `/api/b2b/arbitrage` |
| Faction War | Monthly 28-31, 23:59 | `/api/cron/faction-war` |

Note: Vercel Hobby tier limits crons to max 1/day each.

---

## Environment Variables (Set on Vercel)

```
NEXT_PUBLIC_SUPABASE_URL          = https://tyustwqwvjmzvuazfwkv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = [Aegis anon key — encrypted]
SUPABASE_SERVICE_ROLE_KEY         = [Aegis service role — encrypted]
NEXT_PUBLIC_DEMO_MODE             = false
CRON_SECRET                       = guildos-cron-prod-v1-2026
BLACKLIST_VERIFICATION_KEY        = guildos-blacklist-prod-v1-2026
```

Tenant BYO keys (Stripe, Twilio, PriceCharting, AI, IoT) are NOT in Vercel env vars — each tenant configures their own via the `/settings` page, stored in `organizations.config` JSONB.

---

## Project Structure (Current)

```
GuildOS/
├── schema.sql                           # 13 tables, RLS, triggers (guildos_core)
├── vercel.json                          # Build config + 4 cron jobs
├── .env.example                         # All required env vars
├── ARCHITECTURE.md                      # This file
├── STATE.md                             # Build status + known issues
├── HANDOVER.md                          # Dev setup guide
├── GuildOS_PRD.md                       # Product requirements
├── frontend/
│   ├── package.json                     # Next.js 16 + deps
│   ├── .env.local                       # Local Supabase credentials (gitignored)
│   ├── src/
│   │   ├── proxy.ts                     # Middleware: subdomain + auth + demo bypass
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root: fonts, metadata, Konami, CommandPalette, Toaster, ErrorBoundary
│   │   │   ├── globals-v2.css           # Premium design system (glassmorphism, neon, animations)
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── login/page.tsx           # Auth + faction + forgot password + demo
│   │   │   ├── auth/callback/route.ts   # Supabase OAuth callback
│   │   │   ├── robots.ts / sitemap.ts   # SEO
│   │   │   ├── (merchant)/
│   │   │   │   ├── layout.tsx           # Sidebar + header + breadcrumbs + mobile nav + FAB
│   │   │   │   ├── dashboard/           # 6-widget RPG console + alerts + quick actions
│   │   │   │   ├── inventory/           # Grid/list, batch ops, scan modal, scrap yard
│   │   │   │   ├── bounty-board/        # Active/fulfilled, wizard, fulfillment workflow
│   │   │   │   ├── nexus/               # LFG + Ghost Data + Save Rooms (3 tabs)
│   │   │   │   ├── shopkeeper/          # AI chat + voice + markdown + follow-ups
│   │   │   │   ├── analytics/           # KPIs, platform dist, condition breakdown, faction mix
│   │   │   │   ├── profile/             # XP bar, badges, purchase history, edit
│   │   │   │   └── settings/            # BYO keys (3 tabs: Keys, Store, Features)
│   │   │   ├── [tenant]/                # Subdomain-routed views
│   │   │   └── api/                     # 22 API route handlers
│   │   ├── lib/
│   │   │   ├── types/
│   │   │   │   ├── index.ts             # 25+ TS interfaces
│   │   │   │   ├── database.ts          # Supabase generated types
│   │   │   │   ├── tenant-keys.ts       # BYO key types + detection
│   │   │   │   └── speech.d.ts          # Web Speech API types
│   │   │   ├── store/useGuildStore.ts   # Zustand (30+ actions)
│   │   │   ├── api/client.ts            # guildFetch() canonical client
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts            # Browser client (guildos_core schema)
│   │   │   │   └── server.ts            # Server client (guildos_core schema)
│   │   │   ├── toggles/
│   │   │   │   ├── index.ts             # Demo/production toggle (URL > localStorage > env)
│   │   │   │   └── server.ts            # Server-side demo detection (cookies)
│   │   │   ├── integrations/
│   │   │   │   ├── pricecharting.ts     # Market price API + demo mock
│   │   │   │   ├── twilio.ts            # SMS + Wandering Merchant + Score Dethroned
│   │   │   │   ├── stripe.ts            # Checkout + billing portal + subscriptions
│   │   │   │   └── index.ts             # Barrel export
│   │   │   ├── notifications/dispatcher.ts  # 10-type notification dispatch + IoT triggers
│   │   │   ├── animations/index.ts      # Framer Motion variants (7 types)
│   │   │   ├── audio/sounds.ts          # Web Audio API synthesized sounds (7 types)
│   │   │   ├── hooks/
│   │   │   │   ├── useVoiceInput.ts     # Web Speech API with silence detection
│   │   │   │   ├── useKeyboardShortcut.ts  # Global keyboard shortcuts
│   │   │   │   ├── useIntersectionObserver.ts  # Lazy loading
│   │   │   │   └── useRealtime.ts       # Supabase Realtime + demo simulation
│   │   │   └── utils.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── command-palette.tsx   # ⌘K fuzzy search modal
│   │   │   │   ├── toaster.tsx           # Toast notification system (5 types)
│   │   │   │   ├── skeleton.tsx          # 5 skeleton loader variants
│   │   │   │   ├── confirm-dialog.tsx    # Glass modal with focus trap
│   │   │   │   ├── empty-state.tsx       # 7 domain-specific variants
│   │   │   │   ├── button.tsx            # shadcn button
│   │   │   │   └── data-table.tsx        # Sortable table with bulk ops
│   │   │   ├── effects/
│   │   │   │   ├── confetti.tsx          # Canvas particle engine (7 palettes)
│   │   │   │   ├── level-up.tsx          # Full-screen tier celebration
│   │   │   │   └── legendary-drop.tsx    # Golden rays + dust + typewriter
│   │   │   ├── widgets/
│   │   │   │   ├── live-ticker.tsx        # Horizontal scrolling events
│   │   │   │   ├── faction-war-live.tsx   # Animated bars + countdown
│   │   │   │   ├── achievement-toast.tsx  # Queue-based rarity toasts
│   │   │   │   └── xp-bar.tsx            # Animated XP progress bar
│   │   │   ├── layout/mobile-nav.tsx     # Bottom tab bar (mobile)
│   │   │   ├── error-boundary.tsx        # React error boundary
│   │   │   └── konami/KonamiListener.tsx # 6 cheat codes + confetti + discount API
│   │   └── mocks/phantomData.ts         # 10 inventory + 4 bounties + 5 scores + 3 LFGs + 3 rooms + profiles
│   └── public/manifest.json              # PWA manifest
├── scripts/
│   ├── migrate_final.sh                  # Migration via Supabase Management API
│   ├── migrate.sh                        # Migration via psql
│   ├── run_migration.py                  # Python direct-connect migration
│   ├── production_setup.sh               # One-shot production setup
│   └── generate-types.sh                 # Supabase TypeScript types generator
├── supabase/
│   ├── config.toml                       # Local dev config
│   └── migrations/0000_initial_schema.sql
└── backend/                              # FastAPI (reference — replaced by Vercel Cron + API routes)
```

---

## Key Architectural Decisions

1. **No separate backend** — Vercel Cron Jobs + Next.js API routes replace the FastAPI backend. No Render/Railway needed. Cron jobs are free on Vercel Hobby (max 1/day each).

2. **Demo-first architecture** — Demo mode is the default. `?demo=true` bypasses auth. All API routes gracefully fall back to mock data. This enables zero-config demos for investors and offline development.

3. **BYO keys, not platform keys** — Each merchant brings their own Stripe/Twilio/PriceCharting/AI keys. The platform only provides Supabase. This reduces platform costs, improves security, and gives merchants control.

4. **Isolated schema** — `guildos_core` schema on a shared Supabase project. Zero collision with Aegis `public` schema (86 tables). Migration scripts verify Aegis tables are untouched after each run.

5. **User choice beats env var** — Demo mode priority: URL param > localStorage > env var. The user's explicit choice always wins. This prevents the "I clicked demo but nothing happens" bug.
