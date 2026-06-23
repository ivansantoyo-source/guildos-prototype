// ============================================================================
// POST /api/nexus/rooms/book — Book a save room (Stripe Checkout)
// Creates a Stripe Checkout session for the room's monthly rate.
// On success, redirects to Stripe; on completion, Stripe webhook updates status.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentCheckoutSession } from '@/lib/integrations/stripe';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.room_id) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);

  // --- Demo Mode: simulate booking ---
  if (demo) {
    return NextResponse.json({
      checkoutUrl: null,
      booking: {
        id: `booking-demo-${Date.now()}`,
        room_id: body.room_id,
        profile_id: session.id,
        organization_id: session.organization_id,
        status: 'RESERVED',
        monthly_rate: body.monthly_rate || 25.00,
        created_at: new Date().toISOString(),
      },
      demo: true,
      message: 'Booking confirmed! (Demo Mode)',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch the room to get monthly_rate and verify it's AVAILABLE
    const { data: room, error: roomErr } = await supabase
      .from('nexus_save_rooms')
      .select('*')
      .eq('id', body.room_id)
      .eq('organization_id', session.organization_id)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Room is not available' }, { status: 409 });
    }

    // Create Stripe Checkout session for the room's monthly rate
    const { url: checkoutUrl, sessionId } = await createPaymentCheckoutSession(
      room.monthly_rate,
      `Save Room: ${room.room_name}`,
      `${process.env.NEXT_PUBLIC_APP_URL}/nexus?checkout=success&room=${room.id}`,
      `${process.env.NEXT_PUBLIC_APP_URL}/nexus?checkout=cancelled&room=${room.id}`,
      undefined // tenantConfig — uses platform keys
    );

    // Store the pending checkout session reference
    await supabase.from('nexus_save_rooms').update({
      stripe_subscription_id: sessionId,
      subscriber_id: session.id,
    }).eq('id', room.id);

    return NextResponse.json({
      checkoutUrl,
      sessionId,
      room_id: room.id,
      monthly_rate: room.monthly_rate,
    });
  } catch (err) {
    console.error('[Nexus] Room booking failed:', err);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
