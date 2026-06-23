# GuildOS — Production Deployment Guide

> **Version:** v2.3.0
> **Last updated:** 2026-06-23
> **Target:** Production-grade multi-tenant SaaS deployment on Vercel + Supabase

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Supabase Setup](#3-supabase-setup)
4. [Vercel KV Setup](#4-vercel-kv-setup)
5. [Stripe Setup](#5-stripe-setup)
6. [Email/SMTP Setup](#6-emailsmtp-setup)
7. [First Deploy](#7-first-deploy)
8. [Post-Deploy Verification](#8-post-deploy-verification)
9. [Custom Domain Setup](#9-custom-domain-setup)
10. [SSL Verification](#10-ssl-verification)

---

## 1. Prerequisites

### Required Tools

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 22.x | `nvm install 22` |
| npm | >= 10.x | ships with Node |
| Vercel CLI | latest | `npm i -g vercel` |
| Supabase CLI | latest | `npm i -g supabase` or `brew install supabase/tap/supabase` |
| Git | latest | `brew install git` |
| Stripe CLI | latest | `brew install stripe/stripe-cli/stripe` (optional, for webhook testing) |

### Required Access

- **Vercel:** Scope `vec717` — owner of the GuildOS project
- **Supabase:** Admin access to Aegis-OS-DB project `tyustwqwvjmzvuazfwkv`
- **Stripe:** Test mode account (production account when live)
- **GitHub:** Write access to `ivansantoyo-source/guildos-prototype`

### Verify Tooling

```bash
node --version      # >= 22.x
npm --version       # >= 10.x
vercel --version    # >= 30.x
supabase --version  # >= 1.x
stripe --version    # >= 1.x (optional)
```

### Log In to Services

```bash
# Vercel
vercel login
vercel switch --scope vec717
vercel link           # link to guildos project

# Supabase
supabase login
supabase link --project-ref tyustwqwvjmzvuazfwkv
# Requires SUPABASE_ACCESS_TOKEN env var or interactive login

# Stripe (optional — for local webhook testing)
stripe login
```

> **CRITICAL:** Never commit `.env.local`, service role keys, or webhook secrets to version control. The `.env.local` file is gitignored by default.

---

## 2. Environment Variables

### Full Variable Reference (27 vars)

All variables must be set on Vercel for the production environment. Local development copies `.env.example` to `.env.local`.

#### Group 1: Supabase (Required)

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | Project URL, e.g. `https://tyustwqwvjmzvuazfwkv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Public anon key (safe for client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | Service role key (server-side only) — required for cron jobs and admin operations |

> **Security:** The anon key is public and can be exposed client-side. The service role key bypasses RLS — restrict its use to server-only contexts (API routes, cron jobs, middleware).

#### Group 2: App (Required)

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your deployed URL | Production: `https://guildos-flax.vercel.app` (or your custom domain) |
| `NEXT_PUBLIC_DEMO_MODE` | You | Set to `false` in production. Demo mode is accessed via `?demo=true` URL param |

#### Group 3: Stripe (Optional — for payments)

| Variable | Source | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard > API Keys | Secret key, starts with `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks | Webhook signing secret, starts with `whsec_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard > API Keys | Publishable key, starts with `pk_test_` or `pk_live_` |
| `STRIPE_PRICE_MERCHANT` | Stripe Dashboard > Products | Price ID for Merchant subscription tier |
| `STRIPE_PRICE_WIZARD` | Stripe Dashboard > Products | Price ID for Wizard subscription tier |
| `STRIPE_PRICE_TIME_LORD` | Stripe Dashboard > Products | Price ID for Time Lord subscription tier |

> **BYO keys:** Each merchant can bring their own Stripe account. Platform-level keys above are the fallback when no tenant key is configured. The `/settings` page stores tenant Stripe keys in `organizations.config` JSONB.

#### Group 4: Twilio (Optional — for SMS)

| Variable | Source | Description |
|----------|--------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio Console | Account SID, starts with `AC` |
| `TWILIO_AUTH_TOKEN` | Twilio Console | Auth token |
| `TWILIO_PHONE_NUMBER` | Twilio Console > Phone Numbers | Outbound SMS phone number, e.g. `+15551234567` |

> **Graceful degradation:** SMS features (Wandering Merchant, Score Dethroned alerts, Oracle notifications) fall back to console logging when Twilio is not configured.

#### Group 5: AI (Optional)

| Variable | Source | Description |
|----------|--------|-------------|
| `NVIDIA_NIM_API_KEY` | build.nvidia.com | NVIDIA NIM API key for DeepSeek-V3 AI Shopkeeper, starts with `nvapi-` |

> **Fallback:** When the NVIDIA NIM key is missing or rate-limited, the AI Shopkeeper uses a rule-based mock with 8 keyword patterns.

#### Group 6: PriceCharting (Optional)

| Variable | Source | Description |
|----------|--------|-------------|
| `PRICECHARTING_API_KEY` | pricecharting.com/api | API key for market price data used in inventory valuation |

#### Group 7: Cron Jobs (Required)

| Variable | Source | Description |
|----------|--------|-------------|
| `CRON_SECRET` | You generate | Shared secret that cron job endpoints check via `x-cron-secret` header. Use a long random string. |

> **Format:** `guildos-cron-prod-v1-2026` (but use a unique, unguessable value)

#### Group 8: Vercel KV (Required in Production)

| Variable | Source | Description |
|----------|--------|-------------|
| `KV_URL` | Vercel Dashboard > Storage > KV | KV connection URL |
| `KV_REST_API_URL` | Vercel Dashboard > Storage > KV | KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel Dashboard > Storage > KV | KV REST API token |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel Dashboard > Storage > KV | Read-only token (optional) |

> **IMPORTANT:** Without Vercel KV, rate limiting falls back to per-serverless-instance in-memory storage, which is trivially bypassable by spraying requests across instances. Always configure KV in production.

#### Group 9: Security (Required)

| Variable | Source | Description |
|----------|--------|-------------|
| `BLACKLIST_VERIFICATION_KEY` | You generate | Shared secret for cross-tenant fraud ledger verification |
| `IOT_WEBHOOK_URL` | Your IoT endpoint | Webhook URL for IoT device integration (smart lighting, effects) |

### Example `.env.local` (for local development)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tyustwqwvjmzvuazfwkv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_MERCHANT=price_merchant
STRIPE_PRICE_WIZARD=price_wizard
STRIPE_PRICE_TIME_LORD=price_time_lord

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567

# AI
NVIDIA_NIM_API_KEY=nvapi-...

# PriceCharting
PRICECHARTING_API_KEY=...

# Cron
CRON_SECRET=your-random-secret-here

# Vercel KV (optional locally, required in production)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Security
BLACKLIST_VERIFICATION_KEY=your-verification-key-here
IOT_WEBHOOK_URL=https://your-iot-webhook.example.com
```

### Setting Vars on Vercel

```bash
# Single var:
echo "value" | vercel env add KEY production --scope vec717 -y

# Bulk — paste into .env format then:
cat .env.production | while IFS='=' read -r key value; do
  echo "$value" | vercel env add "$key" production --scope vec717 -y
done
```

> Pull existing vars: `vercel env pull .env.production` (requires existing project link)

---

## 3. Supabase Setup

### 3.1 Project Configuration

The Supabase project (Aegis-OS-DB `tyustwqwvjmzvuazfwkv`) is already configured. For a fresh deployment:

1. Create a new project at https://supabase.com/dashboard/projects
2. Note the project reference and API credentials
3. Update all `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` env vars

### 3.2 Schema Setup

All GuildOS tables live in the `guildos_core` schema, isolated from the `public` schema.

**Option A: Supabase SQL Editor (Recommended)**
```bash
# Open the schema file and copy its contents
cat schema.sql
# Paste into: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/sql/new
```

**Option B: Supabase CLI (if linked)**
```bash
supabase db push
```

**Option C: Migration Script**
```bash
SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/migrate_final.sh
```

**The schema creates:**
- 13 tables in `guildos_core` schema (organizations, profiles, inventory, price_history, bounties, nexus_lfgs, nexus_lfg_participants, nexus_scoreboards, nexus_save_rooms, faction_standings, discount_codes, blacklist_entries, notifications)
- RLS policies on all tables (enforced via `guildos_core.current_user_org_id()`)
- Triggers: legendary flagging (items >= $150), level tier calculation, updated_at timestamps
- Functions: `current_user_org_id()`, `calculate_level_tier()`

### 3.3 Verify Schema Isolation

```sql
-- Verify no GuildOS tables leaked into public schema
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'guildos_%';
-- Should return 0 rows

-- Verify GuildOS tables exist in correct schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'guildos_core';
-- Should return 13 rows
```

### 3.4 Enable Realtime

Supabase Realtime must be enabled for live dashboard updates:

1. Go to: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/database/replication
2. Enable replication on the `guildos_core` schema
3. For each table used with realtime subscriptions, toggle replication ON:
   - `inventory`
   - `bounties`
   - `faction_standings`
   - `activity_feed`
   - `nexus_lfgs`
   - `nexus_lfg_participants`
   - `bounty_stats`
4. Verify: RealTimeProvider component will log `"connected"` in browser console

### 3.5 Setup Email Templates (Custom Branding)

The `supabase/config.toml` references custom HTML templates. Apply these via the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/templates
2. For each template type (magic_link, confirmation, invite, recovery, email_change):
   - Paste the HTML from `supabase/email-templates/<type>.html`
   - Update subject lines with GuildOS branding
   - Test with a real signup flow

### 3.6 Generate TypeScript Types

```bash
# After schema changes, regenerate frontend types:
cd frontend
npx supabase gen types typescript --project-id tyustwqwvjmzvuazfwkv --schema guildos_core > src/lib/types/database.ts
```

---

## 4. Vercel KV Setup

**Required for production** — without KV, rate limiting is per-Vercel-instance only and trivially bypassable.

### 4.1 Create a KV Database

1. Go to: https://vercel.com/dashboard/stores
2. Click **Create Database** > **KV** (Redis-compatible key-value store)
3. Choose the **Hobby** plan (free tier, suitable for rate limiting)
4. Name it: `guildos-kv` or similar
5. Select region `iad1` (same as the Vercel project)
6. Click **Create**

### 4.2 Connect KV to the Project

1. In the KV dashboard, click **Connect Project**
2. Select the GuildOS project
3. Vercel auto-sets the following env vars:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
4. Verify the vars are set:
   ```bash
   vercel env ls production --scope vec717 | grep KV_
   ```

### 4.3 Verify Rate Limiting Works

Deploy and test:

```bash
# Deploy first, then hit a rate-limited endpoint rapidly
for i in $(seq 1 10); do
  curl -s -w "\nHTTP %{http_code}" \
    "https://guildos-flax.vercel.app/api/auth/send-otp" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' | tail -1
done
# Expect: first request 200, subsequent requests 429
```

### 4.4 Fallback Behavior

If KV is not configured:
- `rateLimit()` logs a critical error at import time
- Falls back to per-instance in-memory `Map`
- Each Vercel serverless instance has its own counter
- Attackers can bypass by spraying across instances
- A production environment without KV emits `console.error(...)` at cold start

---

## 5. Stripe Setup

### 5.1 Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Create an account (use test mode for initial setup)
3. Verify your business details

### 5.2 Get API Keys (Test Mode)

1. Go to Stripe Dashboard > Developers > API Keys
2. Copy:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
3. Set on Vercel (see section 2)

### 5.3 Create Products and Prices

1. Go to Stripe Dashboard > Products
2. Create 3 subscription products:

| Product | Price ID Pattern | Suggested Price | Description |
|---------|-----------------|-----------------|-------------|
| Merchant | `price_merchant` | $99/month | Basic inventory + bounties |
| Wizard | `price_wizard` | $249/month | + AI Shopkeeper + Analytics |
| Time Lord | `price_time_lord` | $499/month | + VIP + Everything |

3. Set the price IDs in Vercel env vars:
   - `STRIPE_PRICE_MERCHANT`, `STRIPE_PRICE_WIZARD`, `STRIPE_PRICE_TIME_LORD`

### 5.4 Configure Webhook Endpoint

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click **Add Endpoint**
3. Endpoint URL: `https://guildos-flax.vercel.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add Endpoint**
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Set `STRIPE_WEBHOOK_SECRET` on Vercel

### 5.5 Test Stripe Integration

```bash
# Local webhook forwarding (from frontend directory):
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a test event:
stripe trigger checkout.session.completed

# Check Vercel logs for the webhook handler:
vercel logs --scope vec717
```

### 5.6 Going Live

1. Toggle Stripe account from Test to Production mode
2. Create Live API keys and set on Vercel
3. Create Live products/prices and update price ID env vars
4. Create a Live webhook endpoint (separate from test)
5. Run a $0.50 test transaction in live mode
6. Verify the webhook fires and subscription status updates in the DB

---

## 6. Email/SMTP Setup

### 6.1 Choose an Email Provider

GuildOS uses Supabase Auth for email sending. Two recommended providers:

| Provider | Pros | Cons |
|----------|------|------|
| **Resend** | Simple API, generous free tier | Limited deliverability at scale |
| **SendGrid** | Proven deliverability | More complex setup |
| **AWS SES** | Cheapest at scale | Requires AWS account |

### 6.2 Configure SMTP in Supabase

1. Go to: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/smtp
2. Enable **Custom SMTP**
3. Fill in:

| Field | Example (Resend) |
|-------|------------------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key |
| Sender Name | `GuildOS` |
| Sender Email | `noreply@guildos.com` |

4. Click **Save**
5. Send a test email from the SMTP settings page

### 6.3 Verify Auth Flow Works

```bash
# 1. Request OTP for a real email
curl -X POST https://guildos-flax.vercel.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
# Expect 200, check inbox for magic link

# 2. Check Sentry/Vercel logs for delivery errors
vercel logs --scope vec717 | grep -i "send-otp\|smtp\|email"
```

### 6.4 Custom Email Templates

Apply GuildOS-branded email templates in the Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/templates
2. For each template type:
   - **Magic Link** — "Sign in to GuildOS"
   - **Confirmation** — "Confirm your GuildOS account"
   - **Invite** — "You're invited to GuildOS"
   - **Recovery** — "Reset your GuildOS password"
3. Paste the HTML from `supabase/email-templates/<type>.html`
4. Send a test to verify rendering

> **Note:** The `supabase/config.toml` has template `content_path` references, but these only apply to local `supabase start` development. Production templates must be set via the Dashboard.

---

## 7. First Deploy

### 7.1 Build Verification

Before deploying, verify the build passes locally:

```bash
cd frontend
npm run build
# Expect: ✓ Compiled successfully (0 errors)
```

Common build failures:
| Error | Fix |
|-------|-----|
| TypeScript errors | `npx tsc --noEmit` and fix |
| Module not found | `npm install` |
| CSS parsing error | Check Tailwind 4 syntax in `globals-v2.css` |
| Dynamic route conflict | Check route segment naming |

### 7.2 Production Deploy

```bash
# From the frontend/ directory:
cd /Users/vanguardestatecontrols/GuildOS/frontend
vercel deploy --prod --yes --scope vec717

# Expected output:
# ✅  Production: https://guildos-flax.vercel.app [1 minute]
```

The `vercel.json` build configuration:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### 7.3 Post-Deploy Environment Check

```bash
# Verify env vars were picked up:
curl -s https://guildos-flax.vercel.app/api/system/mode | jq .
# Expect: { "mode": "production", "demo": false, ... }
```

### 7.4 Rollback Procedure

If a deploy breaks production:

```bash
# Option 1: Revert to previous deploy
vercel rollback --scope vec717

# Option 2: Deploy from a known-good Git commit
git checkout <last-good-commit>
cd frontend && vercel deploy --prod --yes --scope vec717

# Option 3: Disable demo mode via env var if the issue is auth-related
echo "false" | vercel env add NEXT_PUBLIC_DEMO_MODE production --scope vec717 -y
```

---

## 8. Post-Deploy Verification

### 8.1 Smoke Test URLs

After each deploy, verify these URLs manually or via Playwright:

| Test | URL | Expected Result |
|------|-----|----------------|
| Landing | `/` | Hero section loads |
| Login | `/login` | Auth form visible |
| Demo Dashboard | `/dashboard?demo=true` | 6 stat cards, DEMO MODE badge |
| Demo Inventory | `/inventory?demo=true` | Items grid with search |
| Demo Bounties | `/bounty-board?demo=true` | Active bounties list |
| Demo Nexus | `/nexus?demo=true` | LFG/Scores/Save Rooms tabs |
| Profile | `/profile?demo=true` | XP bar + badges |
| Analytics | `/analytics?demo=true` | KPI cards + charts |

### 8.2 API Health Check

```bash
# Test all critical API endpoints
ENDPOINTS=(
  "/api/inventory?demo=true"
  "/api/bounties?demo=true"
  "/api/nexus/lfg?demo=true"
  "/api/nexus/scores?demo=true"
  "/api/nexus/rooms?demo=true"
  "/api/wallet?demo=true"
  "/api/wallet/transactions?demo=true"
  "/api/system/mode?demo=true"
  "/api/vitality/quests?demo=true"
  "/api/potions/menu?demo=true"
  "/api/discounts?demo=true"
  "/api/tenant/settings?demo=true"
)

BASE="https://guildos-flax.vercel.app"
FAILED=0
for EP in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$EP")
  if [ "$STATUS" -ge 500 ]; then
    echo "FAIL: $STATUS $EP"
    FAILED=$((FAILED+1))
  else
    echo "OK:   $STATUS $EP"
  fi
done
echo "\n$FAILED endpoints failed"
```

### 8.3 Playwright E2E Tests

```bash
cd frontend
# Run against production (replaces localhost)
BASE_URL=https://guildos-flax.vercel.app npx playwright test

# Run specific test file
BASE_URL=https://guildos-flax.vercel.app npx playwright test e2e/smoke.spec.ts
```

### 8.4 Cron Job Verification

Cron jobs run on schedule but can be triggered manually for testing:

```bash
CRON_SECRET="guildos-cron-prod-v1-2026"

# Price Sync
curl -X GET "https://guildos-flax.vercel.app/api/cron/price-sync" \
  -H "x-cron-secret: $CRON_SECRET"

# Oracle Engine
curl -X GET "https://guildos-flax.vercel.app/api/cron/oracle" \
  -H "x-cron-secret: $CRON_SECRET"

# B2B Arbitrage
curl -X GET "https://guildos-flax.vercel.app/api/b2b/arbitrage" \
  -H "x-cron-secret: $CRON_SECRET"

# Faction War (month-end)
curl -X GET "https://guildos-flax.vercel.app/api/cron/faction-war" \
  -H "x-cron-secret: $CRON_SECRET"
```

**Verify each returns 200:**
```bash
for JOB in "price-sync" "oracle" "b2b/arbitrage" "cron/faction-war"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://guildos-flax.vercel.app/api/$JOB" \
    -H "x-cron-secret: $CRON_SECRET")
  echo "$JOB: $STATUS"
done
```

### 8.5 Auth Flow Test

```bash
# 1. Test OTP send endpoint
curl -s -w "\nHTTP %{http_code}" \
  -X POST "https://guildos-flax.vercel.app/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com"}'

# 2. Test OTP verify endpoint
curl -s -w "\nHTTP %{http_code}" \
  -X POST "https://guildos-flax.vercel.app/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","token":"123456"}'

# 3. Test settings API
curl -s "https://guildos-flax.vercel.app/api/tenant/settings?demo=true" | jq .
```

---

## 9. Custom Domain Setup

### 9.1 Vercel Domain Configuration

1. Go to: https://vercel.com/vec717/guildos/settings/domains
2. Enter your domain (e.g., `guildos.com`)
3. Follow Vercel's DNS configuration instructions

### 9.2 DNS Records

| Record Type | Name | Value |
|-------------|------|-------|
| CNAME | `www` | `cname.vercel-dns.com` |
| A | `@` | `76.76.21.21` |
| A | `@` | `76.76.21.98` |

### 9.3 Tenant Subdomains

Tenant subdomains use wildcard CNAME:

| Record Type | Name | Value |
|-------------|------|-------|
| CNAME | `*` | `cname.vercel-dns.com` |

Vercel middleware (`src/proxy.ts`) routes:
- `retro-quest.guildos.com` -> `guildos-flax.vercel.app/[retro-quest]/dashboard`

### 9.4 Update Environment Variables

After domain is configured:

```bash
echo "https://guildos.com" | vercel env add NEXT_PUBLIC_APP_URL production --scope vec717 -y
```

And update Supabase auth settings:
1. Go to: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/settings
2. Add `https://guildos.com` to Site URL
3. Add `https://*.guildos.com` to Additional Redirect URLs

---

## 10. SSL Verification

Vercel provisions SSL certificates automatically via Let's Encrypt. Verify:

### 10.1 Check SSL Certificate

```bash
# Check certificate chain
curl -vI https://guildos-flax.vercel.app 2>&1 | grep -i "ssl\|certificate\|tls"

# Or use openssl
echo | openssl s_client -connect guildos-flax.vercel.app:443 2>/dev/null | openssl x509 -noout -dates
```

### 10.2 Check HTTP → HTTPS Redirect

```bash
# HTTP should redirect to HTTPS
curl -sI http://guildos-flax.vercel.app 2>&1 | grep -i "location\|301\|308"
# Expected: 308 Permanent Redirect to https://...
```

### 10.3 HSTS Header

Vercel automatically adds HSTS headers. Verify:

```bash
curl -sI https://guildos-flax.vercel.app | grep -i strict-transport
# Expected: Strict-Transport-Security: max-age=63072000
```

### 10.4 Custom Domain SSL

For custom domains, SSL is auto-provisioned within minutes of DNS propagation:

```bash
curl -sI https://guildos.com | head -20
# Should show valid certificate and no SSL warnings
```

### 10.5 CSP Headers Check

Verify Content Security Policy is enforced:

```bash
curl -sI https://guildos-flax.vercel.app | grep -i "content-security-policy"
# Should show CSP directive
# CSP violations are reported to: /api/security/csp-report
```

---

## Deployment Checklist

Use this checklist for every deployment:

```
[ ] Build passes locally (npm run build)
[ ] All env vars set on Vercel (27 vars documented above)
[ ] Supabase migrations applied
[ ] Realtime enabled on required tables
[ ] Vercel KV connected (rate limiting)
[ ] Stripe webhook endpoint configured
[ ] SMTP configured in Supabase Dashboard
[ ] Email templates applied in Supabase Dashboard
[ ] Deploy to Vercel (vercel deploy --prod --yes --scope vec717)
[ ] Smoke test all URLs manually
[ ] API health check passes (12 endpoints)
[ ] Playwright e2e tests pass
[ ] Cron jobs can be triggered manually
[ ] Auth OTP flow works
[ ] SSL certificate valid
[ ] HTTP -> HTTPS redirect works
[ ] Custom domain DNS propagated (if applicable)
```

---

## Emergency Procedures

| Scenario | Action |
|----------|--------|
| Build fails | Check TypeScript/ESLint, run `npm run build` locally |
| API returns 500s | Check Vercel logs, verify env vars, check Supabase connectivity |
| Auth broken | Check Supabase Auth settings, SMTP config, JWT expiry |
| Page not loading | Check middleware proxy rules, demo mode detection |
| Rate limiting bypassed | Verify KV env vars, check rate-limit.ts, redeploy |
| Stripe payments failing | Check Stripe API keys, webhook endpoint, verify live mode keys |
| Data lost | Restore from Supabase automated backup (point-in-time recovery) |
