import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withHardening } from '@/lib/auth/server-auth';
import { SettingsSchema } from '@/lib/validation/schemas';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import type { TenantConfig } from '@/lib/types/tenant-keys';
import type { ValidatedNextRequest, ServerSession } from '@/lib/auth/server-auth';

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
async function handleGet(request: NextRequest, session: ServerSession) {
  try {
    const demoMode = await isDemoModeServer(request.nextUrl.searchParams);

    if (demoMode) {
      return NextResponse.json({ data: DEMO_CONFIG, source: 'demo' });
    }

    // Production: query Supabase organizations table scoped to the session's org
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('config')
      .eq('id', session.dbUser.organization_id)
      .single();

    if (error) {
      console.error('[Tenant Settings] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      data: (data?.config as TenantConfig) || {},
      source: 'supabase',
    });
  } catch (err) {
    console.error('[Tenant Settings] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/tenant/settings — Update tenant configuration.
 * Body: Partial<TenantConfig> — merged with existing config.
 * Sensitive keys (stripe secret, twilio token, API keys) are stored in Supabase
 * with RLS protection (only organization owner/admin can read/write).
 */
async function handlePut(request: NextRequest, session: ServerSession) {
  try {
    const demoMode = await isDemoModeServer(request.nextUrl.searchParams);
    const body = (request as ValidatedNextRequest<
      z.infer<typeof SettingsSchema>
    >).validatedData;

    // In demo mode, return the merged config
    if (demoMode) {
      const merged = { ...DEMO_CONFIG, ...body };
      return NextResponse.json({ data: merged, source: 'demo' });
    }

    // Production: fetch existing config scoped to the session's org, merge, and update
    const supabase = await createClient();

    const { data: current, error: fetchError } = await supabase
      .from('organizations')
      .select('id, config')
      .eq('id', session.dbUser.organization_id)
      .single();

    if (fetchError) {
      console.error('[Tenant Settings] Fetch error:', fetchError.message);
      return NextResponse.json({ error: 'Failed to fetch current settings' }, { status: 500 });
    }

    const merged = { ...(current?.config as object || {}), ...body };

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ config: merged })
      .eq('id', current.id);

    if (updateError) {
      console.error('[Tenant Settings] Update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ data: merged, source: 'supabase' });
  } catch (error) {
    console.error('[Tenant Settings] Parse/update error:', error);
    return NextResponse.json({ error: 'Unable to process request' }, { status: 400 });
  }
}

export const GET = withHardening(handleGet, {
  roles: ['admin', 'owner'],
  rateLimit: { key: 'tenant-settings-get', maxRequests: 60, windowMs: 60_000 },
});

export const PUT = withHardening(handlePut, {
  roles: ['admin', 'owner'],
  schema: SettingsSchema,
  rateLimit: { key: 'tenant-settings-put', maxRequests: 30, windowMs: 60_000 },
});
