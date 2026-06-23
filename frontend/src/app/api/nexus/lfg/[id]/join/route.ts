// ============================================================================
// POST /api/nexus/lfg/[id]/join — Join a lobby
// Creates participant record. If lobby has cost_per_player > 0, creates Stripe
// Checkout session and returns the URL. Validates lobby is OPEN, not full,
// payment_deadline not passed.
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
  // /api/nexus/lfg/[id]/join -> id at index 4
  return segments[4] || null;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10/min per caller
  const rlKey = 'lfg-join-' + (request.headers.get('x-forwarded-for') || 'unknown');
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
    const participant = {
      id: 'part-demo-' + Date.now(),
      lobby_id: lobbyId,
      profile_id: session.id,
      payment_status: 'PENDING',
      amount_paid: 0,
      created_at: new Date().toISOString(),
    };

    const result: Record<string, unknown> = { data: participant, source: 'demo' };

    const costPerPlayer = 40.00;
    if (costPerPlayer > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      result.checkout_url = appUrl + '/?session=cs_demo_' + Date.now();
      result.session_id = 'cs_demo_' + Date.now();
    }

    return NextResponse.json(result, { status: 201 });
  }

  try {
    const supabase = await createClient();

    // Fetch lobby to validate
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
      return NextResponse.json({ error: 'This lobby is no longer open for join' }, { status: 400 });
    }

    // Validate not full
    const slotsTotal = lobby.player_slots_total || 4;
    const slotsFilled = lobby.player_slots_filled || 0;
    if (slotsFilled >= slotsTotal) {
      return NextResponse.json({ error: 'Lobby is full' }, { status: 400 });
    }

    // Check payment deadline
    if (lobby.payment_deadline && new Date(lobby.payment_deadline) < new Date()) {
      return NextResponse.json({ error: 'Payment deadline has passed' }, { status: 400 });
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('nexus_lfg_participants')
      .select('id')
      .eq('lobby_id', lobbyId)
      .eq('profile_id', session.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already joined this lobby' }, { status: 409 });
    }

    // Create participant record
    const { data: participant, error: insertErr } = await supabase
      .from('nexus_lfg_participants')
      .insert({
        lobby_id: lobbyId,
        profile_id: session.id,
        payment_status: lobby.cost_per_player > 0 ? 'PENDING' : 'PAID',
        amount_paid: 0,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Increment filled slots
    await supabase
      .from('nexus_lfgs')
      .update({ player_slots_filled: slotsFilled + 1, updated_at: new Date().toISOString() })
      .eq('id', lobbyId);

    const result: Record<string, unknown> = { data: participant, source: 'production' };

    // If lobby has cost, create Stripe Checkout Session
    const costPerPlayer = lobby.cost_per_player || 0;
    if (costPerPlayer > 0 && participant) {
      const { data: org } = await supabase
        .from('organizations')
        .select('config')
        .eq('id', session.organization_id)
        .single();

      const secretKey = getEffectiveKey(org?.config || null, 'stripe') || process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        const stripe = new Stripe(secretKey);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const checkoutSession = await stripe.checkout.sessions.create({
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { name: 'Lobby: ' + lobby.game_title },
              unit_amount: Math.round(costPerPlayer * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          metadata: {
            lobby_id: lobbyId,
            participant_id: participant.id,
            type: 'lobby_join',
          },
          success_url: appUrl + '/nexus?join=success&lobby=' + lobbyId,
          cancel_url: appUrl + '/nexus?join=cancelled&lobby=' + lobbyId,
        });

        result.checkout_url = checkoutSession.url;
        result.session_id = checkoutSession.id;
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[nexus:lfg:join:POST] Error:', err);
    return NextResponse.json({ error: 'Failed to join lobby' }, { status: 500 });
  }
}
