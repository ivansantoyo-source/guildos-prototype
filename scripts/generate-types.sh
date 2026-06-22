#!/usr/bin/env bash
# ============================================================================
# GUILDOS — TypeScript Types Generator
# Uses Supabase CLI to generate TypeScript types from guildos_core schema
# ============================================================================

set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo "  GUILDOS — TypeScript Types Generator"
echo "═══════════════════════════════════════════════════"

# Check for supabase CLI
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx is required but not installed."
  exit 1
fi

# Target: generate types for guildos_core schema only
OUTPUT_FILE="frontend/src/lib/types/database.ts"
SCHEMA="guildos_core"

echo "Schema: ${SCHEMA}"
echo "Output: ${OUTPUT_FILE}"

# Ensure the output directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Generate types using supabase CLI (if local supabase is running)
if command -v supabase &> /dev/null; then
  echo "Generating types from local Supabase instance..."
  supabase gen types typescript --schema "${SCHEMA}" --local > "${OUTPUT_FILE}"
elif [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  # Use remote Supabase project
  PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https?://([^.]+)\..*|\1|')
  echo "Generating types from remote project: ${PROJECT_REF}"

  supabase gen types typescript \
    --project-id "${PROJECT_REF}" \
    --schema "${SCHEMA}" \
    > "${OUTPUT_FILE}"
else
  echo "WARNING: Neither local Supabase nor remote project credentials found."
  echo "Run this script after setting up Supabase to generate types."
  echo ""
  echo "For local development:"
  echo "  supabase start"
  echo "  bash scripts/generate-types.sh"
  echo ""
  echo "For remote projects:"
  echo "  export NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co"
  echo "  export SUPABASE_SERVICE_ROLE_KEY=<service_role_key>"
  echo "  bash scripts/generate-types.sh"
  exit 0
fi

if [ -f "${OUTPUT_FILE}" ]; then
  LINES=$(wc -l < "${OUTPUT_FILE}")
  echo "✅ Generated ${OUTPUT_FILE} (${LINES} lines)"
else
  echo "❌ Failed to generate types."
  exit 1
fi
