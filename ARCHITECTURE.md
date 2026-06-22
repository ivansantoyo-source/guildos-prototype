# GuildOS v1.0.0 — System Architecture

> **Multi-tenant retro-gaming SaaS platform** transforming brick-and-mortar game stores into AI-powered, RPG-gamified ecosystems.

---

## Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Turbopack) | SSR/SSG pages, BFF API routes |
| **State** | Zustand 5 (persist middleware) | Client-side state with demo mode |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Retro-gaming terminal dark theme |
| **Auth** | Supabase Auth (JWT + RLS) | Multi-tenant user sessions |
| **Database** | Supabase PostgreSQL | 13 tables in isolated `guildos_core` schema, full RLS, triggers |
| **AI** | NVIDIA NIM (DeepSeek-V3) | Synthetic Shopkeeper, The Oracle |
| **Backend** | FastAPI (Phase 2) | Cron jobs, pricing sync, B2B engine |
| **IoT** | Make/Zapier Webhooks | In-store smart device triggers |

---

## Multi-Tenant Architecture

```
Request Flow:
┌──────────────────────────────────────────────────────┐
│ Browser: timewarp.guildos.com/dashboard              │
└──────────────┬───────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────┐
│ proxy.ts (Next.js 16 Proxy)                          │
│ 1. Supabase session refresh                          │
│ 2. Subdomain → tenant resolution                     │
│ 3. Inject x-tenant-subdomain header                  │
│ 4. Rewrite to /[tenant]/... routes                   │
│ 5. Auth gate for protected routes                    │
└──────────────┬───────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────┐
│ App Router                                           │
│ ├─ / .......................... Landing page          │
│ ├─ /login .................... Auth (faction select)  │
│ ├─ /dashboard ................ RPG Admin Console      │
│ ├─ /inventory ................ Loot Scanner Matrix    │
│ ├─ /bounty-board ............. Quest Board            │
│ ├─ /nexus .................... LFG + Scores + Rooms   │
│ ├─ /shopkeeper ............... AI Chat Interface      │
│ ├─ /[tenant]/dashboard ....... Subdomain tenant view  │
│ └─ /api/... .................. 8 API route handlers   │
└──────────────────────────────────────────────────────┘
```

---

## Database Schema (13 Tables — `guildos_core`)

**Schema Isolation Strategy:** This project shares a free-tier Supabase database with another application. All GuildOS tables live in a dedicated `guildos_core` PostgreSQL schema — NEVER in `public`. The search_path is configured as `guildos_core, public, auth` for all roles (authenticated, anon, service_role). This ensures zero collision with other applications on the same database.

All tables enforce `ENABLE ROW LEVEL SECURITY` with tenant isolation via `current_user_org_id()`. The function reads `auth.jwt() -> 'app_metadata' ->> 'organization_id'`.

### Core
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `organizations` | Tenant/storefront records | Own-org read |
| `profiles` | Gamified user accounts (faction, XP, level tier) | Own-org read, self-update |

### Inventory Module
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `inventory` | Physical stock (platform, condition, market value) | Full tenant isolation |
| `price_history` | Historical market value tracking | Full tenant isolation |

### Bounty Board Module
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `bounties` | Community supply chain quests | Tenant isolation + public read (active) |

### Nexus Module
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `nexus_lfgs` | Looking For Group lobbies | Full tenant isolation |
| `nexus_lfg_participants` | Lobby membership junction | Via LFG ownership |
| `nexus_scoreboards` | Ghost Data arcade leaderboards | Tenant isolation + public read |
| `nexus_save_rooms` | Physical space rental subscriptions | Full tenant isolation |

### Gamification
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `faction_standings` | Monthly faction war tracking | Full tenant isolation |
| `discount_codes` | Konami Code + promotion codes | Full tenant isolation |

### Security & System
| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `blacklist_entries` | Zero-knowledge fraud ledger | Cross-tenant read, own-tenant write |
| `notifications` | In-app notification queue | Own-user read |

### Triggers
- `trg_inventory_legendary`: Auto-flags items with `market_value >= 150` as legendary
- `trg_profiles_level_tier`: Auto-calculates tier (PEASANT → RETRO_MAGE → TIME_LORD) from XP
- `trg_*_updated_at`: Auto-updates timestamps on all core tables

---

## API Routes

| Endpoint | Methods | Auth | Purpose |
|----------|---------|------|---------|
| `/api/ai/shopkeeper` | POST | Yes | DeepSeek-V3 AI chat (NVIDIA NIM + mock fallback) |
| `/api/inventory` | GET, POST | Yes | Inventory CRUD with filters |
| `/api/bounties` | GET, POST | Mixed | Bounty management (public GET for active) |
| `/api/nexus/lfg` | GET, POST | Yes | LFG lobby management |
| `/api/nexus/scores` | GET, POST | Yes | Scoreboard entries |
| `/api/vision/appraise` | POST | Yes | Image scan + market appraisal |
| `/api/iot/trigger` | POST | Yes | Smart device webhook trigger |
| `/api/b2b/arbitrage` | GET | Cron | Cross-tenant inventory matching |
| `/api/security/blacklist` | POST | Yes | Fraud report broadcasting |
| `/auth/callback` | GET | No | Supabase auth code exchange |

