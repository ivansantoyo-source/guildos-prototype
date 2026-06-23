import { isDemoModeServer } from '@/lib/toggles/server';
import { TIER_FEATURES, shouldUseMock } from '@/lib/toggles';
import { NextRequest, NextResponse } from 'next/server';
import { withHardening } from '@/lib/auth/server-auth';

/**
 * GET /api/system/mode
 * Returns the current system mode, tier, and available features.
 * Used by the UI to conditionally show/hide features.
 *
 * Hardened with rate limiting (60/min for public reads) and auth.
 * Demo mode continues to work via ?demo=true (mock session created by getServerSession).
 */
const GET = withHardening(
  async (request: NextRequest) => {
    const demoMode = await isDemoModeServer(request.nextUrl.searchParams);

    // In demo, assume wizard tier for maximum feature showcase
    const tier = demoMode ? 'wizard' : 'merchant';
    const features = TIER_FEATURES[tier] ?? TIER_FEATURES.merchant;

    return NextResponse.json({
      mode: demoMode ? 'demo' : 'production',
      tier,
      features,
      services: {
        ai: shouldUseMock('ai') ? 'mock' : 'live',
        payments: shouldUseMock('payments') ? 'mock' : 'live',
        sms: shouldUseMock('sms') ? 'mock' : 'live',
        pricing: shouldUseMock('pricing') ? 'mock' : 'live',
      },
      version: '2.0.0',
    });
  },
  {
    // GET: read-only — rate limited at 60/min, auth required (any authenticated user)
    rateLimit: { key: 'system-mode', maxRequests: 60, windowMs: 60_000 },
  }
);

export { GET };
