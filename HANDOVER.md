# GUILDOS — Developer Handover Guide

> **For:** New developers joining the GuildOS project  
> **Last updated:** 2026-06-22

---

## Quick Start (5 Minutes)

```bash
# 1. Clone and install
cd GuildOS/frontend
npm install

# 2. Start dev server (demo mode — no database required)
npm run dev
# → opens http://localhost:3000

# 3. Launch Demo Mode
# Click "Launch Demo" on landing page, or go to http://localhost:3000/login
# and click "⚡ Launch Demo Mode (No Account Required)"
```

The entire platform runs in **demo mode** by default with rich mock data. No Supabase, API keys, or external services needed.

---

## Project Structure

```
GuildOS/
├── frontend/              # Next.js 16 App Router (main application)
│   ├── src/
│   │   ├── proxy.ts              # Middleware: subdomain routing, auth gate
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── login/page.tsx    # Auth + faction selection
│   │   │   ├── layout.tsx        # Root layout (JetBrains Mono, dark theme, Konami listener)
│   │   │   ├── globals.css       # Design system: CRT effects, RPG animations, guild cards
│   │   │   ├── (merchant)/       # Merchant portal (auth-gated)
│   │   │   │   ├── dashboard/    # RPG Admin Console
│   │   │   │   ├── inventory/    # Loot Scanner Matrix
│   │   │   │   ├── bounty-board/ # Quest Board
│   │   │   │   ├── nexus/        # LFG + Scores + Save Rooms
│   │   │   │   └── shopkeeper/   # AI Chat Interface
│   │   │   ├── [tenant]/         # Subdomain-routed tenant views
│   │   │   └── api/              # 11 API route handlers
│   │   ├── lib/
│   │   │   ├── store/            # Zustand state management
│   │   │   ├── types/            # TypeScript interfaces + DB types
│   │   │   ├── api/              # guildFetch canonical API client
│   │   │   ├── supabase/         # Browser + server Supabase clients
│   │   │   ├── integrations/     # PriceCharting, Twilio, Stripe
│   │   │   ├── toggles/          # Demo/Production mode switching
│   │   │   └── notifications/    # Notification dispatcher + IoT triggers
│   │   ├── components/
│   │   │   └── konami/           # Konami Code cheat listener
│   │   └── mocks/
│   │       └── phantomData.ts    # Complete demo dataset (12 entity types)
│   ├── package.json
│   └── tsconfig.json
├── backend/                # FastAPI (cron jobs, webhooks, cross-tenant ops)
│   ├── main.py
│   ├── core/config.py
│   ├── routers/
│   │   ├── cron.py               # CRON_SECRET-protected trigger endpoints
│   │   └── webhooks.py           # Stripe + IoT webhook handlers
│   ├── tasks/
│   │   ├── price_sync.py         # Daily 04:00 UTC price sync
│   │   ├── faction_war.py        # Monthly faction war resolution
│   │   ├── b2b_arbitrage.py      # Cross-tenant inventory matching
│   │   └── oracle_engine.py      # 2-hour predictive matching
│   └── requirements.txt
├── supabase/
│   ├── config.toml               # Schema isolation config
│   └── migrations/
│       └── 0000_initial_schema.sql  # 13 tables + RLS + triggers
├── scripts/
│   ├── migrate.sh                # Database migration runner
│   └── generate-types.sh         # TypeScript types generator
├── schema.sql                    # Complete schema reference (guildos_core)
├── .env.example                  # All required environment variables
├── ARCHITECTURE.md               # Full system architecture
├── STATE.md                      # Current build status
├── HANDOVER.md                   # This file
└── GuildOS_PRD.md                # Product Requirements Document
```

---

## Development Modes

### Demo Mode (Default — `NEXT_PUBLIC_DEMO_MODE=true`)
- No Supabase connection required
- No API keys required
- All data comes from `src/mocks/phantomData.ts` (10 inventory items, 4 bounties, 5 scores, 3 LFG lobbies, 3 save rooms, 3 faction standings, 3 profiles, 3 notifications, 6 activity events)
- AI shopkeeper uses mock keyword matching with 8 response templates
- Stripe/Twilio/PriceCharting all use mock responses logged to console
- Perfect for development, demos, and investor presentations

### Production Mode (`NEXT_PUBLIC_DEMO_MODE=false`)
- Requires all env vars configured
- Supabase with `guildos_core` schema migrated
- Live AI via NVIDIA NIM (DeepSeek-V3)
- Live Stripe billing
- Live Twilio SMS
- Live PriceCharting API

---

## Key Architecture Decisions

1. **Isolated Database Schema:** All tables live in `guildos_core` schema (not `public`) because this shares a free-tier Supabase with another app. The search_path is set to `guildos_core, public, auth`.

2. **Organization vs Tenant:** The database uses `organizations` table (not `tenants`). JWT-based tenant resolution via `current_user_org_id()` function that reads from `auth.jwt() -> 'app_metadata' ->> 'organization_id'`.

3. **Proxy Middleware:** Subdomain routing is handled by `proxy.ts` (Next.js 16 proxy pattern). It extracts the subdomain, rewrites to `/[tenant]/...` routes, and guards protected paths.

4. **Zustand Store:** Single state management with `persist` middleware. Demo mode, sidebar state, and active module are persisted to localStorage. All domain data arrays are stored in-memory.

5. **Mock-First API Design:** Every API route checks `isDemoMode()` first and returns phantom data. Only in production does it query Supabase. This enables full offline development.

---

## Common Tasks

### Running the App
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Running the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000/health
```

### Database Migration
```bash
# Ensure env vars are set
cp .env.example .env
# Edit .env with real Supabase credentials

# Run migration
bash scripts/migrate.sh schema.sql
```

### Generating Types
```bash
# After migration, generate TypeScript types from live DB
bash scripts/generate-types.sh
```

### Switching to Production
```bash
# Set env var
echo "NEXT_PUBLIC_DEMO_MODE=false" >> .env.local

# Or in Vercel dashboard → Environment Variables
```

### Deploying to Vercel
```bash
cd frontend
vercel --prod
```

---

## Testing Demo Features

| Feature | How to Test |
|---------|-------------|
| Dashboard | Visit `/dashboard` — shows 6 stat cards, faction war chart, activity feed |
| Inventory | Visit `/inventory` — filter by platform/condition, search, toggle Scrap Yard |
| Bounties | Visit `/bounty-board` — active/fulfilled tabs, "Post Bounty" form |
| Nexus LFG | Visit `/nexus` → LFG tab — open lobbies, join button |
| Ghost Data | Visit `/nexus` → Ghost Data tab — PAC-MAN and Galaga leaderboards |
| Save Rooms | Visit `/nexus` → Save Rooms tab — room cards with status/reserve |
| AI Shopkeeper | Visit `/shopkeeper` — type queries or click quick-pills |
| Konami Code | Press ↑↑↓↓←→←→BA anywhere — neon flash, 1UP-XXXXXX discount code |
| Landing Page | Visit `/` — hero, features, faction teaser, pricing tiers |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" errors | Run `npm install` in `frontend/` directory |
| Blank page on /dashboard | Ensure demo mode is on, or check Supabase env vars |
| AI shopkeeper not responding | Check `/api/ai/shopkeeper` route — mock fallback should always work |
| Backend import errors | Activate venv: `source backend/venv/bin/activate && pip install -r backend/requirements.txt` |
| Database connection refused | Check Supabase URL in `.env.local` — demo mode doesn't need it |
| CSS not loading | Ensure `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css` imports in globals.css |
