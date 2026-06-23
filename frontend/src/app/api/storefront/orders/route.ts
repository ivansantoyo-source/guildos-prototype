// ============================================================================
// GUILDOS — Storefront Orders API
// Customer order management endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoModeServer } from '@/lib/toggles/server';
import { phantomInventory, phantomOrders } from '@/mocks/phantomData';
import { createClient } from '@/lib/supabase/server';
import { withHardening, type ValidatedNextRequest } from '@/lib/auth/server-auth';

// ============================================================================
// PlaceOrderSchema — Zod validation for order placement
// ============================================================================
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

// ============================================================================
// GET /api/storefront/orders — List orders scoped to the authenticated user
// No public profile_id filter — always scoped to the session user's own profile
// ============================================================================
export const GET = withHardening(async (req, session) => {
  const { searchParams } = req.nextUrl;
  const demo = await isDemoModeServer(searchParams);
  const orderId = searchParams.get('id');
  const status = searchParams.get('status');

  try {
    if (demo) {
      let orders = [...phantomOrders];

      // Single order lookup — scoped to session user's own profile
      if (orderId) {
        const order = orders.find((o) => o.id === orderId && o.profile_id === session.id);
        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json({ data: order });
      }

      // Filter by status
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }

      // ALWAYS scope to the authenticated user's own profile — no external profile_id param
      orders = orders.filter((o) => o.profile_id === session.id);

      // Sort by newest first
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        data: orders,
        meta: { total: orders.length },
      });
    }

    // Production mode — query Supabase scoped to the user's organization and profile
    const supabase = await createClient();
    const orgId = session.dbUser.organization_id;
    const userId = session.dbUser.id;

    // Single order lookup scoped to organization + profile
    if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('organization_id', orgId)
        .eq('profile_id', userId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ data: order });
    }

    let query = supabase
      .from('orders')
      .select('*')
      .eq('organization_id', orgId)
      .eq('profile_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[storefront/orders:GET] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      meta: { total: (data || []).length },
    });
  } catch (error) {
    console.error('[storefront/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}, {
  rateLimit: { key: 'storefront-orders-list', maxRequests: 60, windowMs: 60_000 },
});

// ============================================================================
// POST /api/storefront/orders — Place a new order
// Requires authentication (any role including 'customer')
// Body validated via PlaceOrderSchema, scoped to session user's organization
// ============================================================================
export const POST = withHardening(async (req, session) => {
  const demo = await isDemoModeServer(req.nextUrl.searchParams);
  const body = (req as unknown as ValidatedNextRequest<z.infer<typeof PlaceOrderSchema>>).validatedData;

  const { items, payment_method, discount_code, customer_notes } = body;

  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = 0; // Would validate discount_code in production
  const taxAmount = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
  const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

  const now = new Date().toISOString();
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (demo) {
    const order = {
      id: orderId,
      organization_id: session.organization_id,
      profile_id: session.id,
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
      status: 'CONFIRMED' as const,
      payment_method,
      payment_status: payment_method === 'STRIPE' ? 'PAID' as const : 'PAID' as const,
      customer_notes,
      created_at: now,
      updated_at: now,
    };

    // Deduct stock from phantomInventory for each purchased item
    for (const item of items) {
      const invItem = phantomInventory.find((i) => i.id === item.inventory_id);
      if (invItem) {
        const newStock = Math.max(0, invItem.stock_count - item.quantity);
        invItem.stock_count = newStock;
        if (newStock <= 0) {
          invItem.status = 'RESERVED';
        }
      }
    }

    return NextResponse.json({
      data: order,
      receipt_number: `RCPT-${Date.now()}`,
    });
  }

  // Production: insert into guildos_core.orders
  try {
    const supabase = await createClient();
    const orgId = session.dbUser.organization_id;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        organization_id: orgId,
        profile_id: session.dbUser.id,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        status: 'CONFIRMED',
        payment_method,
        payment_status: payment_method === 'STRIPE' ? 'PAID' : 'UNPAID',
        customer_notes: customer_notes || null,
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
      })
      .select()
      .single();

    if (error) {
      console.error('[storefront/orders:POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
    }

    // Decrement stock_count for each purchased item to prevent overselling
    for (const item of items) {
      const { data: invItem, error: fetchError } = await supabase
        .from('inventory')
        .select('stock_count')
        .eq('id', item.inventory_id)
        .eq('organization_id', orgId)
        .single();

      if (fetchError || !invItem) {
        console.warn(`[storefront/orders:POST] Inventory item not found: ${item.inventory_id}`);
        continue;
      }

      const newStock = Math.max(0, invItem.stock_count - item.quantity);
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          stock_count: newStock,
          ...(newStock <= 0 ? { status: 'RESERVED' } : {}),
        })
        .eq('id', item.inventory_id)
        .eq('organization_id', orgId);

      if (updateError) {
        console.error(`[storefront/orders:POST] Stock deduction failed for ${item.inventory_id}:`, updateError.message);
      }
    }

    return NextResponse.json({
      data: order,
      receipt_number: `RCPT-${Date.now()}`,
    });
  } catch (error) {
    console.error('[storefront/orders] Error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}, {
  schema: PlaceOrderSchema,
  roles: ['owner', 'admin', 'staff', 'customer'],
  rateLimit: { key: 'storefront-orders-create', maxRequests: 30, windowMs: 60_000 },
});
