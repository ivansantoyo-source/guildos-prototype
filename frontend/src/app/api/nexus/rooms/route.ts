// ============================================================================
// GET /api/nexus/rooms — List save rooms
// POST /api/nexus/rooms — Create a save room
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const status = searchParams.get('status');
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    const { phantomSaveRooms } = await import('@/mocks/phantomData');
    const rooms = status ? phantomSaveRooms.filter((r: any) => r.status === status) : phantomSaveRooms;
    return NextResponse.json({ data: rooms, source: 'demo' });
  }

  try {
    const supabase = await createClient();
    let query = supabase.from('nexus_save_rooms').select('*').eq('organization_id', session.organization_id).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [], source: 'production' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  if (!['owner', 'admin'].includes(session.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (!body.room_name) return NextResponse.json({ error: 'room_name is required' }, { status: 400 });

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({ data: { id: `room-demo-${Date.now()}`, organization_id: session.organization_id, room_name: body.room_name, description: body.description || '', monthly_rate: body.monthly_rate || 25.00, capacity: body.capacity || 4, amenities: body.amenities || [], status: 'AVAILABLE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, source: 'demo' }, { status: 201 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('nexus_save_rooms').insert({
      organization_id: session.organization_id,
      room_name: body.room_name,
      description: body.description || '',
      monthly_rate: body.monthly_rate || 25.00,
      capacity: body.capacity || 4,
      amenities: body.amenities || [],
      status: 'AVAILABLE',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
