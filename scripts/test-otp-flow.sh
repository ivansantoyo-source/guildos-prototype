#!/usr/bin/env bash
# ============================================================================
# Test OTP (Magic Link) Auth Flow — GuildOS
#
# Usage:
#   ./scripts/test-otp-flow.sh [BASE_URL] [EMAIL]
#
# Defaults:
#   BASE_URL = http://localhost:3000
#   EMAIL    = test@guildos.com
#
# For demo-mode testing, the URL must include ?demo=true:
#   ./scripts/test-otp-flow.sh http://localhost:3000?demo=true test@guildos.com
#
# Prerequisites:
#   - curl, python3
#   - Local dev server running: cd frontend && npm run dev
# ============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
EMAIL="${2:-test@guildos.com}"

echo "============================================"
echo "  GuildOS — OTP Auth Flow Test"
echo "============================================"
echo "  Target : $BASE_URL"
echo "  Email  : $EMAIL"
echo "  Time   : $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "============================================"
echo ""

# Strip ?demo=true from BASE_URL for clean concatenation
if [[ "$BASE_URL" == *"?demo=true"* ]]; then
  DEMO_FLAG="?demo=true"
  BASE_CLEAN="${BASE_URL%\?demo=true}"
  echo "[INFO] Demo mode detected — API responses will include mock OTP"
else
  DEMO_FLAG=""
  BASE_CLEAN="$BASE_URL"
fi

# ------------------------------------------------------------------
# Step 1: Health check — verify the server is running
# ------------------------------------------------------------------
echo "--- Step 1: Health Check ---"
HEALTH_OK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_CLEAN" 2>/dev/null || echo "000")
if [ "$HEALTH_OK" = "000" ]; then
  echo "ERROR: Server not reachable at $BASE_CLEAN"
  echo "       Start the dev server: cd frontend && npm run dev"
  exit 1
fi
echo "OK — Server responds ($HEALTH_OK)"
echo ""

# ------------------------------------------------------------------
# Step 2: Send OTP / Magic Link
# ------------------------------------------------------------------
echo "--- Step 2: Send OTP ---"
SEND_RESPONSE=$(curl -s -X POST "${BASE_CLEAN}/api/auth/send-otp${DEMO_FLAG}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Response:"
echo "$SEND_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SEND_RESPONSE"

# Extract demo OTP if provided (for demo mode)
DEMO_OTP=$(echo "$SEND_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('demoOtp', ''))" 2>/dev/null || echo "")

echo ""

# ------------------------------------------------------------------
# Step 3: Check rate limiting (attempt a second send immediately)
# ------------------------------------------------------------------
echo "--- Step 3: Rate Limit Test (immediate re-send) ---"
RATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_CLEAN}/api/auth/send-otp${DEMO_FLAG}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")
if [ "$RATE_RESPONSE" = "429" ]; then
  echo "OK — Rate limit enforced (429 Too Many Requests)"
  RATE_BODY=$(curl -s -X POST "${BASE_CLEAN}/api/auth/send-otp${DEMO_FLAG}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\"}")
  echo "$RATE_BODY" | python3 -m json.tool 2>/dev/null
else
  echo "NOTE — Status: $RATE_RESPONSE (rate limit may not apply locally)"
fi
echo ""

# ------------------------------------------------------------------
# Step 4: Validation test (empty body → 400)
# ------------------------------------------------------------------
echo "--- Step 4: Validation (empty body → 400) ---"
VALIDATION_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_CLEAN}/api/auth/send-otp${DEMO_FLAG}" \
  -H "Content-Type: application/json" \
  -d "{}")
HTTP_CODE=$(echo "$VALIDATION_RESP" | tail -1)
BODY=$(echo "$VALIDATION_RESP" | sed '$d')
echo "Status: $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null
echo ""

# ------------------------------------------------------------------
# Step 5: Verify OTP (demo mode only — uses mock OTP)
# ------------------------------------------------------------------
if [ -n "$DEMO_OTP" ]; then
  echo "--- Step 5: Verify OTP (Demo Mode) ---"
  VERIFY_RESPONSE=$(curl -s -X POST "${BASE_CLEAN}/api/auth/verify-otp${DEMO_FLAG}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"token\": \"$DEMO_OTP\"}")
  echo "Response:"
  echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null
  echo ""

  echo "--- Step 6: Verify OTP — wrong code (demo accepts any code) ---"
  BAD_VERIFY=$(curl -s -X POST "${BASE_CLEAN}/api/auth/verify-otp${DEMO_FLAG}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"token\": \"000000\"}")
  echo "$BAD_VERIFY" | python3 -m json.tool 2>/dev/null
else
  echo "--- Step 5: Verify OTP (Production Mode) ---"
  echo "NOTE: In production mode, the OTP is sent to the user's email."
  echo "      To test manually:"
  echo "        1. Check $EMAIL inbox for the 6-digit code"
  echo "        2. Run: curl -X POST ${BASE_CLEAN}/api/auth/verify-otp \\"
  echo "             -H 'Content-Type: application/json' \\"
  echo "             -d '{\"email\": \"$EMAIL\", \"token\": \"YOUR_CODE\"}'"
  echo ""
  echo "      Or use the login page: open $BASE_CLEAN/login"
fi

echo "============================================"
echo "  Test Complete"
echo "============================================"
