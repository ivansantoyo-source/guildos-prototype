// ============================================================================
// GUILDOS — Demo/Production Toggle
// USER CHOICE takes priority over env var.
// Env var sets DEFAULT, user can override via Zustand/localStorage.
// ============================================================================

/**
 * Is the platform running in demo mode?
 * Priority: URL param (?demo=true) > Zustand localStorage > env var
 */
export function isDemoMode(): boolean {
  // 1. Check URL param (highest priority — allows deep-linking to demo)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'true') return true;
      if (params.get('demo') === 'false') return false;
    } catch { /* ignore */ }
  }

  // 2. Client-side: check localStorage Zustand preference (user's explicit choice)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('guildos-store');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only use stored value if user explicitly set it
        if (typeof parsed?.state?.demoMode === 'boolean') {
          return parsed.state.demoMode;
        }
      }
    } catch { /* ignore */ }
  }

  // 3. Env var sets the DEFAULT (not an override)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  return false;
}

/**
 * Force demo mode on (used by landing page, login page).
 * Sets both Zustand store and URL param for consistent behavior.
 */
export function forceDemoMode(): void {
  try {
    // Set in Zustand store
    const { useGuildStore } = require('@/lib/store/useGuildStore');
    useGuildStore.getState().setDemoMode(true);

    // Add URL param for server-side API awareness
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('demo', 'true');
      window.history.replaceState({}, '', url.toString());
    }
  } catch { /* ignore */ }
}

/**
 * Service-level toggles: should this specific service use mock data?
 * In demo mode: always mock. In production: mock only if key not configured.
 */
export function shouldUseMock(serviceName: string): boolean {
  if (isDemoMode()) return true;

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
      return false;
  }
}

export const TIER_FEATURES: Record<string, string[]> = {
  merchant: ['rpg_admin_dashboard', 'local_seo_hardening', 'base_inventory_engine'],
  wizard: ['rpg_admin_dashboard', 'local_seo_hardening', 'base_inventory_engine', 'deepseek_synthetic_shopkeeper', 'vision_loot_scanner', 'automated_sms_marketing'],
  time_lord: ['rpg_admin_dashboard', 'local_seo_hardening', 'base_inventory_engine', 'deepseek_synthetic_shopkeeper', 'vision_loot_scanner', 'automated_sms_marketing', 'inter_guild_trade_network', 'automated_corporate_b2b_engine', 'unlimited_nexus_access'],
};

export function getFeaturesForTier(tier: string): string[] {
  return TIER_FEATURES[tier] ?? TIER_FEATURES.merchant;
}

export function hasFeature(tier: string, feature: string): boolean {
  return getFeaturesForTier(tier).includes(feature);
}
