// ============================================================================
// POST /api/nexus/rooms/confirm — Confirm a save room booking after Stripe Checkout
// Called when user is redirected back from Stripe with ?checkout=success
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.room_id) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({
      success: true,
      room_id: body.room_id,
      status: 'RESERVED',
      demo: true,
    });
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('nexus_save_rooms')
      .update({
        status: 'RESERVED',
        qr_code_hash: `qr-${Date.now()}-${body.room_id}`,
      })
      .eq('id', body.room_id)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, room: data });
  } catch (err) {
    console.error('[Nexus] Room confirm failed:', err);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
