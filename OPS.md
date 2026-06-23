# GuildOS — Operations Runbook

> **Purpose:** Daily, weekly, and incident-response procedures for operating GuildOS in production.
> **Last updated:** 2026-06-23

---

## Table of Contents

1. [Monitoring Dashboards](#1-monitoring-dashboards)
2. [Daily Operations](#2-daily-operations)
3. [Weekly Operations](#3-weekly-operations)
4. [Monthly Operations](#4-monthly-operations)
5. [Cron Job Monitoring](#5-cron-job-monitoring)
6. [Stripe Reconciliation](#6-stripe-reconciliation)
7. [Rate Limit Monitoring](#7-rate-limit-monitoring)
8. [Security Incident Response](#8-security-incident-response)
9. [Scaling Triggers](#9-scaling-triggers)

---

## 1. Monitoring Dashboards

### 1.1 Vercel Dashboard

**URL:** https://vercel.com/vec717/guildos
**Scope:** `vec717`

| View | What to Check | Frequency |
|------|---------------|-----------|
| **Deployments** | Last deploy status, build time, failed checks | Every deploy |
| **Analytics** | Request volume, p95 latency, error rates | Daily |
| **Logs** | Recent errors, 4xx/5xx spikes | Daily |
| **Functions** | Execution duration, memory usage, cold starts | Weekly |
| **Cron Jobs** | Last invocation, success/failure rate | Weekly |

**Key metrics to watch:**
- **Error rate:** > 1% 5xx responses triggers investigation
- **p95 latency:** > 500ms on API routes triggers investigation
- **Cold starts:** > 5% of invocations leads to warm function provisioning
- **Function memory:** > 80% of 1024MB limit triggers memory tuning

### 1.2 Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv
**Project:** Aegis-OS-DB

| View | What to Check | Frequency |
|------|---------------|-----------|
| **Database > Query Performance** | Slow queries, index usage | Weekly |
| **Database > Backups** | Last backup timestamp, backup size | Daily |
| **Auth > Users** | New signups, login failures | Weekly |
| **Auth > Rates** | Rate limit hits, OTP failures | Weekly |
| **Storage** | Usage vs quota | Monthly |
| **Replication** | Realtime subscription status | Weekly |
| **API > Logs** | API usage, error rates | Daily |

### 1.3 Rate Limiting Metrics

The rate limiter logs to Vercel:

```bash
# Check rate limit events in Vercel logs
vercel logs --scope vec717 | grep -i "rate-limit\|429"

# Check in-memory fallback warnings
vercel logs --scope vec717 | grep -i "rate-limit.*in-memory"

# Check per-key rate limit hits
vercel logs --scope vec717 | grep -i "RATE LIMIT EXCEEDED"
```

**Rate-limited endpoints:**
| Endpoint | Window | Max Requests | Key |
|----------|--------|-------------|-----|
| `/api/auth/send-otp` | 60s | 1 | per-email |
| `/api/auth/verify-otp` | 60s | 5 | per-IP |
| `/api/ai/shopkeeper` | 60s | 20 | per-IP+UA |
| `/api/ai/oracle` | 60s | 30 | per-IP+UA |

### 1.4 CSP Violation Monitoring

Content Security Policy violations are logged to the `csp_violations` table:

```sql
-- Check recent CSP violations
SELECT blocked_uri, violated_directive, document_uri, created_at
FROM guildos_core.csp_violations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

If CSP violations spike, review the `content-security-policy` header in either:
- `next.config.js` (if set there)
- Middleware response headers in `src/proxy.ts`

---

## 2. Daily Operations

### 2.1 Morning Health Check (0900 UTC)

Run the verification script:

```bash
#!/bin/bash
BASE="https://guildos-flax.vercel.app"
FAIL=0

echo "=== GuildOS Morning Health Check $(date -u) ==="

# 1. Landing page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
[ "$STATUS" != "200" ] && echo "FAIL: Landing page ($STATUS)" && FAIL=$((FAIL+1))

# 2. Login page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/login")
[ "$STATUS" != "200" ] && echo "FAIL: Login page ($STATUS)" && FAIL=$((FAIL+1))

# 3. Demo dashboard loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/dashboard?demo=true")
[ "$STATUS" != "200" ] && echo "FAIL: Demo dashboard ($STATUS)" && FAIL=$((FAIL+1))

# 4. System mode endpoint
MODE=$(curl -s "$BASE/api/system/mode?demo=true" | jq -r '.mode')
[ "$MODE" != "production" ] && echo "FAIL: System mode ($MODE)" && FAIL=$((FAIL+1))

# 5. Demo API route
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/inventory?demo=true")
[ "$STATUS" -ge 500 ] && echo "FAIL: API inventory ($STATUS)" && FAIL=$((FAIL+1))

echo "\n=== Results: $FAIL failures ==="
exit $FAIL
```

### 2.2 Check for 5xx Spikes

```bash
vercel logs --scope vec717 --since 24h | grep -c "status=5[0-9][0-9]"
vercel logs --scope vec717 --since 24h | grep "status=5[0-9][0-9]"
```

### 2.3 Check Supabase Connection

```bash
# Query the system mode endpoint which tests DB connectivity
curl -s https://guildos-flax.vercel.app/api/system/mode | jq .
# Should return mode, demo status, no errors
```

### 2.4 Verify Rate Limiting Active

```bash
# Hit the OTP endpoint rapidly — should get 429 on second request
curl -s -w "\nHTTP %{http_code}" \
  -X POST "https://guildos-flax.vercel.app/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@healthcheck.com"}'

curl -s -w "\nHTTP %{http_code}" \
  -X POST "https://guildos-flax.vercel.app/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@healthcheck.com"}'
# Expect: 200 first, 429 second
```

---

## 3. Weekly Operations

### 3.1 Backup Verification

Supabase provides automated daily backups. Verify:

1. Go to: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/database/backups
2. Check that the latest backup is within the last 24 hours
3. Check backup size is reasonable (not unexpectedly small/large)
4. Download and verify the latest backup:
   ```bash
   supabase backups list --project-ref tyustwqwvjmzvuazfwkv
   supabase backups download --project-ref tyustwqwvjmzvuazfwkv --file guildos_backup_$(date +%Y%m%d).sql
   ```

> **Note:** Hobby tier Supabase provides 7-day point-in-time recovery. For production with real merchant data, upgrade to Pro tier for longer retention.

### 3.2 Cron Job Health Check

Verify each of the 5 (4 main + 1 escrow) cron jobs ran successfully:

```bash
# Check Vercel cron invocation logs
vercel logs --scope vec717 --since 7d | grep -E "cron|CRON|price-sync|oracle|faction|arbitrage|bounty-expire|escrow"

# Or check cron results in Vercel dashboard:
# https://vercel.com/vec717/guildos/cron-jobs
```

**Cron job schedule:**

| Job | Schedule (UTC) | Purpose | Last Run |
|-----|---------------|---------|----------|
| `price-sync` | Daily 04:00 | Refresh market prices from PriceCharting API | Check daily |
| `bounty-expire` | Daily 04:00 | Expire stale bounties, release escrow holds | Check daily |
| `oracle` | Daily 10:00 | Predictive tag-matching for inventory suggestions | Check daily |
| `b2b/arbitrage` | Daily 08:00 | Cross-tenant inventory matching | Check daily |
| `faction-war` | 28-31 monthly 23:59 | End-of-month faction resolution | Check monthly |
| `escrow-sweep` | Daily 06:00 | Auto-refund unfunded LFG lobbies | Check daily |

### 3.3 Supabase Database Health

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as columns
FROM pg_catalog.pg_tables
WHERE schemaname = 'guildos_core'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'guildos_core';

-- Check for slow queries (>100ms) in recent logs
SELECT
  query,
  mean_exec_time,
  calls,
  rows
FROM pg_stat_statements
WHERE schemaname = 'guildos_core'
  AND mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 3.4 Stripe Webhook Verification

```bash
# Check webhook delivery logs
curl -s https://api.stripe.com/v1/webhook_endpoints \
  -u "sk_test_...:" \
  | jq '.data[] | select(.url | contains("guildos")) | {url, status, last_success: .last_success}'

# Verify recent successful webhooks
vercel logs --scope vec717 --since 7d | grep -i "stripe.*webhook"
```

---

## 4. Monthly Operations

### 4.1 Faction War Resolution

The faction war cron job runs on the last 4 days of the month (28-31) at 23:59 UTC.

**Manual trigger for testing:**
```bash
curl -X GET "https://guildos-flax.vercel.app/api/cron/faction-war" \
  -H "x-cron-secret: $CRON_SECRET"
```

**Post-resolution check:**
```sql
-- Verify faction standings were calculated
SELECT faction, total_points, month, year
FROM guildos_core.faction_standings
WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY total_points DESC;
```

### 4.2 Stripe Reconciliation

Monthly reconciliation matches Stripe payment records against database records:

```sql
-- Check all active subscriptions
SELECT
  o.id as org_id,
  o.name,
  o.config->>'stripe_customer_id' as stripe_customer_id,
  o.config->>'stripe_subscription_id' as stripe_subscription_id,
  o.config->>'subscription_tier' as tier,
  o.config->>'subscription_status' as status
FROM guildos_core.organizations o
WHERE o.config->>'stripe_subscription_id' IS NOT NULL;
```

**Reconciliation steps:**
1. Export all active customers from Stripe Dashboard
2. Match against `organizations.config` stripe_customer_id fields
3. Flag any mismatches (Stripe customer with no DB record, or vice versa)
4. Verify subscription status matches Stripe (active/canceled/past_due)
5. Resolve any billing issues

### 4.3 Cost Analysis

Review monthly costs:

| Service | Hobby Plan Cost | Pro/Production Cost |
|---------|----------------|---------------------|
| Vercel | $0 (Hobby) | $20/mo (Pro) — needed for production |
| Supabase | $0 (Hobby) | $25/mo (Pro) — for merchant data |
| Vercel KV | $0 (Hobby) | $0 (Hobby) — KV free tier sufficient |
| Stripe | $0 (test) | 2.9% + $0.30 per transaction |
| Twilio | pay as you go | ~$0.0079/SMS |
| Resend | $0 (100 emails/day) | From $10/mo for scale |

---

## 5. Cron Job Monitoring

### 5.1 Dashboard

View cron job status at: https://vercel.com/vec717/guildos/cron-jobs

Each cron job shows:
- Last invocation time
- Success/failure status
- HTTP status code returned
- Duration

### 5.2 Success Criteria

| Job | Expected Behavior | Failure Indicators |
|-----|------------------|-------------------|
| `price-sync` | Updates price_history table for active inventory | Price history stale, Vercel log shows 500 or timeout |
| `oracle` | Generates inventory suggestions, inserts into oracle_suggestions | No new rows in oracle_suggestions table |
| `b2b/arbitrage` | Returns matching inventory pairs | No rows in arbitrage_matches table |
| `faction-war` | Calculates monthly faction standings, resets monthly points | Faction standings not updated at month boundary |
| `bounty-expire` | Updates expired bounties, refunds escrow | Stale bounties remain past their `expires_at` |
| `escrow-sweep` | Refunds unfunded lobbies past deadline | Unfunded lobbies remain past deadline |

### 5.3 Manual Trigger (For Testing)

```bash
CRON_SECRET="guildos-cron-prod-v1-2026"

for JOB in "cron/price-sync" "cron/oracle" "b2b/arbitrage" "cron/faction-war" "cron/bounty-expire" "cron/escrow-sweep"; do
  echo "=== Triggering $JOB ==="
  curl -s -w "\nHTTP %{http_code}\n" \
    "https://guildos-flax.vercel.app/api/$JOB" \
    -H "x-cron-secret: $CRON_SECRET"
done
```

### 5.4 Cron Log Analysis

```bash
# Last 24 hours of cron activity
vercel logs --scope vec717 --since 1d | grep -E "cron|CRON" | tail -50

# Cron failures in the last 7 days
vercel logs --scope vec717 --since 7d | grep -i "cron" | grep -i "error\|fail\|500\|timeout"
```

---

## 6. Stripe Reconciliation

### 6.1 Daily Webhook Health

```bash
# Check recent webhook deliveries
vercel logs --scope vec717 --since 1d | grep -i "webhooks/stripe"
```

Expected event types:
- `checkout.session.completed` — When a customer completes checkout
- `customer.subscription.created` — New subscription
- `customer.subscription.updated` — Tier change, pause, payment method update
- `customer.subscription.deleted` — Cancellation

### 6.2 DB Sync Verification

```sql
-- Find any checkout sessions that may not have webhook callbacks
SELECT * FROM guildos_core.checkout_sessions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
```

### 6.3 Troubleshooting Stale Webhooks

If Stripe data isn't syncing:

1. **Check the webhook endpoint URL** — it must match `https://guildos-flax.vercel.app/api/webhooks/stripe`
2. **Verify the webhook secret** — `STRIPE_WEBHOOK_SECRET` must match what's in Stripe Dashboard
3. **Check event type selection** — all 4 events must be enabled
4. **Look at Stripe webhook logs** — https://dashboard.stripe.com/webhooks > select endpoint > view logs
5. **Manually replay a webhook event** — Stripe Dashboard can replay any event

### 6.4 Split-Pay / LFG Payment Reconciliation

```bash
# Check for unfunded lobbies
vercel logs --scope vec717 --since 7d | grep -i "funding\|split-pay\|escrow"
```

```sql
-- Check LFG lobbies with pending payments
SELECT * FROM guildos_core.nexus_lfgs
WHERE lobby_status = 'OPEN'
  AND created_at < NOW() - INTERVAL '24 hours';
```

---

## 7. Rate Limit Monitoring

### 7.1 Verify KV Rate Limiting

```bash
# Check if KV is active (should return production warning or be silent)
vercel logs --scope vec717 --since 24h | grep -i "rate-limit"

# If you see "CRITICAL: Vercel KV is not configured" — FIX IMMEDIATELY
# The in-memory fallback is trivially bypassable on Vercel serverless
```

### 7.2 Rate Limit Dashboard

**Signs of rate limiting issues:**
- Increased 429 responses in Vercel logs
- User reports of "Too many requests" errors
- High volume from a single IP in Vercel analytics

```bash
# Check for rate limit hits in the last 24h
vercel logs --scope vec717 --since 24h | grep "status=429" | wc -l

# See which endpoints are being hammered
vercel logs --scope vec717 --since 24h | grep "status=429" | grep -oP '\[.*?\]' | sort | uniq -c | sort -rn
```

### 7.3 Rate Limit Configuration

To adjust rate limits:

1. Edit `/frontend/src/lib/security/rate-limit.ts`
2. Find the `rateLimit()` call for the endpoint
3. Adjust `maxRequests` or `windowMs`
4. Rebuild and deploy

**Current rate limit values:**

| Endpoint | Window | Max | Key Name |
|----------|--------|-----|----------|
| send-otp | 60s | 1 | `send-otp:{email}` |
| verify-otp | 60s | 5 | `verify-otp:{ip}` |
| AI Shopkeeper | 60s | 20 | `shopkeeper:{ip}:{ua_hash}` |
| AI Oracle | 60s | 30 | `oracle:{ip}:{ua_hash}` |

### 7.4 DDoS / Spray Attack Detection

Signs of a distributed attack:
- Rate limit hits spread across many IPs (check Vercel analytics)
- High error rate with no correlating user activity
- Repeated requests to auth endpoints from different user-agents

**Mitigation steps:**
1. Vercel's Edge Network provides basic DDoS protection
2. For application-level attacks, tighten rate limits
3. Consider Vercel WAF (Web Application Firewall) for Pro plan
4. In extreme cases, set `NEXT_PUBLIC_DEMO_MODE` to false and deploy

---

## 8. Security Incident Response

### 8.1 Incident Severity Matrix

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| **Critical** | Data breach, active exploit, service down | < 15 min | SQL injection, RLS bypass, stolen API keys |
| **High** | Significant degradation, auth broken | < 1 hour | Rate limiting bypass, OTP brute force, webhook failure |
| **Medium** | Partial degradation, non-critical bug | < 4 hours | CSP violation spike, slow queries, stale data |
| **Low** | Minor issue, cosmetic bug | < 1 week | UI glitch, typo, non-functional styling issue |

### 8.2 Incident Response Playbook

#### 8.2.1 Critical Incident (e.g., Data Breach)

1. **Isolate** — Deploy with `NEXT_PUBLIC_DEMO_MODE=false` to disable all demo mode
   ```bash
   echo "false" | vercel env add NEXT_PUBLIC_DEMO_MODE production --scope vec717 -y
   vercel deploy --prod --yes --scope vec717
   ```

2. **Diagnose** — Check Vercel logs for the attack vector
   ```bash
   vercel logs --scope vec717 --since 24h | grep -i "error\|unauthorized\|403\|401\|suspicious"
   ```

3. **Contain** — Rotate compromised keys
   ```bash
   # Rotate Supabase service role key in Dashboard
   # Rotate Stripe secret key in Dashboard
   # Update env vars
   vercel env rm SUPABASE_SERVICE_ROLE_KEY production --scope vec717 -y
   # Then add new one
   ```

4. **Audit** — Check audit logs for unauthorized access
   ```sql
   SELECT * FROM guildos_core.audit_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at;
   ```

5. **Recover** — Restore from backup if needed
   ```bash
   supabase db restore --project-ref tyustwqwvjmzvuazfwkv --backup-id <backup-id>
   ```

6. **Notify** — Inform merchant tenants if their data was affected

#### 8.2.2 High Incident (e.g., Auth Broken)

1. Check Supabase Auth status: https://status.supabase.com
2. Verify SMTP configuration in Supabase Dashboard
3. Check OTP rate limits aren't being hit by legitimate users
4. Test the auth flow manually:
   ```bash
   curl -X POST "https://guildos-flax.vercel.app/api/auth/send-otp" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
5. If Supabase is down, deploy with demo mode forced on to keep the site functional

#### 8.2.3 Medium Incident (e.g., CSP Violation Spike)

1. Check the CSP violation report endpoint
   ```bash
   vercel logs --scope vec717 --since 1h | grep "CSP Violation"
   ```
2. Identify the blocked resource (script, style, font, etc.)
3. Update the `content-security-policy` header or the violating code
4. Deploy the fix

### 8.3 Security Contacts

| Contact | For |
|---------|-----|
| Vercel Support | Deployment issues, account security |
| Supabase Support | Database issues, auth problems |
| Stripe Support | Payment issues, fraud detection |
| GitHub Security | Repo compromise, secret leaks |

### 8.4 Key Rotation Schedule

| Key | Rotation Frequency | How |
|-----|-------------------|-----|
| `CRON_SECRET` | Every 6 months | Generate new, update Vercel, update deploy |
| `BLACKLIST_VERIFICATION_KEY` | Every 6 months | Generate new, update Vercel |
| Supabase Service Role Key | Every 6 months | Regenerate in Supabase Dashboard |
| Stripe Webhook Secret | On key compromise | Regenerate in Stripe Dashboard |
| Stripe API Keys | Every 12 months | Regenerate in Stripe Dashboard |

### 8.5 Cross-Tenant Fraud (Blacklist)

The security blacklist shares fraudulent seller data across tenants:

```bash
# Check blacklist activity
vercel logs --scope vec717 --since 7d | grep -i "blacklist"
```

```sql
-- List recent blacklist entries
SELECT * FROM guildos_core.blacklist_entries
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 9. Scaling Triggers

### 9.1 Vercel Plan Upgrade Triggers

| Metric | Warning Threshold | Critical Threshold | Upgrade To |
|--------|------------------|-------------------|------------|
| **Monthly bandwidth** | > 50 GB | > 80 GB | Pro ($20/mo) |
| **Serverless function invocations** | > 500K/month | > 800K/month | Pro ($20/mo) |
| **Edge function invocations** | > 500K/month | > 800K/month | Pro |
| **Source images** | > 1,000 | > 5,000 | Pro |
| **Concurrent builds** | Hobby limit = 1 | Waiting > 10 min | Pro |

**Action when triggering:** Go to https://vercel.com/account/plan and upgrade to Pro.

### 9.2 Supabase Plan Upgrade Triggers

| Metric | Warning Threshold | Critical Threshold | Upgrade To |
|--------|------------------|-------------------|------------|
| **Database size** | > 500 MB (83% of 500 MB Hobby) | > 490 MB | Pro ($25/mo) |
| **Monthly active users** | > 40K (80% of 50K Hobby) | > 48K | Pro |
| **Row count** | > 400K | > 480K | Pro |
| **API requests/month** | > 2M (80% of 2.5M Hobby) | > 2.3M | Pro |
| **Realtime connections** | > 200 (80% of 200 Hobby) | > 190 | Pro |

**Action when triggering:** Go to https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/billing and upgrade.

### 9.3 Vercel KV Upgrade Triggers

| Metric | Warning Threshold | Critical Threshold | Upgrade To |
|--------|------------------|-------------------|------------|
| **KV daily commands** | > 27K (90% of 30K Hobby) | > 29K | Pay-as-you-go |
| **KV storage** | > 50 MB (83% of 60 MB Hobby) | > 58 MB | Pay-as-you-go |

### 9.4 Performance Benchmarks

Target performance values for production monitoring:

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Landing page TTFB | < 200ms | > 500ms | > 1000ms |
| API route p95 latency | < 300ms | > 500ms | > 1000ms |
| Build time | < 60s | > 120s | > 240s |
| Function cold start | < 500ms | > 1000ms | > 2000ms |
| Supabase query < 50 rows | < 50ms | > 100ms | > 500ms |
| Lighthouse score | > 85 | < 75 | < 60 |

### 9.5 Auto-Scaling Notes

**Vercel Serverless Functions:**
- Auto-scale on demand — no configuration needed
- Max 10 concurrent invocations per function on Hobby
- Max 100 concurrent invocations per function on Pro
- Cold start penalty on infrequently called functions

**Supabase:**
- Hobby tier: 500 MB database, 2.5M API requests/month
- Does NOT auto-scale — manual upgrade required
- Connection pooling: 15 connections on Hobby

**Vercel KV:**
- Hobby: 30K daily commands, 60 MB storage
- Does NOT auto-scale — monitor usage and upgrade

---

## Appendix: Quick Reference

### Useful Queries

```sql
-- Active users in last 7 days
SELECT COUNT(DISTINCT profile_id) FROM guildos_core.audit_log
WHERE created_at > NOW() - INTERVAL '7 days';

-- Items scanned this week
SELECT COUNT(*) FROM guildos_core.inventory
WHERE created_at > NOW() - INTERVAL '7 days';

-- Bounties fulfilled this month
SELECT COUNT(*), SUM(store_credit_value) FROM guildos_core.bounties
WHERE status = 'FULFILLED'
  AND updated_at > DATE_TRUNC('month', CURRENT_DATE);

-- Pending invitations/profiles
SELECT COUNT(*) FROM guildos_core.profiles
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Escrow / pending payments
SELECT * FROM guildos_core.nexus_lfgs
WHERE lobby_status = 'OPEN'
  AND start_time < NOW();
```

### Useful Log Greps

```bash
# Auth failures
vercel logs --scope vec717 --since 24h | grep -i "auth\|login\|otp\|verif"

# Stripe issues
vercel logs --scope vec717 --since 24h | grep -i "stripe\|payment\|webhook"

# Database errors
vercel logs --scope vec717 --since 24h | grep -i "supabase\|postgres\|rls\|database"

# API errors
vercel logs --scope vec717 --since 24h | grep -i "error\|exception\|unhandled"

# CORS issues
vercel logs --scope vec717 --since 24h | grep -i "cors\|origin\|access-control"
```

### Emergency Toggle: Force Demo Mode

If Supabase goes down and the site is inaccessible:

```bash
echo "true" | vercel env add NEXT_PUBLIC_DEMO_MODE production --scope vec717 -y
vercel deploy --prod --yes --scope vec717
# Site now runs entirely on phantom/mock data
```

### Emergency Toggle: Force Production Mode

If demo mode is leaking phantom data to production users:

```bash
echo "false" | vercel env add NEXT_PUBLIC_DEMO_MODE production --scope vec717 -y
vercel deploy --prod --yes --scope vec717
# Demo mode now only accessible via ?demo=true URL param
```
