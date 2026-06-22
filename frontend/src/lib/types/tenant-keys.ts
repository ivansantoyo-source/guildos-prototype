// ============================================================================
// GUILDOS — Bring Your Own Key (BYOK) Tenant Configuration
// Each merchant brings their own third-party API keys.
// Stored in organizations.config JSONB column.
// ============================================================================

export interface TenantStripeKeys {
  publishable_key?: string;
  secret_key?: string;
  webhook_secret?: string;
}

export interface TenantTwilioKeys {
  account_sid?: string;
  auth_token?: string;
  phone_number?: string;
}

export interface TenantPriceChartingKeys {
  api_key?: string;
}

export interface TenantAIKeys {
  nvidia_nim_api_key?: string;
  openai_api_key?: string;
}

export interface TenantIoTKeys {
  webhook_url?: string;
}

export interface TenantBranding {
  logo_url?: string;
  tagline?: string;
  primary_color?: string;
  accent_color?: string;
}

export interface TenantConfig {
  // BYO Keys
  stripe?: TenantStripeKeys;
  twilio?: TenantTwilioKeys;
  pricecharting?: TenantPriceChartingKeys;
  ai?: TenantAIKeys;
  iot?: TenantIoTKeys;

  // Branding
  branding?: TenantBranding;

  // Feature flags
  features?: {
    ai_shopkeeper?: boolean;
    vision_scanner?: boolean;
    sms_marketing?: boolean;
    b2b_network?: boolean;
    nexus_unlimited?: boolean;
  };

  // Store settings
  store?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    currency?: string;
    tax_rate?: number;
  };

  // Demo mode (tenant-level override)
  demoMode?: boolean;
}

/**
 * Required platform-level services (NOT BYO — these are platform keys).
 * Merchants don't need to bring these.
 */
export const PLATFORM_SERVICES = {
  supabase: {
    name: 'Supabase',
    description: 'Database, Auth, Storage — shared platform infrastructure',
    required: true,
  },
} as const;

/**
 * BYO services that each merchant can optionally configure.
 * If not configured, the feature gracefully degrades or uses mock data.
 */
export const BYO_SERVICES = {
  stripe: {
    name: 'Stripe',
    description: 'Payment processing and subscription billing',
    required: false,
    docs_url: 'https://dashboard.stripe.com/apikeys',
  },
  twilio: {
    name: 'Twilio',
    description: 'SMS notifications (Wandering Merchant, Score Dethroned, Oracle alerts)',
    required: false,
    docs_url: 'https://console.twilio.com/',
  },
  pricecharting: {
    name: 'PriceCharting',
    description: 'Real-time market price lookups for retro games',
    required: false,
    docs_url: 'https://www.pricecharting.com/api',
  },
  ai: {
    name: 'AI Provider',
    description: 'Custom AI API keys (NVIDIA NIM or OpenAI) for the Synthetic Shopkeeper',
    required: false,
    docs_url: 'https://build.nvidia.com/deepseek-ai/deepseek-r1',
  },
  iot: {
    name: 'IoT Webhook',
    description: 'Smart device triggers (lights, audio) for legendary drops',
    required: false,
    docs_url: 'https://www.make.com/en/integrations',
  },
} as const;

export type BYOServiceKey = keyof typeof BYO_SERVICES;

/**
 * Check if a tenant has configured a specific BYO service.
 */
export function hasTenantKey(config: TenantConfig | null | undefined, service: BYOServiceKey): boolean {
  if (!config) return false;

  switch (service) {
    case 'stripe':
      return !!(config.stripe?.secret_key && config.stripe?.publishable_key);
    case 'twilio':
      return !!(config.twilio?.account_sid && config.twilio?.auth_token);
    case 'pricecharting':
      return !!config.pricecharting?.api_key;
    case 'ai':
      return !!(config.ai?.nvidia_nim_api_key || config.ai?.openai_api_key);
    case 'iot':
      return !!config.iot?.webhook_url;
    default:
      return false;
  }
}

/**
 * Get the effective API key for a service, falling back to platform keys if available.
 */
export function getEffectiveKey(config: TenantConfig | null | undefined, service: BYOServiceKey): string | null {
  if (!config) return null;

  switch (service) {
    case 'stripe':
      return config.stripe?.secret_key ?? process.env.STRIPE_SECRET_KEY ?? null;
    case 'twilio':
      return config.twilio?.auth_token ?? process.env.TWILIO_AUTH_TOKEN ?? null;
    case 'pricecharting':
      return config.pricecharting?.api_key ?? process.env.PRICECHARTING_API_KEY ?? null;
    case 'ai':
      return config.ai?.nvidia_nim_api_key ?? process.env.NVIDIA_NIM_API_KEY ?? null;
    default:
      return null;
  }
}
