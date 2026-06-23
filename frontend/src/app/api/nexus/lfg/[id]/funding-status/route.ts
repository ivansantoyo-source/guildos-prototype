// ============================================================================
// GET /api/nexus/lfg/[id]/funding-status — Get lobby funding progress
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

function extractLobbyId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  // /api/nexus/lfg/[id]/funding-status -> id at index 4
  return segments[4] || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const lobbyId = extractLobbyId(request);
  if (!lobbyId) {
    return NextResponse.json({ error: 'Lobby ID is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({
      lobbyId,
      totalCost: 160.00,
      costPerPlayer: 40.00,
      playersNeeded: 4,
      playersPaid: 3,
      amountFunded: 120.00,
      isFullyFunded: false,
      paymentDeadline: new Date(Date.now() + 3600000).toISOString(),
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby
    const { data: lobby, error: lobbyErr } = await supabase
      .from('nexus_lfgs')
      .select('total_cost, cost_per_player, player_slots_total, payment_deadline')
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .single();

    if (lobbyErr || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Count paid participants
    const { data: participants } = await supabase
      .from('nexus_lfg_participants')
      .select('id, payment_status')
      .eq('lobby_id', lobbyId);

    const totalPlayers = lobby.player_slots_total || 4;
    const paidParticipants = (participants || []).filter((p) => p.payment_status === 'PAID');
    const playersPaid = paidParticipants.length;
    const costPerPlayer = lobby.cost_per_player || 0;
    const amountFunded = playersPaid * costPerPlayer;

    return NextResponse.json({
      lobbyId,
      totalCost: lobby.total_cost || totalPlayers * costPerPlayer,
      costPerPlayer,
      playersNeeded: totalPlayers,
      playersPaid,
      amountFunded,
      isFullyFunded: playersPaid >= totalPlayers,
      paymentDeadline: lobby.payment_deadline || null,
      source: 'production',
    });
  } catch (err) {
    console.error('[nexus:lfg:funding-status:GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch funding status' }, { status: 500 });
  }
}
