import { NextRequest } from 'next/server';
import type { DiscountCode } from '@/lib/types';
import { isDemoMode } from '@/lib/toggles';

// In-memory demo discount codes store
const demoDiscounts: DiscountCode[] = [];

/**
 * GET /api/discounts
 * List discount codes for the current tenant
 */
export async function GET() {
  if (isDemoMode()) {
    return Response.json({
      data: demoDiscounts.filter((d) => d.is_active),
      count: demoDiscounts.filter((d) => d.is_active).length,
    });
  }

  // Production: query guildos_core.discount_codes via Supabase
  return Response.json({ data: [], count: 0 });
}

/**
 * POST /api/discounts
 * Create a new discount code
 * Body: { code, discount_percent, source, expires_at }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newCode: DiscountCode = {
      id: `dc-${Date.now()}`,
      organization_id: 'demo-time-warp-001',
      code: body.code ?? `1UP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      discount_percent: body.discount_percent ?? 10.0,
      source: body.source ?? 'KONAMI',
      used_by: null,
      used_at: null,
      expires_at: body.expires_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isDemoMode()) {
      demoDiscounts.push(newCode);
    }

    return Response.json({ data: newCode }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/discounts
 * Redeem a discount code
 * Body: { code, userId }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code) {
      return Response.json({ error: 'code is required' }, { status: 400 });
    }

    if (isDemoMode()) {
      const discount = demoDiscounts.find((d) => d.code === code && d.is_active);
      if (!discount) {
        return Response.json({ error: 'Invalid or expired code' }, { status: 404 });
      }

      discount.is_active = false;
      discount.used_by = userId ?? null;
      discount.used_at = new Date().toISOString();

      return Response.json({ data: discount });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return Response.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    );
  }
}
