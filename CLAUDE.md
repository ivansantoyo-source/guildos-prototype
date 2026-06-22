@AGENTS.md

# GuildOS — Project Overview

GuildOS is a **production-deployed, multi-tenant SaaS platform** that transforms brick-and-mortar retro-gaming storefronts into AI-powered, RPG-gamified ecosystems.

**Live:** https://guildos-flax.vercel.app
**Demo:** Append `?demo=true` to any URL (bypasses auth, loads mock data)
**Database:** Aegis Supabase — `guildos_core` schema (13 tables, full RLS)
**Deploy:** `vercel deploy --prod --yes --scope vec717` from `frontend/`

## Architecture at a Glance

- **Frontend:** Next.js 16 App Router (33 pages, 22 API routes)
- **State:** Zustand 5 with persist middleware
- **Design:** Tailwind 4 + shadcn/ui + Framer Motion (glassmorphism, neon glow, 3D cards)
- **Auth:** Supabase Auth (JWT + RLS) — bypassed by `?demo=true`
- **Cron:** Vercel Cron Jobs (4 daily: price sync, Oracle, B2B, faction war)
- **BYO Keys:** Each merchant brings their own Stripe/Twilio/PriceCharting/AI keys
- **No separate backend:** Cron + API routes replace FastAPI (no Render needed)

## Before You Work

Read these in order:
1. `AGENTS.md` — AI agent behavior rules
2. `ARCHITECTURE.md` — Complete system map
3. `HANDOVER.md` — Dev setup + patterns + troubleshooting
4. `STATE.md` — Current build status + known issues
