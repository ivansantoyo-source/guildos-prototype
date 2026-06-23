# Email Configuration for Passwordless Auth

GuildOS uses Supabase Auth's `signInWithOtp()` for magic link and OTP-based passwordless authentication. This document covers configuring email templates and delivery in Supabase.

## Prerequisites

- Supabase project: **Aegis-OS-DB** (ref: `tyustwqwvjmzvuazfwkv`)
- Supabase Dashboard access: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/templates
- (For production) A custom SMTP provider — see section below

## How The Auth Flow Works

```
User enters email
       │
       ▼
fetch POST /api/auth/send-otp
  → supabase.auth.signInWithOtp({ email, shouldCreateUser: true })
    → Sends email via Supabase's configured email service
       │
       ├─ Magic link button → /auth/callback?token_hash=xxx&type=magiclink
       │                       → supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
       │                       → Sets session cookie → redirect to /dashboard or /onboarding
       │
       └─ OTP code entry    → POST /api/auth/verify-otp (6-digit code)
                              → supabase.auth.verifyOtp({ email, token, type: 'email' })
                              → Sets session cookie → redirect to /dashboard or /onboarding
```

## Step 1: Configure Email Templates in Supabase Dashboard

### Navigation

1. Go to https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/templates
2. You'll see tabs for each template type

### Template Types to Configure

| Template | When It's Used | Subject |
|----------|---------------|---------|
| **Magic Link** | `signInWithOtp()` — primary auth flow | "Sign in to GuildOS" |
| **Confirmation** | New user signups (if email confirmation enabled) | "Confirm your GuildOS account" |
| **Invite** | User invites from admin panel | "You're invited to GuildOS" |
| **Email Change** | User changes their email address | "Confirm email change - GuildOS" |
| **Recovery** | Password reset flow | "Reset your GuildOS password" |

### To Configure Each Template

1. Click the template tab (e.g., "Magic Link")
2. **Subject** — Copy from the table above
3. **Body** — Open the corresponding `.html` file from `supabase/email-templates/` and paste the full HTML content
4. Click **Save**

### Template Variables Available

| Variable | Magic Link | Confirmation | Invite | Email Change | Recovery |
|----------|:----------:|:------------:|:-----:|:------------:|:--------:|
| `{{ .ConfirmationURL }}` | Yes | Yes | Yes | Yes | Yes |
| `{{ .Token }}` | Yes | Yes | Yes | Yes | Yes |
| `{{ .SiteURL }}` | Yes | Yes | Yes | Yes | Yes |
| `{{ .Email }}` | Yes | Yes | Yes | Yes | Yes |
| `{{ .NewEmail }}` | No | No | No | Yes | No |
| `{{ .RedirectTo }}` | Yes | Yes | Yes | Yes | Yes |

## Step 2: Template HTML Files

All GuildOS-branded email templates are in `supabase/email-templates/`:

```
supabase/email-templates/
  magic-link.html       # Gold-themed, includes both magic link button + OTP code
  otp-code.html         # Green-themed, OTP code display (fallback)
  confirmation.html     # Blue-themed, email confirmation
  invite.html           # Purple-themed, user invitation
  email-change.html     # Orange-themed, email change verification
  recovery.html         # Red-themed, password recovery
```

**Important:** The `otp-code.html` template is NOT a separate Supabase template type. The OTP code (`{{ .Token }}`) is displayed inline within the **Magic Link** template. The `otp-code.html` file is provided as a standalone alternative if you prefer to use OTP-only emails in the future.

To apply: open each HTML file, copy the full contents, and paste into the Supabase Dashboard template editor.

## Step 3: Configure Custom SMTP (Required for Production)

### Why You Need Custom SMTP

| Tier | Email Limit | Notes |
|------|-------------|-------|
| Supabase Free | 4 emails/hour | Will quickly exhaust in production |
| Supabase Pro | 50 emails/hour | 1200/day — still tight for a live app |
| Custom SMTP | Your provider's limit | Resend: 100/day free, SendGrid: 100/day free |

Without custom SMTP, GuildOS will hit rate limits almost immediately in production. Configure a custom SMTP relay.

### SMTP Provider Options

#### Option A: Resend (Recommended)

1. Sign up at https://resend.com
2. Create an API key
3. Verify your domain (`guildos.com`)
4. In Supabase Dashboard, go to **Auth > Settings** or **Project Settings > Auth**
5. Find the SMTP section and enter:

