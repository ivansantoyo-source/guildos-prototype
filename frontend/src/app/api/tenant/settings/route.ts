import { NextRequest } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
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
export async function GET(request: NextRequest) {
  try {
    const demoMode = await isDemoModeServer(request.nextUrl.searchParams);

    if (demoMode) {
      return Response.json({ data: DEMO_CONFIG, source: 'demo' });
    }

    // Production: query Supabase organizations table
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('config')
      .single();

    if (error) {
      console.error('[Tenant Settings] Supabase error:', error.message);
      return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return Response.json({
      data: (data?.config as TenantConfig) || {},
      source: 'supabase',
    });
  } catch (err) {
    console.error('[Tenant Settings] Unexpected error:', err);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
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
    const demoMode = await isDemoModeServer(request.nextUrl.searchParams);

    // In demo mode, return the merged config
    if (demoMode) {
      const merged = { ...DEMO_CONFIG, ...body };
      return Response.json({ data: merged, source: 'demo' });
    }

    // Production: fetch existing config, merge, and update
    const supabase = await createClient();

    const { data: current, error: fetchError } = await supabase
      .from('organizations')
      .select('id, config')
      .single();

    if (fetchError) {
      console.error('[Tenant Settings] Fetch error:', fetchError.message);
      return Response.json({ error: 'Failed to fetch current settings' }, { status: 500 });
    }

    const merged = { ...(current?.config as object || {}), ...body };

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ config: merged })
      .eq('id', current.id);

    if (updateError) {
      console.error('[Tenant Settings] Update error:', updateError.message);
      return Response.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return Response.json({ data: merged, source: 'supabase' });
  } catch (error) {
    console.error('[Tenant Settings] Parse/update error:', error);
    return Response.json({ error: 'Unable to process request' }, { status: 400 });
  }
}
