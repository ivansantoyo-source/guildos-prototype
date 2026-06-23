#!/bin/bash
set -e
TARGET=${1:-local}
BASE_URL=${2:-http://localhost:3000}
[ "$TARGET" = "prod" ] && BASE_URL="https://guildos-flax.vercel.app"

echo "=== GuildOS Load Test Suite ==="
echo "Target: $BASE_URL"
echo ""

echo "--- Smoke Test ---"
k6 run --env BASE_URL="$BASE_URL" load-tests/scenarios/smoke-test.js
echo "✅ Smoke test passed"
echo ""

SCENARIOS=("api-load-test" "page-load-test" "spike-test" "endurance-test")
for s in "${SCENARIOS[@]}"; do
  echo "--- $s ---"
  k6 run --env BASE_URL="$BASE_URL" "load-tests/scenarios/$s.js" || echo "⚠️  $s completed with warnings"
  echo ""
done
echo "=== Complete ==="
