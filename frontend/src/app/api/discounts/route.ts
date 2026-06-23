import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { DiscountCode } from '@/lib/types';
import { withHardening, ValidatedNextRequest } from '@/lib/auth/server-auth';
import { DiscountSchema, DiscountRedeemSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';

// In-memory demo discount codes store
const demoDiscounts: DiscountCode[] = [];

/**
 * GET /api/discounts
 * List discount codes for the current tenant
 */
export const GET = withHardening(
  async (_request, session) => {
    if (session.isDemo) {
      return NextResponse.json({
        data: demoDiscounts.filter((d) => d.is_active),
        count: demoDiscounts.filter((d) => d.is_active).length,
      });
    }

    // Production: query discount_codes via Supabase with org scoping
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('organization_id', session.dbUser.organization_id);

    if (error) {
      console.error('[Discounts] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], count: (data || []).length });
  },
  {
    rateLimit: { key: 'discounts-list', maxRequests: 60, windowMs: 60_000 },
  }
);

/**
 * POST /api/discounts
 * Create a new discount code
 * Body: { code, discount_percent, source, expires_at }
 */
export const POST = withHardening(
  async (request, session) => {
    const body = (request as ValidatedNextRequest<z.infer<typeof DiscountSchema>>).validatedData;

    const newCode: DiscountCode = {
      id: `dc-${Date.now()}`,
      organization_id: session.dbUser.organization_id,
      code: body.code ?? `1UP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      discount_percent: body.discount_percent ?? 10.0,
      source: body.source ?? 'KONAMI',
      used_by: undefined,
      used_at: undefined,
      expires_at: body.expires_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (session.isDemo) {
      demoDiscounts.push(newCode);
      return NextResponse.json({ data: newCode }, { status: 201 });
    }

    // Production: insert into discount_codes via Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        organization_id: newCode.organization_id,
        code: newCode.code,
        discount_percent: newCode.discount_percent,
        source: newCode.source,
        expires_at: newCode.expires_at,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Discounts] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  },
  {
    schema: DiscountSchema,
    roles: ['admin', 'owner', 'staff'],
    rateLimit: { key: 'discounts-create', maxRequests: 30, windowMs: 60_000 },
  }
);

/**
 * PUT /api/discounts
 * Redeem a discount code
 * Body: { code, userId }
 */
export const PUT = withHardening(
  async (request, session) => {
    const body = (request as ValidatedNextRequest<z.infer<typeof DiscountRedeemSchema>>).validatedData;
    const { code, userId } = body;

    if (session.isDemo) {
      const discount = demoDiscounts.find((d) => d.code === code && d.is_active);
      if (!discount) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
      }

      discount.is_active = false;
      discount.used_by = userId;
      discount.used_at = new Date().toISOString();

      return NextResponse.json({ data: discount });
    }

    // Production: update discount_codes via Supabase with org scoping
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('discount_codes')
      .update({
        is_active: false,
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)
      .eq('organization_id', session.dbUser.organization_id)
      .eq('is_active', true)
      .select()
      .single();

    if (error || !data) {
      console.error('[Discounts] Redeem error:', error?.message ?? 'Discount code not found');
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    return NextResponse.json({ data });
  },
  {
    schema: DiscountRedeemSchema,
    rateLimit: { key: 'discounts-redeem', maxRequests: 20, windowMs: 60_000 },
  }
);
