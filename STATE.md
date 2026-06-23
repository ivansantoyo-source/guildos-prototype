# GuildOS — Project State

> **Last updated:** 2026-06-22
> **Version:** v2.0.0
> **Status:** ✅ Production Deployed on Vercel + Aegis Supabase

---

## Current Build: v2.0 Complete ✅

| Module | Status | Details |
|--------|--------|---------|
| **Database** | ✅ | 13 tables in `guildos_core` on Aegis Supabase — 86 Aegis tables untouched |
| **RLS + Triggers** | ✅ | Full tenant isolation, legendary flagging, level tier calculation |
| **Landing Page** | ✅ | Hero, features, faction tease, pricing, FAQ accordion |
| **Login/Auth** | ✅ | Email/password, faction selection, forgot password flow, OAuth buttons, demo quick-access |
| **Dashboard** | ✅ | Date filters, revenue sparkline, quick actions, alerts, upcoming LFGs |
| **Inventory** | ✅ | Grid/list, batch ops, scan modal with drag-drop, scrap yard, CSV export, inline editing |
| **Bounty Board** | ✅ | 3-step creation wizard, fulfillment workflow, auto-suggest prices, share, sort |
| **The Nexus (LFG)** | ✅ | Create/join, lobby chat, participant slots, reminders, filters |
| **The Nexus (Scores)** | ✅ | Log scores, cabinets management, dethroned animation, historical toggle |
| **The Nexus (Save Rooms)** | ✅ | Booking flow, QR code generation, amenity filters, subscription management |
| **AI Shopkeeper** | ✅ | Voice input, markdown rendering, rich follow-ups, conversation history, typing indicator |
| **Analytics** | ✅ | KPI cards, platform distribution, condition breakdown, faction mix, activity log |
| **Profile** | ✅ | XP bar, achievement badges (8), purchase history, edit form, danger zone |
| **Settings (BYO Keys)** | ✅ | 3 tabs: API Keys (Stripe/Twilio/AI/IoT), Store Info, Feature Toggles |
| **Command Palette** | ✅ | ⌘K global search across navigation, inventory, bounties, quick actions |
| **Toast System** | ✅ | 5 types (success/error/warning/info/legendary) with auto-dismiss and progress bar |
| **Confetti Engine** | ✅ | Canvas-based particles with 7 color palettes and physics |
| **Level-Up Effect** | ✅ | Full-screen overlay with XP orb particles and perks display |
| **Legendary Drop** | ✅ | Golden rays, floating dust, typewriter text, IoT trigger simulation |
| **Faction War Tracker** | ✅ | Live animated bars, crown indicator, countdown timer |
| **Live Ticker** | ✅ | Horizontal infinite scroll with color-coded events |
| **Achievement Toasts** | ✅ | Queue-based, 4 rarity tiers with synthesized chimes |
| **XP Bar** | ✅ | Animated counter with cubic ease-out and glow pulse |
| **Konami Code 2.0** | ✅ | 6 cheat codes (Konami, IDDQD, IDKFA, NES, GB, SNES) with unique effects |
| **Mobile Responsive** | ✅ | Bottom tab nav, responsive tables → cards, safe-area padding |
| **SEO** | ✅ | robots.txt, sitemap.xml, OpenGraph, Twitter Cards, PWA manifest |
| **Sound Design** | ✅ | 7 Web Audio API synthesized sounds (no external files) |
| **Page Transitions** | ✅ | Framer Motion AnimatePresence with staggered children |
| **Error Boundary** | ✅ | React error boundary with retry and dev stack traces |
| **Skeleton Loaders** | ✅ | 5 variants: stat card, table row, card, chat bubble, chart |
| **Empty States** | ✅ | 7 domain-specific variants with CTAs |
| **Confirm Dialog** | ✅ | Glass modal with focus trap, keyboard nav, destructive variant |
| **Vercel Cron Jobs** | ✅ | 4 daily: price sync, Oracle, B2B arbitrage, faction war |
| **Stripe Webhook** | ✅ | Endpoint ready at `/api/webhooks/stripe` |
| **Demo Mode** | ✅ | URL param > localStorage > env var priority chain |
| **BYO Key System** | ✅ | Per-tenant key management via `/settings` + `organizations.config` JSONB |
| **Vercel Env Vars** | ✅ | All 6 production env vars set and encrypted |
| **Documentation** | ✅ | ARCHITECTURE.md, STATE.md, HANDOVER.md, .env.example |

