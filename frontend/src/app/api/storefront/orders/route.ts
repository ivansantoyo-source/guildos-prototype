// ============================================================================
// GUILDOS — Storefront Orders API
// Customer order management endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { phantomOrders } from '@/mocks/phantomData';
import { z } from 'zod';

const PlaceOrderSchema = z.object({
  items: z.array(
    z.object({
      inventory_id: z.string(),
      item_name: z.string(),
      platform: z.string().optional(),
      price: z.number(),
      quantity: z.number().min(1),
      tags: z.array(z.string()).optional(),
    })
  ),
  payment_method: z.enum(['STRIPE', 'STORE_CREDIT', 'CASH', 'CARD']),
  discount_code: z.string().optional(),
  customer_notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const demo = await isDemoModeServer(searchParams);
  const orderId = searchParams.get('id');
  const status = searchParams.get('status');
  const profileId = searchParams.get('profile_id');

  try {
    let orders;

    if (demo) {
      orders = [...phantomOrders];
    } else {
      orders = [...phantomOrders]; // Production fallback
    }

    // Single order lookup
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ data: order });
    }

    // Filter by status
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Filter by profile
    if (profileId) {
      orders = orders.filter((o) => o.profile_id === profileId);
    }

    // Sort by newest first
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      data: orders,
      meta: { total: orders.length },
    });
  } catch (error) {
    console.error('[storefront/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demo = await isDemoModeServer(request.nextUrl.searchParams);

  try {
    const body = await request.json();
    const parsed = PlaceOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, payment_method, discount_code, customer_notes } = parsed.data;

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = 0; // Would validate discount_code in production
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const order = {
      id: orderId,
      organization_id: 'demo-time-warp-001',
      items: items.map((item, idx) => ({
        id: `oi-${orderId}-${idx}`,
        order_id: orderId,
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        platform: item.platform,
        price: item.price,
        quantity: item.quantity,
        tags: item.tags || [],
      })),
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
      status: 'CONFIRMED',
      payment_method,
      payment_status: payment_method === 'STRIPE' ? 'PAID' : 'PAID',
      customer_notes,
      created_at: now,
      updated_at: now,
    };

    if (demo) {
      return NextResponse.json({
        data: order,
        receipt_number: `RCPT-${Date.now()}`,
      });
    }

    // Production: insert into guildos_core.orders
    return NextResponse.json({
      data: order,
      receipt_number: `RCPT-${Date.now()}`,
    });
  } catch (error) {
    console.error('[storefront/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
