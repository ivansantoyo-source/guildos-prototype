// ============================================================================
// POST /api/auth/send-otp — Send magic link / OTP email via Supabase
// Public endpoint — no auth required. Rate limited to 1/min per email.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { SendOtpSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body — expected JSON' }, { status: 400 });
  }

  const validation = SendOtpSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e) => e.message);
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  const { email } = validation.data;

  // Rate limit: 3 OTPs per 5 minutes per email (stricter than default)
  const rateKey = `send-otp:${email.toLowerCase()}`;
  if (await rateLimit(rateKey, { maxRequests: 3, windowMs: 300_000 })) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before requesting a new code.', retryAfterMs: 300_000 },
      { status: 429 }
    );
  }

  // Demo mode: simulate success, log the OTP to console
  if (demo) {
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEMO] OTP for ${email}: ${mockOtp}`);
    return NextResponse.json({
      success: true,
      message: 'Check your email (demo mode — OTP logged to console)',
      demoOtp: mockOtp,
    });
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[send-otp] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email for a magic link and verification code.',
    });
  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
