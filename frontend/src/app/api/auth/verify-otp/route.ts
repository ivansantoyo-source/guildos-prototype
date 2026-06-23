// ============================================================================
// POST /api/auth/verify-otp — Verify OTP code and return session
// Public endpoint — no auth required. Rate limited to 5/min per IP.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isDemoModeServer } from '@/lib/toggles/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { VerifyOtpSchema } from '@/lib/validation/schemas';
import { getDemoSession } from '@/lib/auth/roles';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);

  // Get client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Rate limit: 5 OTP verifications per 15 minutes per IP (brute force protection)
  const rateKey = `verify-otp:${ip}`;
  if (await rateLimit(rateKey, { maxRequests: 5, windowMs: 900_000 })) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait.', retryAfterMs: 900_000 },
      { status: 429 }
    );
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body — expected JSON' }, { status: 400 });
  }

  const validation = VerifyOtpSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e) => e.message);
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  const { email, token } = validation.data;

  // Demo mode: accept any 6-digit code, return demo session data
  // Production guard: demo mode is never available in production environments
  if (demo && process.env.NODE_ENV === 'production') {
    console.warn('[verify-otp] Demo mode blocked in production');
    return NextResponse.json({ error: 'Demo mode unavailable' }, { status: 403 });
  }

  if (demo) {
    const dbUser = getDemoSession('owner');
    return NextResponse.json({
      session: null,
      user: {
        id: dbUser.id,
        email: email,
        display_name: 'Demo Merchant',
      },
      isNewUser: false,
      isDemo: true,
    });
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Headers may have been sent already
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('[verify-otp] Verification failed:', error.message);

      // Distinguish between invalid code and expired code
      if (error.message.toLowerCase().includes('expired') || error.status === 401) {
        return NextResponse.json(
          { error: 'Your verification code has expired. Please request a new one.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Verification succeeded but no session was created. Please try again.' },
        { status: 500 }
      );
    }

    // Determine if this is a new user (no profile exists yet)
    // We check by querying the profiles table
    let isNewUser = true;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .maybeSingle();

      isNewUser = !profile;
    } catch {
      // If profiles table doesn't exist or query fails, assume new user
      isNewUser = true;
    }

    // Build the response with session info
    const responseData = {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.session.user.id,
          email: data.session.user.email,
        },
      },
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
      isNewUser,
      isDemo: false,
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('[verify-otp] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
