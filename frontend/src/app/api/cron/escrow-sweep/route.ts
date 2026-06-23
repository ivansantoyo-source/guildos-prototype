// ============================================================================
// POST /api/cron/escrow-sweep — Auto-refund unfunded LFG lobbies
// Runs every 5 minutes via Vercel Cron
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Auth: CRON_SECRET header required
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

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
          // In production: call Stripe refund API
          // await stripe.refunds.create({ payment_intent: p.stripe_payment_intent_id });

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
