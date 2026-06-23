#!/usr/bin/env bash
# ============================================================================
# GUILDOS — Database Migration Runner
# Runs the guildos_core schema migration against Supabase
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  GUILDOS — Database Migration Runner${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

# Check for required env vars
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo -e "${RED}ERROR: ${var} is not set.${NC}"
    echo "Create a .env file with the required variables first."
    exit 1
  fi
done

echo -e "\n${YELLOW}Target DB:${NC} ${NEXT_PUBLIC_SUPABASE_URL}"
echo -e "${YELLOW}Schema:${NC} guildos_core"

# Determine the migration SQL file
MIGRATION_FILE="${1:-supabase/migrations/0000_initial_schema.sql}"
if [ ! -f "$MIGRATION_FILE" ]; then
  MIGRATION_FILE="$(dirname "$0")/../$MIGRATION_FILE"
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}ERROR: Migration file not found: ${MIGRATION_FILE}${NC}"
  exit 1
fi

echo -e "${YELLOW}Migration file:${NC} ${MIGRATION_FILE}"
echo -e "${YELLOW}Lines:${NC} $(wc -l < "$MIGRATION_FILE")"

# Confirm
echo -e "\n${YELLOW}This will create the guildos_core schema and all 13 tables.${NC}"
echo -e "${YELLOW}Existing tables in guildos_core will NOT be dropped (uses IF NOT EXISTS / ON CONFLICT).${NC}"

read -p "Proceed? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Extract Supabase project ref from URL
# Format: https://<ref>.supabase.co
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https?://([^.]+)\..*|\1|')

# Run migration via psql
echo -e "\n${GREEN}Running migration...${NC}"

PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql \
  "postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -f "$MIGRATION_FILE" \
  --set ON_ERROR_STOP=1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ Migration completed successfully!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

  # Verify schema exists
  echo -e "\n${YELLOW}Verifying tables in guildos_core schema:${NC}"
  PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql \
    "postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'guildos_core' ORDER BY table_name;"
else
  echo -e "\n${RED}═══════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ❌ Migration failed with exit code ${EXIT_CODE}${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════${NC}"
  exit $EXIT_CODE
fi
