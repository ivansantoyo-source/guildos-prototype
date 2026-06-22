import { isDemoMode, TIER_FEATURES } from '@/lib/toggles';

/**
 * GET /api/system/mode
 * Returns the current system mode and available features.
 * Used by the UI to conditionally show/hide features based on tier.
 */
export async function GET() {
  const demoMode = isDemoMode();

  // In demo, assume wizard tier for maximum feature showcase
  const tier = demoMode ? 'wizard' : 'merchant';
  const features = TIER_FEATURES[tier] ?? TIER_FEATURES.merchant;

  return Response.json({
    mode: demoMode ? 'demo' : 'production',
    tier,
    features,
    services: {
      ai: demoMode ? 'mock' : process.env.NVIDIA_NIM_API_KEY ? 'live' : 'disabled',
      payments: demoMode ? 'mock' : process.env.STRIPE_SECRET_KEY ? 'live' : 'disabled',
      sms: demoMode ? 'mock' : process.env.TWILIO_ACCOUNT_SID ? 'live' : 'disabled',
      pricing: demoMode ? 'mock' : process.env.PRICECHARTING_API_KEY ? 'live' : 'disabled',
    },
    version: '1.0.0-alpha',
  });
}
