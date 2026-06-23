// ============================================================================
// PATCH /api/nexus/rooms/[id] — Book a room or update details
// DELETE /api/nexus/rooms/[id] — Release/cancel a room
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/integrations/stripe';
import { getEffectiveKey } from '@/lib/types/tenant-keys';
import Stripe from 'stripe';

function extractRoomId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  // /api/nexus/rooms/[id] -> id is at index 4
  return segments[4] || null;
}

// ============================================================================
// PATCH — Update room
// ============================================================================
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (!['owner', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const roomId = extractRoomId(request);
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    // Booking flow (setting subscriber_id via Stripe subscription)
    if (body.action === 'book' && body.tier) {
      const sessionUrl = `https://checkout.stripe.com/mock/${body.tier}?room=${roomId}&session=cs_demo_${Date.now()}`;
      return NextResponse.json({
        data: { id: roomId, status: 'RESERVED', checkout_url: sessionUrl },
        source: 'demo',
      });
    }

    // Release room
    if (body.action === 'release') {
      return NextResponse.json({
        data: { id: roomId, status: 'AVAILABLE' },
        source: 'demo',
      });
    }

    // Generic update
    return NextResponse.json({
      data: { id: roomId, ...body, updated_at: new Date().toISOString() },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Booking flow — create a Stripe subscription checkout
    if (body.action === 'book') {
      const tier = body.tier || 'merchant';

      // Fetch org config for BYO keys
      const { data: org } = await supabase
        .from('organizations')
        .select('config')
        .eq('id', session.organization_id)
        .single();

      const checkout = await createCheckoutSession(
        tier as 'merchant' | 'wizard' | 'time_lord',
        undefined,
        body.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
        body.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/rooms/${roomId}?checkout=cancelled`,
        org?.config || null
      );

      // Reserve the room
      await supabase
        .from('nexus_save_rooms')
        .update({ status: 'RESERVED', updated_at: new Date().toISOString() })
        .eq('id', roomId)
        .eq('organization_id', session.organization_id);

      return NextResponse.json({
        data: { id: roomId, status: 'RESERVED', checkout_url: checkout.url, session_id: checkout.sessionId },
        source: 'production',
      });
    }

    // Release room
    if (body.action === 'release') {
      const { data, error } = await supabase
        .from('nexus_save_rooms')
        .update({
          status: 'AVAILABLE',
          subscriber_id: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .eq('organization_id', session.organization_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data, source: 'production' });
    }

    // Generic room update (room_name, description, monthly_rate, amenities, capacity)
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.room_name !== undefined) updateFields.room_name = body.room_name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.monthly_rate !== undefined) updateFields.monthly_rate = body.monthly_rate;
    if (body.amenities !== undefined) updateFields.amenities = body.amenities;
    if (body.capacity !== undefined) updateFields.capacity = body.capacity;
    if (body.status !== undefined) updateFields.status = body.status;

    const { data, error } = await supabase
      .from('nexus_save_rooms')
      .update(updateFields)
      .eq('id', roomId)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' });
  } catch (err) {
    console.error('[nexus:rooms:PATCH] Error:', err);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// ============================================================================
// DELETE — Release/cancel room
// ============================================================================
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (!['owner', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const roomId = extractRoomId(request);
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({ data: { id: roomId, status: 'AVAILABLE' }, source: 'demo' });
  }

  try {
    const supabase = await createClient();

    const { data: room } = await supabase
      .from('nexus_save_rooms')
      .select('*')
      .eq('id', roomId)
      .eq('organization_id', session.organization_id)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Cancel Stripe subscription if one exists
    if (room.stripe_subscription_id) {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('config')
          .eq('id', session.organization_id)
          .single();

        const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
        if (secretKey) {
          const stripe = new Stripe(secretKey);
          await stripe.subscriptions.cancel(room.stripe_subscription_id);
        }
      } catch (stripeErr) {
        console.error('[nexus:rooms:DELETE] Stripe cancel error:', stripeErr);
        // Continue with room cleanup even if Stripe fails
      }
    }

    // Release the room
    const { data, error } = await supabase
      .from('nexus_save_rooms')
      .update({
        status: 'AVAILABLE',
        subscriber_id: null,
        stripe_subscription_id: null,
        qr_code_hash: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' });
  } catch (err) {
    console.error('[nexus:rooms:DELETE] Error:', err);
    return NextResponse.json({ error: 'Failed to release room' }, { status: 500 });
  }
}