---

## Deployment Status

| Service | URL / ID | Status |
|---------|----------|--------|
| **Vercel (prod)** | https://guildos-flax.vercel.app | ✅ Live — 33 pages, 22 API routes |
| **Supabase** | Aegis-OS-DB (`tyustwqwvjmzvuazfwkv`) | ✅ Connected — `guildos_core` schema active |
| **GitHub** | ivansantoyo-source/guildos-prototype | ✅ main branch — all code pushed |
| **Cron Jobs** | 4 Vercel cron jobs configured | ✅ Pending first execution |

---

## Known Issues & Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| ~~Demo mode nav redirects to login~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 — see `fix/demo-mode-navigation` branch |
| ~~API routes always return phantom data~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 — inventory, bounties, nexus routes now check demo mode |
| ~~Missing ?demo=true on internal links~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 — centralized `demoHref()` utility in `lib/utils/url.ts` |
| ~~Proxy demo detection fragile~~ | ~~High~~ | ✅ FIXED 2026-06-22 — proxy v2.1 with explicit priority chain |
| Deploy pending | High | `fix/demo-mode-navigation` branch needs merge → `main` + Vercel deploy |
| No real Supabase Auth users | Medium | Login works in demo; production needs real auth flow testing |
| No Stripe live test | Medium | BYO keys configured but no test transaction run |
| No Twilio live test | Medium | SMS integration not end-to-end tested |
| No e2e tests | Medium | Manual testing only; recommend Playwright for critical paths |
| No real-time Supabase | Low | `useRealtime` hook simulates in demo; needs Supabase Realtime enabled |
| Voice input browser support | Low | Web Speech API works in Chrome/Edge, not Firefox/Safari |
| KonamiListener SSR | Low | `triggerConfetti` import may fail in SSR — handled by "use client" |
| Framer Motion bundle size | Low | Tree-shaking enabled; consider dynamic import for effects |

---

## Latest Changes (2026-06-22)

### Demo Mode Root Cause Fix
**Problem:** Clicking any tab in demo mode redirected to `/login`.
**Root cause:** Next.js client-side navigations don't go through proxy middleware. Every internal `href` must include `?demo=true`. Only sidebar/mobile nav did this — QuickActions, breadcrumbs, EmptyState CTAs all had bare hrefs.
**Fix:** Created `lib/utils/url.ts` with centralized `demoHref()` function. All components now use it. Also created `<DemoAwareLink>` component.

### API Route Production Hardening
**Problem:** 4 API routes (`inventory`, `bounties`, `nexus/lfg`, `nexus/scores`) ALWAYS returned phantom data — never checked demo mode. Production would serve fake data.
**Fix:** All routes now check `isDemoModeServer()` and query Supabase `guildos_core` in production mode.

### New Files Created
- `frontend/src/lib/utils/url.ts` — `demoHref()` utility + `isCurrentlyDemoMode()` + `persistDemoMode()`
- `frontend/src/components/ui/demo-aware-link.tsx` — `<DemoAwareLink>` drop-in for `next/link`
- `frontend/src/components/widgets/demo-banner.tsx` — Interactive rotating tips banner

### Deploy Instructions
```bash
cd /Users/vanguardestatecontrols/GuildOS/frontend && vercel deploy --prod --yes --scope vec717
# Then merge: git checkout main && git merge fix/demo-mode-navigation && git push origin main
```

---

## Next Phase: Real Merchant Onboarding

1. **MERGE + DEPLOY** `fix/demo-mode-navigation` branch (CRITICAL — fixes in this branch)
2. Test real Supabase Auth (sign up → email verify → faction select → dashboard)
3. Configure a test Stripe account and process a test subscription
4. Configure a test Twilio account and send a test SMS
5. Write Playwright e2e tests for critical paths (login → dashboard → scan item → post bounty)
6. Add real-time Supabase Realtime subscriptions for live dashboard updates
7. Custom domain setup for tenant subdomains
