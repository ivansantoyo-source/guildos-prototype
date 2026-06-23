// ============================================================================
// POST /api/auth/login-attempt — Check rate limits before attempting login
// Public endpoint for pre-flight rate limit checks.
// Tracks OTP send attempts per email (max 3 per 5 min).
// Returns { allowed: true } or { allowed: false, retryAfter: seconds }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { emailSchema } from '@/lib/validation/schemas';

// In-memory store for tracking attempts per email
const attemptStore = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attemptStore) {
      if (now > entry.resetAt) attemptStore.delete(key);
    }
  }, 60_000).unref();
}

export async function POST(request: NextRequest) {
  const demo = await isDemoModeServer(request.nextUrl.searchParams);

  // Demo mode always allows
  if (demo) {
    return NextResponse.json({ allowed: true });
  }

  // Parse + validate body
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body — expected JSON' }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const emailValidation = emailSchema.safeParse(body.email);
  if (!emailValidation.success) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const email = emailValidation.data.toLowerCase();
  const now = Date.now();
  const key = `login-attempt:${email}`;
  const windowMs = 5 * 60_000; // 5 minutes
  const maxAttempts = 3;

  const entry = attemptStore.get(key);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    attemptStore.set(key, { count: 1, resetAt: now + windowMs });
    return NextResponse.json({ allowed: true });
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json({
      allowed: false,
      retryAfter,
      error: `Too many login attempts. Please try again in ${retryAfter} seconds.`,
    });
  }

  entry.count++;
  return NextResponse.json({
    allowed: true,
    attemptsRemaining: maxAttempts - entry.count,
  });
}
