import { isDemoModeServer } from '@/lib/toggles/server';
import { TIER_FEATURES, shouldUseMock } from '@/lib/toggles';
import { NextRequest } from 'next/server';

/**
 * GET /api/system/mode
 * Returns the current system mode, tier, and available features.
 * Used by the UI to conditionally show/hide features.
 */
export async function GET(request: NextRequest) {
  const demoMode = await isDemoModeServer(request.nextUrl.searchParams);

  // In demo, assume wizard tier for maximum feature showcase
  const tier = demoMode ? 'wizard' : 'merchant';
  const features = TIER_FEATURES[tier] ?? TIER_FEATURES.merchant;

  return Response.json({
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
}
