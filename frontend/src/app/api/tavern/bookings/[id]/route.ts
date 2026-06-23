// ============================================================================
// PATCH /api/tavern/bookings/:id — Update a booking (check-in, complete, cancel)
// DELETE /api/tavern/bookings/:id — Cancel a booking (with Stripe refund if applicable)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const validStatuses = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    return NextResponse.json({
      data: {
        id,
        status: body.status,
        updated_at: new Date().toISOString(),
      },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Verify the booking exists and belongs to the org
    const { data: existing, error: findErr } = await supabase
      .from('station_bookings')
      .select('*')
      .eq('id', id)
      .eq('organization_id', session.organization_id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // If cancelling, allow refund logic (future: integrate Stripe refund)
    if (body.status === 'CANCELLED' && existing.status === 'CONFIRMED') {
      // TODO: Issue Stripe refund if payment was collected
      console.log(`[Tavern] Booking ${id} cancelled — refund pending`);
    }

    const { data, error } = await supabase
      .from('station_bookings')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;

    // If checking in, mark station as OCCUPIED
    if (body.status === 'CHECKED_IN') {
      await supabase
        .from('stations')
        .update({
          status: 'OCCUPIED',
          current_player_id: existing.profile_id,
          occupied_at: new Date().toISOString(),
        })
        .eq('id', existing.station_id);
    }

    // If completing or cancelling, mark station as AVAILABLE
    if (body.status === 'COMPLETED' || body.status === 'CANCELLED' || body.status === 'NO_SHOW') {
      await supabase
        .from('stations')
        .update({
          status: 'AVAILABLE',
          current_player_id: null,
          occupied_at: null,
        })
        .eq('id', existing.station_id);
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[Tavern] Update booking failed:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { id } = await context.params;
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    return NextResponse.json({ success: true, message: 'Booking cancelled (Demo Mode)' });
  }

  try {
    const supabase = await createClient();

    // Get the booking
    const { data: existing, error: findErr } = await supabase
      .from('station_bookings')
      .select('*')
      .eq('id', id)
      .eq('organization_id', session.organization_id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Release the station
    await supabase
      .from('stations')
      .update({
        status: 'AVAILABLE',
        current_player_id: null,
        occupied_at: null,
      })
      .eq('id', existing.station_id);

    // Delete the booking
    const { error } = await supabase
      .from('station_bookings')
      .delete()
      .eq('id', id)
      .eq('organization_id', session.organization_id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    console.error('[Tavern] Delete booking failed:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
