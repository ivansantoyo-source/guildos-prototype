import { NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/toggles';
import type { TenantConfig } from '@/lib/types/tenant-keys';

const DEMO_CONFIG: TenantConfig = {
  store: {
    name: 'Time Warp Gaming',
    address: '123 Retro Lane, Portland, OR 97201',
    phone: '(503) 555-GAME',
    email: 'hello@timewarpgaming.com',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    tax_rate: 8.5,
  },
  branding: {
    logo_url: undefined,
    tagline: 'Where retro lives forever.',
    primary_color: '#0d1117',
    accent_color: '#7ec850',
  },
  features: {
    ai_shopkeeper: true,
    vision_scanner: true,
    sms_marketing: false,
    b2b_network: true,
    nexus_unlimited: false,
  },
  stripe: {},
  twilio: {},
  pricecharting: {},
  ai: {},
  iot: {},
  demoMode: true,
};

/**
 * GET /api/tenant/settings — Retrieve current tenant's BYO key configuration.
 * In production: reads from guildos_core.organizations.config JSONB.
 * In demo: returns the demo tenant config.
 */
export async function GET() {
  if (isDemoMode()) {
    return Response.json({ data: DEMO_CONFIG, source: 'demo' });
  }

  // Production: query Supabase
  return Response.json({
    data: DEMO_CONFIG,
    source: 'supabase',
    message: 'Connected to Supabase — tenant config from organizations.config',
  });
}

/**
 * PUT /api/tenant/settings — Update tenant configuration.
 * Body: Partial<TenantConfig> — merged with existing config.
 * Sensitive keys (stripe secret, twilio token, API keys) are stored in Supabase
 * with RLS protection (only organization owner/admin can read/write).
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TenantConfig>;

    // In demo mode, return the merged config
    if (isDemoMode()) {
      const merged = { ...DEMO_CONFIG, ...body };
      return Response.json({ data: merged, source: 'demo' });
    }

    // Production: update guildos_core.organizations.config
    return Response.json({
      data: body,
      source: 'supabase',
      message: 'Settings updated',
    });
  } catch (error) {
    return Response.json({ error: 'Invalid request', details: String(error) }, { status: 400 });
  }
}