---

## State Management (Zustand)

```
useGuildStore
├── Auth: tenant, user, isAuthenticated, demoMode
├── UI: sidebarCollapsed, activeModule, shopkeeperOpen
├── Data: inventory[], bounties[], lfgLobbies[], scoreboards[],
│         factionStandings[], notifications[], dashboardStats,
│         activityFeed[], shopkeeperMessages[]
└── Persist: demoMode, sidebarCollapsed, activeModule (localStorage)
```

**Demo Mode**: When `demoMode: true`, the merchant layout auto-loads phantom data from `mocks/phantomData.ts` — 10 inventory items, 4 bounties, 5 scores, 3 LFG lobbies, 3 faction standings, and 6 activity events. No Supabase connection required.

---

## Gamification Engine

### Faction Wars
- 3 factions: `SEGA_SYNDICATE`, `NINTENDO_NOMADS`, `SONY_SENTINELS`
- Every customer dollar fuels their faction's monthly total
- Winning faction gets 10% discount flag for the following month
- Dashboard shows live faction war chart

### Player Leveling
| Tier | XP Threshold | Unlocks |
|------|-------------|---------|
| PEASANT | 0 | Basic store access |
| RETRO_MAGE | 5,000 | Priority bounty access |
| TIME_LORD | 25,000 | B2B network visibility |

### Konami Code
`↑↑↓↓←→←→BA` triggers:
- Dynamic single-use discount code (`1UP-XXXXXX`)
- Full-screen neon green CRT flash
- 10% off next trade-in, 24-hour expiry

---

## Security Model

1. **Database Layer**: PostgreSQL RLS on every table using `current_user_org_id()` JWT claim
2. **Proxy Layer**: `proxy.ts` guards all `/dashboard`, `/inventory`, `/bounty-board`, `/nexus`, `/shopkeeper` routes
3. **API Layer**: Route handlers validate auth via Supabase JWT
4. **Cross-Tenant**: Only `blacklist_entries` allows cross-tenant reads. `B2B arbitrage` uses service role key (bypasses RLS)
5. **Headers**: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin

---

## File Structure

```
GuildOS/
├── schema.sql                          # 13 tables, RLS, triggers
├── frontend/
│   ├── next.config.ts                  # Security headers, image patterns
│   ├── src/
│   │   ├── proxy.ts                    # Next.js 16 proxy (subdomain routing)
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root: JetBrains Mono, dark mode
│   │   │   ├── globals.css             # Retro theme, animations, CRT effects
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── login/page.tsx          # Auth with faction selection
│   │   │   ├── auth/callback/route.ts  # Supabase code exchange
│   │   │   ├── (merchant)/
│   │   │   │   ├── layout.tsx          # GuildShell (sidebar, header, nav)
│   │   │   │   ├── dashboard/page.tsx  # 6-widget RPG dashboard
│   │   │   │   ├── inventory/page.tsx  # Loot Scanner Matrix
│   │   │   │   ├── bounty-board/page.tsx # Quest Board
│   │   │   │   ├── nexus/page.tsx      # LFG + Scores + Rooms
│   │   │   │   └── shopkeeper/page.tsx # AI chat interface
│   │   │   ├── [tenant]/              # Subdomain-routed views
│   │   │   └── api/                   # 8 API route handlers
│   │   ├── lib/
│   │   │   ├── types/index.ts         # 25+ TypeScript interfaces
│   │   │   ├── store/useGuildStore.ts  # Zustand state management
│   │   │   ├── api/client.ts          # guildFetch() canonical client
│   │   │   └── supabase/client.ts     # Browser Supabase client
│   │   ├── mocks/phantomData.ts       # Demo mode dataset
│   │   └── components/
│   │       └── konami/KonamiListener.tsx
│   └── package.json
├── backend/                            # FastAPI (Phase 2)
└── supabase/                           # Supabase config
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-side only

# Optional (enables real AI)
NVIDIA_NIM_API_KEY=nvapi-...

# Optional (cron/security)
CRON_SECRET=your-cron-secret
BLACKLIST_VERIFICATION_KEY=your-key
```

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1**: Alpha Server (Days 1–14) | Dashboard, Inventory, Bounties, Nexus, AI Chat, Schema, Demo Mode, Backend Cron, Integrations | ✅ Complete (2026-06-22) |
| **Phase 2**: Beta (Days 15–30) | Stripe billing, PriceCharting API live, real-time subscriptions, Supabase migration, FastAPI deployment | 🔜 Next |
| **Phase 3**: Launch (Days 31–60) | Custom domains, mobile app, SMS marketing, production hardening | 📋 Planned |
