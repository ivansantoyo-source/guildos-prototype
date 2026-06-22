# GUILDOS — Developer Handover Guide

> **For:** AI agents and developers resuming work on GuildOS.
> **Last updated:** 2026-06-22

---

## Quick Start

```bash
cd GuildOS/frontend
npm install
npm run dev
# → http://localhost:3000

# Demo mode: append ?demo=true to any page
# http://localhost:3000/dashboard?demo=true
```

**No Supabase or API keys needed for local development** — demo mode loads phantom data.

---

## Critical Things to Know Before Writing Code

### 1. Database Schema is `guildos_core`, NOT `public`
We share a free-tier Supabase with the Aegis-OS app. The `public` schema has 86 Aegis tables — NEVER touch them. All GuildOS tables (13) are in `guildos_core`. Supabase clients are configured with `db: { schema: 'guildos_core' }`.

### 2. Demo Mode Priority Chain
```
URL param ?demo=true  →  Zustand localStorage  →  NEXT_PUBLIC_DEMO_MODE env var
```
The user's explicit choice ALWAYS wins. The env var sets the default. Check via `isDemoMode()` from `@/lib/toggles`.

### 3. Proxy Middleware Controls Auth
`src/proxy.ts` handles: Supabase session refresh → subdomain/tenant resolution → auth gate (skipped if `?demo=true`). Before adding new protected routes, update `protectedPaths` array.

### 4. BYO Key Architecture
Platform provides Supabase only. Each merchant brings their own Stripe, Twilio, PriceCharting, AI, IoT keys — configured via `/settings` page, stored in `organizations.config` JSONB. No payment/SMS/pricing keys in Vercel env vars.

### 5. No Separate Backend
Vercel Cron Jobs hit Next.js API routes for scheduled tasks. The `backend/` directory is reference-only (FastAPI). All cron logic is in `/api/cron/*` routes.

### 6. CSS is `globals-v2.css`
The original `globals.css` still exists but `layout.tsx` imports `globals-v2.css`. The V2 has all premium design tokens, glassmorphism, animations, skeleton loaders, toast styles, etc.

---

## Key Files to Read First

| File | Why |
|------|-----|
| `src/lib/store/useGuildStore.ts` | All state (30+ actions). Understanding this = understanding the app. |
| `src/lib/types/index.ts` | All TypeScript interfaces. |
| `src/mocks/phantomData.ts` | Complete demo dataset (10 items, 4 bounties, etc.). |
| `src/lib/toggles/index.ts` | Demo/production switching logic. |
| `src/lib/toggles/server.ts` | Server-side demo detection (cookies). |
| `src/proxy.ts` | Middleware: subdomain routing, auth gate, demo bypass. |
| `src/lib/types/tenant-keys.ts` | BYO key type definitions + service detection. |
| `src/components/ui/toaster.tsx` | Toast system. Use `toast(type, title, desc)` imperatively. |
| `src/lib/audio/sounds.ts` | Sound system. Use `playClick()`, `playSuccess()`, etc. |

---

## Architecture Patterns

### Data Flow
```
User clicks → Zustand action → API route (guildFetch) → Supabase (production) or phantomData (demo) → Zustand state → React re-render
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

---

## Common Tasks

### Adding a New Page
1. Create `src/app/(merchant)/new-page/page.tsx` with `"use client"`
2. Add nav item in `layout.tsx` NAV_ITEMS array
3. Add mobile nav item in `components/layout/mobile-nav.tsx` TABS array
4. Add to `proxy.ts` protectedPaths if it needs auth

### Adding a New API Route
1. Create `src/app/api/new-endpoint/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Check `isDemoMode()` at top, return phantom data if true
4. Follow `guildFetch` pattern from `src/lib/api/client.ts`

### Working with the Database
- Browser client: `src/lib/supabase/client.ts` (anon key, `guildos_core` schema)
- Server client: `src/lib/supabase/server.ts` (service role, `guildos_core` schema)
- Types: `src/lib/types/database.ts` (run `bash scripts/generate-types.sh` to regenerate)

### Running Migrations
```bash
# Via Supabase Management API (needs access token):
SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/migrate_final.sh

# Or paste schema.sql into Supabase SQL Editor:
# https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/sql/new
```

---

## Deploying

```bash
cd frontend
vercel deploy --prod --yes --scope vec717
# → https://guildos-flax.vercel.app

# Set env vars on Vercel:
echo "value" | vercel env add KEY production --scope vec717 -y
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | `cd frontend && npm install` |
| Blank page on /dashboard | Append `?demo=true` OR check NEXT_PUBLIC_DEMO_MODE env var |
| Redirect to /login | Proxy auth gate active — use `?demo=true` or sign in |
| CSS missing | Ensure `globals-v2.css` is imported in `layout.tsx` |
| Build fails | `npm run build` — check TypeScript errors first |
| Supabase connection error | Check env vars on Vercel; demo mode works without Supabase |
| Framer Motion errors | Check `reducedMotion` in Zustand store; disable animations |
| useSearchParams() error | Must be wrapped in Suspense OR use `window.location.search` client-side |
| Voice input not working | Only Chrome/Edge support Web Speech API |
