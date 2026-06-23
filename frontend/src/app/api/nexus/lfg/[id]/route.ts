// ============================================================================
// PATCH /api/nexus/lfg/[id] — Update lobby fields (admin/host only)
// DELETE /api/nexus/lfg/[id] — Cancel lobby (admin/host only, refunds all)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveKey } from '@/lib/types/tenant-keys';
import Stripe from 'stripe';

function extractLobbyId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  // /api/nexus/lfg/[id] -> id is at index 4
  return segments[4] || null;
}

// ============================================================================
// PATCH — Update lobby fields
// ============================================================================
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const lobbyId = extractLobbyId(request);
  if (!lobbyId) {
    return NextResponse.json({ error: 'Lobby ID is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      data: { id: lobbyId, ...body, updated_at: new Date().toISOString() },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby to verify host/admin permissions
    const { data: lobby, error: fetchError } = await supabase
      .from('nexus_lfgs')
      .select('*')
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .single();

    if (fetchError || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Only host or admin/owner can update
    const isHost = lobby.creator_id === session.id;
    const isAdmin = ['owner', 'admin'].includes(session.role);
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the host or an admin can update this lobby' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const allowedFields = [
      'game_title', 'description', 'console_type', 'player_slots_total',
      'max_spectators', 'start_time', 'lobby_status', 'total_cost',
      'cost_per_player', 'payment_deadline', 'auto_refund',
    ];

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('nexus_lfgs')
      .update(updateFields)
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' });
  } catch (err) {
    console.error('[nexus:lfg:PATCH] Error:', err);
    return NextResponse.json({ error: 'Failed to update lobby' }, { status: 500 });
  }
}

// ============================================================================
// DELETE — Cancel lobby (refund all participants)
// ============================================================================
export async function DELETE(request: NextRequest) {
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
      data: { id: lobbyId, lobby_status: 'CANCELLED', refunded: true },
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby
    const { data: lobby, error: fetchError } = await supabase
      .from('nexus_lfgs')
      .select('*')
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .single();

    if (fetchError || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Only host or admin/owner can cancel
    const isHost = lobby.creator_id === session.id;
    const isAdmin = ['owner', 'admin'].includes(session.role);
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the host or an admin can cancel this lobby' }, { status: 403 });
    }

    // Fetch paid participants to refund
    const { data: participants } = await supabase
      .from('nexus_lfg_participants')
      .select('*')
      .eq('lobby_id', lobbyId)
      .not('payment_intent_id', 'is', null);

    // Refund all paid participants
    if (participants && participants.length > 0) {
      const { data: org } = await supabase
        .from('organizations')
        .select('config')
        .eq('id', session.organization_id)
        .single();

      const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        const stripe = new Stripe(secretKey);
        for (const participant of participants) {
          if (participant.payment_intent_id) {
            try {
              await stripe.refunds.create({ payment_intent: participant.payment_intent_id });
            } catch (refundErr) {
              console.error('[nexus:lfg:DELETE] Refund error:', refundErr);
            }
          }
        }
      }

      // Mark all as refunded
      await supabase
        .from('nexus_lfg_participants')
        .update({ payment_status: 'REFUNDED', updated_at: new Date().toISOString() })
        .eq('lobby_id', lobbyId);
    }

    // Cancel lobby
    const { data, error } = await supabase
      .from('nexus_lfgs')
      .update({
        lobby_status: 'CANCELLED',
        player_slots_filled: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, source: 'production' });
  } catch (err) {
    console.error('[nexus:lfg:DELETE] Error:', err);
    return NextResponse.json({ error: 'Failed to cancel lobby' }, { status: 500 });
  }
}
