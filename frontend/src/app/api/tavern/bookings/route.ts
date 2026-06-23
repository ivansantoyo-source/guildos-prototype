// ============================================================================
// GET /api/tavern/bookings — List station bookings
// POST /api/tavern/bookings — Create a station booking (with Stripe Checkout)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentCheckoutSession } from '@/lib/integrations/stripe';
import { standardError, handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    return NextResponse.json({
      data: [
        { id: 'bk-demo-001', station_id: 'st-demo-001', organization_id: session.organization_id, profile_id: session.id, start_time: new Date(Date.now() - 7200000).toISOString(), end_time: new Date(Date.now() + 3600000).toISOString(), status: 'CONFIRMED', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
        { id: 'bk-demo-002', station_id: 'st-demo-002', organization_id: session.organization_id, profile_id: session.id, start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 108000000).toISOString(), status: 'PENDING', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('station_bookings')
      .select('*')
      .eq('organization_id', session.organization_id)
      .order('start_time', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ data: data || [], source: 'production' });
  } catch (err) {
    return handleApiError(err, '[Tavern:GET]');
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const body = await request.json().catch(() => ({}));
  if (!body.station_id || !body.start_time || !body.end_time) {
    return standardError(400, 'station_id, start_time, and end_time are required');
  }

  const demo = await isDemoModeServer(searchParams);

  // Calculate hours and total amount
  const startMs = new Date(body.start_time).getTime();
  const endMs = new Date(body.end_time).getTime();
  const hours = Math.max(1, Math.ceil((endMs - startMs) / 3600000));

  if (demo) {
    return NextResponse.json({
      data: {
        id: `bk-demo-${Date.now()}`,
        station_id: body.station_id,
        organization_id: session.organization_id,
        profile_id: session.id,
        start_time: body.start_time,
        end_time: body.end_time,
        status: 'CONFIRMED',
        total_charged: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      checkoutUrl: null,
      demo: true,
      message: 'Booking confirmed! (Demo Mode — no charge)',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch station to get hourly_rate
    const { data: station, error: stationErr } = await supabase
      .from('stations')
      .select('*')
      .eq('id', body.station_id)
      .eq('organization_id', session.organization_id)
      .single();

    if (stationErr || !station) {
      return standardError(404, 'Station not found');
    }

    if (station.status !== 'AVAILABLE') {
      return standardError(409, 'Station is not available');
    }

    // Calculate total
    const total = station.hourly_rate * hours;

    let checkoutUrl: string | null = null;

    // If station has a rate, create Stripe Checkout
    if (station.hourly_rate > 0) {
      const checkout = await createPaymentCheckoutSession(
        total,
        `Station Booking: ${station.name} (${hours}h)`,
        `${process.env.NEXT_PUBLIC_APP_URL}/tavern?checkout=success&booking=${body.station_id}`,
        `${process.env.NEXT_PUBLIC_APP_URL}/tavern?checkout=cancelled`,
      );
      checkoutUrl = checkout.url;
    }

    // Create booking record
    const { data: booking, error } = await supabase
      .from('station_bookings')
      .insert({
        station_id: body.station_id,
        organization_id: session.organization_id,
        profile_id: session.id,
        start_time: body.start_time,
        end_time: body.end_time,
        status: checkoutUrl ? 'PENDING' : 'CONFIRMED', // PENDING until paid
        rgb_color: body.rgb_color || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        data: booking,
        checkoutUrl,
        hours,
        total,
        hourly_rate: station.hourly_rate,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err, '[Tavern:POST]');
  }
}
