// ============================================================================
// PATCH /api/potions/orders/[id] — Update order status
// Admin/staff only. Valid transitions:
//   PENDING -> PREPARING -> READY -> DELIVERED
//   PENDING -> CANCELLED
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function extractOrderId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  // /api/potions/orders/[id] -> id is at index 4
  return segments[4] || null;
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  // Admin/staff only
  if (!['owner', 'admin', 'staff'].includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions — staff or higher required' }, { status: 403 });
  }

  const orderId = extractOrderId(request);
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const newStatus: string | undefined = body.status;

  if (!newStatus) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    const validFrom = VALID_TRANSITIONS['PENDING'] || [];
    if (!validFrom.includes(newStatus)) {
      return NextResponse.json({ error: `Cannot transition PENDING to ${newStatus}` }, { status: 400 });
    }
    return NextResponse.json({
      data: { id: orderId, status: newStatus, updated_at: new Date().toISOString() },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('potion_orders')
      .select('status')
      .eq('id', orderId)
      .eq('organization_id', session.organization_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate state transition
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition ${order.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('potion_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' });
  } catch (err) {
    console.error('[potions:orders:PATCH] Error:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