| Field | Value |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key |
| Sender email | `noreply@guildos.com` |
| Sender name | `GuildOS` |

#### Option B: SendGrid

1. Sign up at https://sendgrid.com
2. Create API key with "Mail Send" permission
3. Verify sender identity
4. In Supabase Dashboard SMTP settings:

| Field | Value |
|-------|-------|
| Host | `smtp.sendgrid.net` |
| Port | `465` |
| Username | `apikey` |
| Password | Your SendGrid API key |
| Sender email | `noreply@guildos.com` |
| Sender name | `GuildOS` |

#### Option C: Amazon SES

1. Verify domain in SES console
2. Get SMTP credentials from IAM
3. In Supabase Dashboard:

| Field | Value |
|-------|-------|
| Host | `email-smtp.us-west-2.amazonaws.com` (varies by region) |
| Port | `465` |
| Username | SES SMTP username |
| Password | SES SMTP password |

### Applying SMTP Settings

**Via Dashboard (recommended):**
1. Go to https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/auth/settings
2. Scroll to "SMTP Settings"
3. Toggle "Enable custom SMTP"
4. Fill in the fields from your provider
5. Click "Save" then "Send test email" to verify

**Via config.toml (local dev only):**
```toml
[auth.email.smtp]
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "your_api_key"
admin_email = "noreply@guildos.com"
admin_name = "GuildOS"
```

## Step 4: Auth Settings (Supabase Dashboard)

Go to **Authentication > Settings** and verify:

| Setting | Recommended Value |
|---------|------------------|
| Site URL | `https://guildos-flax.vercel.app` |
| Redirect URLs | `https://guildos-flax.vercel.app/auth/callback` |
| Enable email confirmations | OFF (we use magic link, not password signup) |
| Enable secure email change | ON |
| Allow new user signups | ON (`shouldCreateUser: true` in API route) |

## Testing Email Delivery

### Via the Dev Server

1. Start the dev server: `cd frontend && npm run dev`
2. Use the test script:
   ```bash
   bash scripts/test-otp-flow.sh http://localhost:3000 your-email@example.com
   ```
3. Check the email inbox for the magic link

### Via Supabase Dashboard

1. After configuring SMTP, use the **Send Test Email** button in SMTP settings
2. It will send a test email to verify the configuration

### Via Demo Mode

Without SMTP configured, test the full UI flow using demo mode:

```bash
node scripts/test-otp-flow.js "http://localhost:3000?demo=true" "test@guildos.com"
```

The demo mode bypasses Supabase entirely and returns mock OTP codes.

## Rate Limits

| Endpoint | Limit | Window | Bypass |
|----------|-------|--------|--------|
| `POST /api/auth/send-otp` | 1 request | 60s per email | `?demo=true` |
| `POST /api/auth/verify-otp` | 5 requests | 60s per IP | `?demo=true` |
| Supabase Free Tier | 4 emails | Per hour | Custom SMTP |
| Supabase Pro Tier | 50 emails | Per hour | Custom SMTP |

## Troubleshooting

### "Email address is invalid"

**Cause:** Supabase validates the email domain when using the built-in email service. Non-routable domains (like `guildos.com`, `example.com`) are rejected.

**Fix:** 
- Use a real email address for testing
- Configure custom SMTP (SES/SendGrid/Resend) for more lenient validation

### "Failed to send verification code"

**Cause:** No SMTP configured, or email rate limit exceeded on Supabase's end.

**Fix:**
- Check Supabase Dashboard > Auth > Settings for SMTP configuration
- Wait 1 hour for the rate limit to reset (free tier: 4 emails/hour)
- Configure custom SMTP

### "Error: Attempted to call getDemoSession() from the server but getDemoSession is on the client"

**Cause:** The `roles.ts` file had `"use client"` at the top, which prevented server API routes from importing `getDemoSession()`.

**Fix:** Remove `"use client"` from `src/lib/auth/roles.ts`. The file contains only pure functions (no React hooks, no browser APIs).

### Emails going to spam

- Set up SPF and DKIM DNS records for your sending domain
- Use a dedicated subdomain (e.g., `auth.guildos.com`) for email sending
- Warm up the sending reputation with a low volume initially

## Reference

- [Supabase Auth Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Custom SMTP Guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [GuildOS Auth API Routes](../../frontend/src/app/api/auth/)
- [Auth Callback Handler](../../frontend/src/app/auth/callback/route.ts)
- [Login Page](../../frontend/src/app/login/page.tsx)
