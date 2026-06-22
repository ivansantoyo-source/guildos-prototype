// ============================================================================
// GUILDOS — Demo/Production Toggle
// Centralized module for checking operational mode
// ============================================================================

/**
 * Is the platform running in demo mode?
 * In demo mode, all data comes from phantomData.ts mocks.
 * In production mode, all data comes from Supabase / real APIs.
 */
export function isDemoMode(): boolean {
  // Override via env var, default to true for development
  if (typeof window !== 'undefined') {
    // Client-side: check localStorage override first
    try {
      const stored = localStorage.getItem('guildos-store');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.demoMode === false) return false;
      }
    } catch { /* ignore */ }
  }

  // Env var takes precedence
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return false;

  return true;
}

/**
 * Service-level toggles: should this specific service use mock data?
 * Even in production, some services can be individually mock'd.
 */
const SERVICE_DEFAULTS: Record<string, boolean> = {
  ai: true,       // Mock AI by default — requires NVIDIA_NIM_API_KEY
  payments: true, // Mock Stripe by default — requires STRIPE_SECRET_KEY
  sms: true,      // Mock Twilio by default — requires TWILIO_ACCOUNT_SID
  pricing: true,  // Mock PriceCharting by default — requires PRICECHARTING_API_KEY
};

export function shouldUseMock(serviceName: string): boolean {
  if (isDemoMode()) return true;

  // In production, individual services can be toggled off mock mode
  switch (serviceName) {
    case 'ai':
      return !process.env.NVIDIA_NIM_API_KEY;
    case 'payments':
      return !process.env.STRIPE_SECRET_KEY;
    case 'sms':
      return !process.env.TWILIO_ACCOUNT_SID;
    case 'pricing':
      return !process.env.PRICECHARTING_API_KEY;
    default:
      return SERVICE_DEFAULTS[serviceName] ?? true;
  }
}

/**
 * Tenant tier → features mapping
 */
export const TIER_FEATURES: Record<string, string[]> = {
  merchant: [
    'rpg_admin_dashboard',
    'local_seo_hardening',
    'base_inventory_engine',
  ],
  wizard: [
    'rpg_admin_dashboard',
    'local_seo_hardening',
    'base_inventory_engine',
    'deepseek_synthetic_shopkeeper',
    'vision_loot_scanner',
    'automated_sms_marketing',
  ],
  time_lord: [
    'rpg_admin_dashboard',
    'local_seo_hardening',
    'base_inventory_engine',
    'deepseek_synthetic_shopkeeper',
    'vision_loot_scanner',
    'automated_sms_marketing',
    'inter_guild_trade_network',
    'automated_corporate_b2b_engine',
    'unlimited_nexus_access',
  ],
};

export function getFeaturesForTier(tier: string): string[] {
  return TIER_FEATURES[tier] ?? TIER_FEATURES.merchant;
}

export function hasFeature(tier: string, feature: string): boolean {
  return getFeaturesForTier(tier).includes(feature);
}
