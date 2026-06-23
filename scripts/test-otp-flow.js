#!/usr/bin/env node
// ============================================================================
// Test OTP Auth Flow — GuildOS
// Node.js version with detailed assertions
//
// Usage:
//   node scripts/test-otp-flow.js [http://localhost:3000] [test@guildos.com]
//   node scripts/test-otp-flow.js http://localhost:3000?demo=true test@guildos.com
//
// Prerequisites:
//   npm run dev (local dev server running on port 3000)
// ============================================================================

const BASE_URL = (process.argv[2] || 'http://localhost:3000').replace(/\/$/g, '');
const EMAIL = process.argv[3] || 'test@guildos.com';

const DEMO = BASE_URL.includes('demo=true');
const API_BASE = BASE_URL.replace(/\?demo=true/g, '');
const DEMO_PARAM = DEMO ? '?demo=true' : '';

let testsPassed = 0;
let testsFailed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    testsPassed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    testsFailed++;
  }
}

async function apiPost(path, body) {
  const url = `${API_BASE}${path}${DEMO_PARAM}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log('============================================');
  console.log('  GuildOS — OTP Auth Flow Test (Node.js)');
  console.log('============================================');
  console.log(`  Target : ${BASE_URL}`);
  console.log(`  Email  : ${EMAIL}`);
  console.log(`  Demo   : ${DEMO}`);
  console.log('============================================\n');

  // ------------------------------------------------------------------
  // 1. Send OTP with valid email
  // ------------------------------------------------------------------
  console.log('--- 1. Send OTP (valid email) ---');
  const send1 = await apiPost('/api/auth/send-otp', { email: EMAIL });
  assert('HTTP 200', send1.status === 200, `Got ${send1.status}`);
  assert('success: true', send1.data.success === true);
  assert('message present', typeof send1.data.message === 'string');

  let demoOtp = '';
  if (DEMO && send1.data.demoOtp) {
    demoOtp = send1.data.demoOtp;
    assert('demoOtp is 6 digits', /^\d{6}$/.test(demoOtp), `Got "${demoOtp}"`);
  }
  console.log();

  // ------------------------------------------------------------------
  // 2. Send OTP — missing body → 400
  // ------------------------------------------------------------------
  console.log('--- 2. Send OTP — empty body ---');
  const send2 = await apiPost('/api/auth/send-otp', {});
  assert('HTTP 400', send2.status === 400, `Got ${send2.status}`);
  assert('error message', typeof send2.data.error === 'string');
  console.log();

  // ------------------------------------------------------------------
  // 3. Send OTP — rate limit (second attempt in same second)
  // ------------------------------------------------------------------
  console.log('--- 3. Send OTP — rate limit ---');
  const send3 = await apiPost('/api/auth/send-otp', { email: EMAIL });
  if (send3.status === 429) {
    assert('HTTP 429 rate limited', send3.status === 429);
    assert('retryAfterMs present', typeof send3.data.retryAfterMs === 'number');
  } else {
    // Rate limit might not trigger in local/demo depending on timing
    console.log(`  SKIP  Rate limit not enforced (status ${send3.status})`);
  }
  console.log();

  // ------------------------------------------------------------------
  // 4. Verify OTP — blank body → 400
  // ------------------------------------------------------------------
  console.log('--- 4. Verify OTP — empty body ---');
  const verify0 = await apiPost('/api/auth/verify-otp', {});
  assert('HTTP 400', verify0.status === 400, `Got ${verify0.status}`);
  console.log();

  // ------------------------------------------------------------------
  // 5. Verify OTP — missing email
  // ------------------------------------------------------------------
  console.log('--- 5. Verify OTP — missing email ---');
  const verify1 = await apiPost('/api/auth/verify-otp', { email: EMAIL });
  assert('HTTP 400 (no token)', verify1.status === 400, `Got ${verify1.status}`);
  console.log();

  // ------------------------------------------------------------------
  // 6. Verify OTP — wrong code
  // ------------------------------------------------------------------
  console.log('--- 6. Verify OTP — wrong code ---');
  const verify2 = await apiPost('/api/auth/verify-otp', { email: EMAIL, token: '000000' });
  if (DEMO) {
    // In demo mode, wrong code still works (demo accepts any 6-digit code)
    assert('Demo accepts any code', verify2.status === 200, `Got ${verify2.status}`);
    assert('isDemo: true', verify2.data.isDemo === true);
  } else {
    // In production, wrong code should fail
    assert('HTTP 401', verify2.status === 401, `Got ${verify2.status}`);
  }
  console.log();

  // ------------------------------------------------------------------
  // 7. Verify OTP — correct code (demo mode only)
  // ------------------------------------------------------------------
  if (DEMO && demoOtp) {
    console.log('--- 7. Verify OTP — correct demo code ---');
    const verify3 = await apiPost('/api/auth/verify-otp', { email: EMAIL, token: demoOtp });
    assert('HTTP 200', verify3.status === 200, `Got ${verify3.status}`);
    assert('user.email matches', verify3.data.user.email === EMAIL, `Got "${verify3.data.user?.email}"`);
    assert('isDemo: true', verify3.data.isDemo === true);
    assert('isNewUser: false', verify3.data.isNewUser === false);
    assert('display_name present', typeof verify3.data.user.display_name === 'string');
    console.log();
  }

  // ------------------------------------------------------------------
  // 8. Callback route — missing params (test the route logic)
  // ------------------------------------------------------------------
  console.log('--- 8. Auth callback — no params ---');
  try {
    const cbRes = await fetch(`${API_BASE}/auth/callback${DEMO_PARAM}`, { redirect: 'manual' });
    // Should redirect to /login?error=auth_failed (because no code/token_hash)
    assert('Redirects (3xx)', cbRes.status >= 300 && cbRes.status < 400, `Got ${cbRes.status}`);
    const location = cbRes.headers.get('location') || '';
    assert('Redirects to login', location.includes('/login'), `Got "${location}"`);
  } catch (err) {
    assert('Callback route accessible', false, err.message);
  }
  console.log();

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('============================================');
  console.log(`  Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('============================================');

  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
