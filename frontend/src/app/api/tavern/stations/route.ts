// ============================================================================
// GET /api/tavern/stations — List stations (with optional ?zone= filter)
// POST /api/tavern/stations — Register a new station
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const zone = searchParams.get('zone');
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    return NextResponse.json({
      data: [
        { id: 'st-demo-001', organization_id: session.organization_id, name: 'Battle Station Alpha', station_type: 'PC', zone: 'MAIN', position_x: 100, position_y: 80, status: 'OCCUPIED', current_game: 'Elden Ring', hourly_rate: 5.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'st-demo-002', organization_id: session.organization_id, name: 'Retro Console 1', station_type: 'CONSOLE', zone: 'CONSOLE_ALLEY', position_x: 220, position_y: 80, status: 'AVAILABLE', current_game: null, hourly_rate: 3.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'st-demo-003', organization_id: session.organization_id, name: 'VR Bay', station_type: 'VR', zone: 'VR_ZONE', position_x: 340, position_y: 80, status: 'AVAILABLE', hourly_rate: 8.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'st-demo-004', organization_id: session.organization_id, name: 'Tabletop Corner', station_type: 'TABLETOP', zone: 'TABLETOP_CORNER', position_x: 100, position_y: 180, status: 'AVAILABLE', hourly_rate: 2.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'st-demo-005', organization_id: session.organization_id, name: 'PC Station 12', station_type: 'PC', zone: 'MAIN', position_x: 220, position_y: 180, status: 'MAINTENANCE', hourly_rate: 5.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();
    let query = supabase.from('stations').select('*').eq('organization_id', session.organization_id).order('zone').order('name');
    if (zone) query = query.eq('zone', zone);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [], source: 'production' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (!['owner', 'admin'].includes(session.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.station_type) return NextResponse.json({ error: 'name and station_type required' }, { status: 400 });

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({
      data: {
        id: `st-demo-${Date.now()}`,
        organization_id: session.organization_id,
        name: body.name,
        station_type: body.station_type,
        zone: body.zone || 'MAIN',
        position_x: body.position_x || 0,
        position_y: body.position_y || 0,
        mac_address: body.mac_address || null,
        ip_address: body.ip_address || null,
        hourly_rate: body.hourly_rate || 5.00,
        status: 'AVAILABLE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('stations').insert({
      organization_id: session.organization_id,
      name: body.name,
      station_type: body.station_type,
      zone: body.zone || 'MAIN',
      position_x: body.position_x || 0,
      position_y: body.position_y || 0,
      mac_address: body.mac_address || null,
      ip_address: body.ip_address || null,
      hourly_rate: body.hourly_rate || 5.00,
      status: 'AVAILABLE',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create station' }, { status: 500 });
  }
}
