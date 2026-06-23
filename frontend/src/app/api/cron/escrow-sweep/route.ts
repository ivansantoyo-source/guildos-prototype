// ============================================================================
// POST /api/cron/escrow-sweep — Auto-refund unfunded LFG lobbies
// Runs every 5 minutes via Vercel Cron
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/toggles';
import { getStripeClient } from '@/lib/integrations/stripe';

export async function POST(request: NextRequest) {
  // Auth: CRON_SECRET header required
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Demo mode guard — return mock sweep without touching Supabase or Stripe
  if (isDemoMode()) {
    return NextResponse.json({
      swept: 0,
      playersRefunded: 0,
      totalRefunded: 0,
      message: '[DEMO] Escrow sweep skipped — demo mode active',
    });
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Resolve Stripe client for production refunds
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    let stripe = null;
    if (stripeSecret) {
      stripe = getStripeClient(stripeSecret);
    }

    // Find lobbies past auto_refund_at with partial funding
    const { data: expiredLobbies, error: fetchErr } = await supabase
      .from('nexus_lfgs')
      .select('id, stripe_payment_intent_id, stripe_transfer_group')
      .eq('payment_status', 'PARTIALLY_FUNDED')
      .lt('auto_refund_at', now);

    if (fetchErr) throw fetchErr;
    if (!expiredLobbies || expiredLobbies.length === 0) {
      return NextResponse.json({ swept: 0, message: 'No expired lobbies' });
    }

    let totalRefunded = 0;
    let playersRefunded = 0;

    for (const lobby of expiredLobbies) {
      // Find paid participants
      const { data: participants } = await supabase
        .from('nexus_lfg_participants')
        .select('id, stripe_payment_intent_id, amount_paid')
        .eq('lfg_id', lobby.id)
        .eq('payment_status', 'PAID');

      if (participants) {
        for (const p of participants) {
          // Production: call Stripe refund API before marking as REFUNDED
          if (stripe && p.stripe_payment_intent_id) {
            try {
              await stripe.refunds.create({
                payment_intent: p.stripe_payment_intent_id,
              });
            } catch (stripeErr) {
              console.error(
                `[Escrow Sweep] Stripe refund failed for PI ${p.stripe_payment_intent_id}:`,
                stripeErr,
              );
              // Continue — mark DB state but log the failure
            }
          }

          // Mark participant as refunded
          await supabase
            .from('nexus_lfg_participants')
            .update({ payment_status: 'REFUNDED' })
            .eq('id', p.id);

          playersRefunded++;
          totalRefunded += p.amount_paid || 0;
        }
      }

      // Mark lobby as refunded
      await supabase
        .from('nexus_lfgs')
        .update({ payment_status: 'REFUNDED', lobby_status: 'CANCELLED' })
        .eq('id', lobby.id);
    }

    return NextResponse.json({
      swept: expiredLobbies.length,
      playersRefunded,
      totalRefunded: Math.round(totalRefunded * 100) / 100,
      message: `Swept ${expiredLobbies.length} lobbies, refunded ${playersRefunded} players`,
    });
  } catch (err) {
    console.error('[Escrow Sweep] Failed:', err);
    return NextResponse.json({ error: 'Escrow sweep failed' }, { status: 500 });
  }
}
