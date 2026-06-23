// ============================================================================
// POST /api/nexus/lfg/[id]/pay — Pay share for a lobby
// Creates a Stripe Checkout session for cost_per_player amount.
// Validates lobby payment_deadline hasn't passed, participant isn't already
// paid, lobby isn't full.
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
  // /api/nexus/lfg/[id]/pay -> id at index 4
  return segments[4] || null;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10/min per caller
  const rlKey = `lfg-pay-${request.headers.get('x-forwarded-for') || 'unknown'}`;
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
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/nexus?session=cs_demo_${Date.now()}`,
      sessionId: `cs_demo_${Date.now()}`,
      source: 'demo',
    });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby
    const { data: lobby, error: lobbyErr } = await supabase
      .from('nexus_lfgs')
      .select('*')
      .eq('id', lobbyId)
      .eq('organization_id', session.organization_id)
      .single();

    if (lobbyErr || !lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Validate lobby is OPEN
    if (lobby.lobby_status !== 'OPEN') {
      return NextResponse.json({ error: 'This lobby is no longer open' }, { status: 400 });
    }

    // Check payment deadline
    if (lobby.payment_deadline && new Date(lobby.payment_deadline) < new Date()) {
      return NextResponse.json({ error: 'Payment deadline has passed' }, { status: 400 });
    }

    // Validate not full
    const slotsTotal = lobby.player_slots_total || 4;
    const slotsFilled = lobby.player_slots_filled || 0;
    if (slotsFilled >= slotsTotal) {
      return NextResponse.json({ error: 'Lobby is full' }, { status: 400 });
    }

    // Check cost_per_player is set
    const costPerPlayer = lobby.cost_per_player || 0;
    if (costPerPlayer <= 0) {
      return NextResponse.json({ error: 'This lobby has no cost per player' }, { status: 400 });
    }

    // Find participant
    const { data: participant, error: partErr } = await supabase
      .from('nexus_lfg_participants')
      .select('*')
      .eq('lobby_id', lobbyId)
      .eq('profile_id', session.id)
      .single();

    if (partErr || !participant) {
      return NextResponse.json({ error: 'You must join the lobby before paying' }, { status: 400 });
    }

    // Check not already paid
    if (participant.payment_status === 'PAID') {
      return NextResponse.json({ error: 'You have already paid for this lobby' }, { status: 409 });
    }

    // Resolve Stripe key and create Checkout Session
    const { data: org } = await supabase
      .from('organizations')
      .select('config')
      .eq('id', session.organization_id)
      .single();

    const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Lobby: ${lobby.game_title} — Share` },
          unit_amount: Math.round(costPerPlayer * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: {
        lobby_id: lobbyId,
        participant_id: participant.id,
        type: 'lobby_pay',
      },
      success_url: `${appUrl}/nexus?pay=success&lobby=${lobbyId}`,
      cancel_url: `${appUrl}/nexus?pay=cancelled&lobby=${lobbyId}`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      source: 'production',
    });
  } catch (err) {
    console.error('[nexus:lfg:pay:POST] Error:', err);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
