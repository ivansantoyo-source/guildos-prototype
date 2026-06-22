<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Instructions — GuildOS v2.0

You are working on **GuildOS**, a production-deployed multi-tenant SaaS platform for retro-gaming storefronts. 33 pages, 22 API routes, live on Vercel + Supabase.

## Before Writing Any Code

1. Read `ARCHITECTURE.md` — complete system map
2. Read `HANDOVER.md` — patterns, common tasks, troubleshooting
3. Read `STATE.md` — current build status and known issues

## Critical Rules

1. **NEVER write to `public` schema.** All GuildOS tables are in `guildos_core`. The `public` schema has 86 Aegis tables that must not be touched.
2. **NEVER hardcode credentials** in source files. Use `.env.local` (gitignored).
3. **`"use client"`** on all Zustand/hooks/browser-API components.
4. **Never use `useSearchParams()` in layouts** — use `window.location.search` inside useEffect.
5. **Demo mode priority:** URL param `?demo=true` > localStorage > `NEXT_PUBLIC_DEMO_MODE` env var.
6. **Follow existing patterns** — every page: store read → loading/empty/error → render. Every API route: `isDemoMode()` → phantom (demo) or Supabase (production).
7. **Respect `prefers-reduced-motion`** — check `reducedMotion` in Zustand store.

## Quick Commands

```bash
# Dev
cd /Users/vanguardestatecontrols/GuildOS/frontend && npm run dev

# Build
cd /Users/vanguardestatecontrols/GuildOS/frontend && npm run build

# Deploy
vercel deploy --prod --yes --scope vec717

# Set Vercel env var
echo "value" | vercel env add KEY production --scope vec717 -y
```

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/store/useGuildStore.ts` | All state (30+ actions) |
| `frontend/src/mocks/phantomData.ts` | Complete demo dataset |
| `frontend/src/lib/toggles/index.ts` | Demo/production switching |
| `frontend/src/proxy.ts` | Middleware (subdomain + auth + demo) |
| `frontend/src/lib/types/tenant-keys.ts` | BYO key system |
| `frontend/src/app/globals-v2.css` | Premium design system |
