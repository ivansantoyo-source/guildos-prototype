// ============================================================================
// POST /api/nexus/lfg/[id]/refund — Trigger refund for a lobby
// Host only or admin. Calls Stripe refund API.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveKey } from '@/lib/types/tenant-keys';
import { rateLimit } from '@/lib/security/rate-limit';
import Stripe from 'stripe';

function extractLobbyId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  // /api/nexus/lfg/[id]/refund -> id at index 4
  return segments[4] || null;
}

export async function POST(request: NextRequest) {
  const rlKey = `lfg-refund-${request.headers.get('x-forwarded-for') || 'unknown'}`;
  if (await rateLimit(rlKey, { maxRequests: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests', retryAfterMs: 60_000 }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const lobbyId = extractLobbyId(request);
  if (!lobbyId) {
    return NextResponse.json({ error: 'Lobby ID is required' }, { status: 400 });
  }

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      lobbyId,
      totalRefunded: 120.00,
      playersRefunded: 3,
      success: true,
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby + verify permissions
    const { data: lobby, error: lobbyErr } = await supabase
      .from('nexus_lfgs')
      .select('*')
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .single();

    if (lobbyErr || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    const isHost = lobby.creator_id === session.id;
    const isAdmin = ['owner', 'admin'].includes(session.role);
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the host or an admin can trigger refunds' }, { status: 403 });
    }

    // Fetch paid participants
    const { data: participants } = await supabase
      .from('nexus_lfg_participants')
      .select('*')
      .eq('lobby_id', lobbyId)
      .eq('payment_status', 'PAID');

    if (!participants || participants.length === 0) {
      return NextResponse.json({ error: 'No paid participants to refund' }, { status: 400 });
    }

    // Resolve Stripe key and process refunds
    const { data: org } = await supabase
      .from('organizations')
      .select('config')
      .eq('id', session.organization_id)
      .single();

    const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
    let totalRefunded = 0;
    let playersRefunded = 0;

    if (secretKey) {
      const stripe = new Stripe(secretKey);
      for (const participant of participants) {
        if (participant.payment_intent_id) {
          try {
            await stripe.refunds.create({ payment_intent: participant.payment_intent_id });
            totalRefunded += participant.amount_paid || 0;
            playersRefunded++;
          } catch (stripeErr) {
            console.error('[nexus:lfg:refund] Stripe refund error:', stripeErr);
          }
        }
      }
    }

    // Update participant payment_status to REFUNDED
    await supabase
      .from('nexus_lfg_participants')
      .update({ payment_status: 'REFUNDED', updated_at: new Date().toISOString() })
      .eq('lobby_id', lobbyId)
      .in('payment_status', ['PAID', 'PENDING']);

    // Update lobby
    await supabase
      .from('nexus_lfgs')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id);

    return NextResponse.json({
      lobbyId,
      totalRefunded,
      playersRefunded,
      success: playersRefunded > 0,
      source: 'production',
    });
  } catch (err) {
    console.error('[nexus:lfg:refund:POST] Error:', err);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
