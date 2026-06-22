#!/usr/bin/env bash
# ============================================================================
# GUILDOS  Production Setup — Complete One-Shot Script
# Run this from the GuildOS project root with: bash scripts/production_setup.sh
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════"
echo "  GUILDOS — Production Setup"
echo "═══════════════════════════════════════════════════"
echo -e "${NC}"

# --------------------------------------------------
# STEP 1: Database Migration
# --------------------------------------------------
echo -e "${YELLOW}[1/3] Running database migration...${NC}"

if [ -f "frontend/.env.local" ]; then
  source <(grep -E '^[A-Z_]' frontend/.env.local | sed 's/^/export /')
fi

if [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  python3 scripts/run_migration.py
  echo -e "${GREEN}  ✓ Migration complete${NC}"
else
  echo -e "${RED}  ✗ SUPABASE_SERVICE_ROLE_KEY not set. Skipping migration.${NC}"
  echo "    Set env vars in frontend/.env.local and re-run."
fi

# --------------------------------------------------
# STEP 2: Set Vercel Environment Variables
# --------------------------------------------------
echo ""
echo -e "${YELLOW}[2/3] Setting Vercel environment variables...${NC}"

if command -v vercel &> /dev/null; then
  echo "  Setting NEXT_PUBLIC_SUPABASE_URL..."
  echo "${NEXT_PUBLIC_SUPABASE_URL}" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo "  Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
  echo "${NEXT_PUBLIC_SUPABASE_ANON_KEY}" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo "  Setting SUPABASE_SERVICE_ROLE_KEY..."
  echo "${SUPABASE_SERVICE_ROLE_KEY}" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo "  Setting NEXT_PUBLIC_DEMO_MODE=false..."
  echo "false" | vercel env add NEXT_PUBLIC_DEMO_MODE production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo "  Setting CRON_SECRET..."
  echo "guildos-cron-prod-v1-2026" | vercel env add CRON_SECRET production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo "  Setting BLACKLIST_VERIFICATION_KEY..."
  echo "guildos-blacklist-prod-v1-2026" | vercel env add BLACKLIST_VERIFICATION_KEY production --cwd frontend -y 2>/dev/null || echo "    (already set or skipped)"

  echo -e "${GREEN}  ✓ Environment variables configured${NC}"
else
  echo -e "${RED}  ✗ Vercel CLI not found. Set env vars manually at:${NC}"
  echo "    https://vercel.com/vec717/guildos/settings/environment-variables"
fi

# --------------------------------------------------
# STEP 3: Redeploy to Vercel
# --------------------------------------------------
echo ""
echo -e "${YELLOW}[3/3] Redeploying to Vercel...${NC}"

if command -v vercel &> /dev/null; then
  cd frontend
  vercel deploy --prod --yes
  cd ..
  echo -e "${GREEN}  ✓ Deployment triggered${NC}"
else
  echo -e "${RED}  ✗ Vercel CLI not found. Deploy manually at:${NC}"
  echo "    https://vercel.com/vec717/guildos"
fi

echo ""
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════"
echo "  GUILDOS PRODUCTION SETUP COMPLETE"
echo "═══════════════════════════════════════════════════"
echo -e "${NC}"
echo "  App URL: https://guildos-flax.vercel.app"
echo "  Supabase: https://tyustwqwvjmzvuazfwkv.supabase.co"
echo "  Schema:   guildos_core (isolated from Aegis public)"
echo ""
