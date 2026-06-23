// ============================================================================
// POST /api/nexus/lfg/[id]/leave — Leave a lobby
// Removes participant record. If participant had paid, initiates refund.
// Updates player_slots_filled count.
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
  return segments[4] || null;
}

export async function POST(request: NextRequest) {
  const rlKey = 'lfg-leave-' + (request.headers.get('x-forwarded-for') || 'unknown');
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
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({
      success: true,
      lobbyId,
      message: 'Left lobby successfully',
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    const { data: participant, error: findErr } = await supabase
      .from('nexus_lfg_participants')
      .select('*')
      .eq('lobby_id', lobbyId)
      .eq('profile_id', session.id)
      .single();

    if (findErr || !participant) {
      return NextResponse.json({ error: 'You are not a participant of this lobby' }, { status: 404 });
    }

    let refunded = false;
    if (participant.payment_status === 'PAID' && participant.payment_intent_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('config')
        .eq('id', session.organization_id)
        .single();

      const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        try {
          const stripe = new Stripe(secretKey);
          await stripe.refunds.create({ payment_intent: participant.payment_intent_id });
          refunded = true;
        } catch (stripeErr) {
          console.error('[nexus:lfg:leave] Stripe refund error:', stripeErr);
        }
      }
    }

    const { error: deleteErr } = await supabase
      .from('nexus_lfg_participants')
      .delete()
      .eq('id', participant.id);

    if (deleteErr) throw deleteErr;

    // Decrement filled slots
    const { data: lobby } = await supabase
      .from('nexus_lfgs')
      .select('player_slots_filled')
      .eq('id', lobbyId)
      .single();

    const currentFilled = (lobby?.player_slots_filled || 1) - 1;
    await supabase
      .from('nexus_lfgs')
      .update({ player_slots_filled: Math.max(0, currentFilled), updated_at: new Date().toISOString() })
      .eq('id', lobbyId);

    return NextResponse.json({
      success: true,
      lobbyId,
      refunded,
      message: 'Left lobby successfully',
      source: 'production',
    });
  } catch (err) {
    console.error('[nexus:lfg:leave:POST] Error:', err);
    return NextResponse.json({ error: 'Failed to leave lobby' }, { status: 500 });
  }
}
