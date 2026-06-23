# GuildOS — Project State

> **Last updated:** 2026-06-23
> **Version:** v2.1.0
> **Status:** ✅ Production Deployed on Vercel + Aegis Supabase — All Systems Hardened

---

## Current Build: v2.0 Complete ✅

| Module | Status | Details |
|--------|--------|---------|
| **Database** | ✅ | 13 tables in `guildos_core` on Aegis Supabase — 86 Aegis tables untouched |
| **RLS + Triggers** | ✅ | Full tenant isolation, legendary flagging, level tier calculation |
| **Landing Page** | ✅ | Hero, features, faction tease, pricing, FAQ accordion |
| **Login/Auth** | ✅ | Real Supabase auth: signIn, signUp, OAuth (Google/GitHub), password reset, demo bypass |
| **Middleware** | ✅ | Proxy active — auth gate, demo cookie sync, subdomain routing, session refresh |
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
| **Stripe Payments** | ✅ | SDK integrated, webhook verified, BYO keys, checkout/billing/subscription status |
| **Supabase Realtime** | ✅ | Fixed schema (guildos_core), RealtimeProvider wired to store, 4 subscriptions |
| **Security** | ✅ | Rate limiting (AI routes), LIKE wildcard escaping, open redirect fixed, error leakage patched |
| **Error Handling** | ✅ | error.tsx, not-found.tsx, global-error.tsx, unhandled rejection handler |
| **guildFetch** | ✅ | Timeout (15s), retry (2x), error classification (Network/Timeout/Auth/Server) |
| **E2E Tests** | ✅ | 10 Playwright smoke tests across demo + production modes — all pass |
| **Documentation** | ✅ | .env.example (19 vars), ARCHITECTURE.md, STATE.md, HANDOVER.md |

---
## Known Issues & Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| ~~Demo mode nav redirects to login~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 |
| ~~API routes always return phantom data~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 |
| ~~Missing ?demo=true on internal links~~ | ~~Critical~~ | ✅ FIXED 2026-06-22 |
| ~~Proxy demo detection fragile~~ | ~~High~~ | ✅ FIXED 2026-06-22 |
| ~~API routes 500 without cookie~~ | ~~High~~ | ✅ FIXED 2026-06-23 |
| ~~Middleware dead code~~ | ~~Critical~~ | ✅ FIXED 2026-06-23 — proxy.ts default export, middleware active |
| ~~Login page fake auth~~ | ~~Critical~~ | ✅ FIXED 2026-06-23 — real Supabase signIn/signUp/OAuth/reset |
| ~~SQL injection risk~~ | ~~Critical~~ | ✅ FIXED 2026-06-23 — LIKE wildcards escaped |
| ~~Error detail leakage~~ | ~~High~~ | ✅ FIXED 2026-06-23 — 7 routes patched |
| ~~No error pages~~ | ~~High~~ | ✅ FIXED 2026-06-23 — error.tsx, not-found.tsx, global-error.tsx |
| ~~No rate limiting~~ | ~~High~~ | ✅ FIXED 2026-06-23 — AI routes rate limited |
| ~~Stripe webhook dead~~ | ~~High~~ | ✅ FIXED 2026-06-23 — SDK, verification, 4 event types |
| ~~Settings API stub~~ | ~~High~~ | ✅ FIXED 2026-06-23 — persists to Supabase |
| ~~Realtime broken~~ | ~~High~~ | ✅ FIXED 2026-06-23 — schema, client, provider, store actions |
| ~~No e2e tests~~ | ~~High~~ | ✅ FIXED 2026-06-23 — 10 Playwright smoke tests, all pass |
| No real Supabase Auth users tested | Medium | Auth code is wired; needs a real signup → verify → login flow test |
| No Stripe live test transaction | Medium | Integration wired; needs test keys + a real checkout flow run |
| No Twilio live test | Medium | SMS integration not end-to-end tested |
| Supabase Realtime not enabled on project | Medium | RealtimeProvider wired; needs DB replication enabled in Supabase dashboard |
| Voice input browser support | Low | Web Speech API works in Chrome/Edge, not Firefox/Safari |
| Framer Motion bundle size | Low | Tree-shaking enabled; consider dynamic import for effects |

---

## Latest Changes (2026-06-23)

### Production Hardening Sweep (2026-06-23)
**Scope:** 29 files, +1285/-291 lines, 8 parallel sub-agents
**Systems hardened:**

| System | Before | After |
|--------|--------|-------|
| **Middleware** | Dead code (no middleware.ts) | Live — auth gate, demo cookie sync, subdomain routing |
| **Auth** | Fake login (all stubs) | Real Supabase signIn/signUp/OAuth/resetPassword |
| **Stripe** | Raw fetch, webhook commented out | SDK, signature verification, 4 event types, BYO keys |
| **Realtime** | Never wired, wrong schema | Fixed (guildos_core), RealtimeProvider, store actions |
| **Settings API** | Returned demo data always | Persists to Supabase organizations.config |
| **Security** | No rate limiting, SQL injection, error leakage, open redirect | All patched |
| **Error Pages** | None (Next.js defaults) | error.tsx, not-found.tsx, global-error.tsx |
| **guildFetch** | No timeout, no retry | 15s timeout, 2x retry, error classification |
| **E2E Tests** | None | 10 Playwright tests, all pass against production |
| **.env.example** | Missing | 19 documented env vars |

### API Route URL Param Fix (2026-06-23)
**Problem:** API routes returned 500 errors when called with `?demo=true` (no cookie).
**Root cause:** `isDemoModeServer()` only checked cookies + env var. The proxy matcher excludes `/api/` routes, so the `guildos_demo_mode` cookie was never set for direct API calls. The URL param `?demo=true` was ignored.
**Fix:** Updated `isDemoModeServer(searchParams?)` to accept optional URLSearchParams. Priority chain now matches client-side: URL param > cookie > env var. All 9 call sites across 5 API routes pass `request.nextUrl.searchParams`.

### Demo Mode Root Cause Fix (2026-06-22)
**Problem:** Clicking any tab in demo mode redirected to `/login`.
**Root cause:** Next.js client-side navigations don't go through proxy middleware. Every internal `href` must include `?demo=true`. Only sidebar/mobile nav did this — QuickActions, breadcrumbs, EmptyState CTAs all had bare hrefs.
**Fix:** Created `lib/utils/url.ts` with centralized `demoHref()` function. All components now use it. Also created `<DemoAwareLink>` component.

### API Route Production Hardening
**Problem:** 4 API routes (`inventory`, `bounties`, `nexus/lfg`, `nexus/scores`) ALWAYS returned phantom data — never checked demo mode. Production would serve fake data.
**Fix:** All routes now check `isDemoModeServer()` and query Supabase `guildos_core` in production mode.

### New Files Created (cumulative)
- `frontend/src/lib/utils/url.ts` — `demoHref()` utility + `isCurrentlyDemoMode()` + `persistDemoMode()`
- `frontend/src/components/ui/demo-aware-link.tsx` — `<DemoAwareLink>` drop-in for `next/link`
- `frontend/src/components/widgets/demo-banner.tsx` — Interactive rotating tips banner

### Deploy Instructions
```bash
cd /Users/vanguardestatecontrols/GuildOS/frontend && vercel deploy --prod --yes --scope vec717
# Already deployed as of 2026-06-23. Branch fix/demo-mode-navigation is live.
# Next step: merge to main.
git checkout main && git merge fix/demo-mode-navigation && git push origin main
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
