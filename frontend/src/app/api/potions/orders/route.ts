// ============================================================================
// GET /api/potions/orders — List potion orders for the org
// POST /api/potions/orders — Place a new potion order
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({ orders: [] });
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('potion_orders').select('*').eq('organization_id', session.organization_id).order('created_at', { ascending: false }).limit(50);
    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.items || !body.total) {
    return NextResponse.json({ error: 'items and total are required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({
      success: true,
      order: {
        id: `po-demo-${Date.now()}`,
        organization_id: session.organization_id,
        profile_id: session.id,
        items: body.items,
        total: body.total,
        status: 'PENDING',
        station_id: body.station_id || null,
        created_at: new Date().toISOString(),
      },
      xpEarned: 15,
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('potion_orders').insert({
      organization_id: session.organization_id,
      profile_id: session.id,
      items: body.items,
      total: body.total,
      status: 'PENDING',
      station_id: body.station_id || null,
    }).select().single();

    if (error) throw error;

    // Award XP for ordering healthy items
    await supabase.from('xp_transactions').insert({
      profile_id: session.id,
      amount: 15,
      source: 'POTION_PURCHASE',
      reference_type: 'potion_order',
      reference_id: data.id,
    });

    return NextResponse.json({ success: true, order: data, xpEarned: 15 });
  } catch (err) {
    console.error('[Potions] Order failed:', err);
    return NextResponse.json({ error: 'Order failed' }, { status: 500 });
  }
}
