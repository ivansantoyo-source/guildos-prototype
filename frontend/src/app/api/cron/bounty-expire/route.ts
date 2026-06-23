// ============================================================================
// POST /api/cron/bounty-expire — Expire stale bounties
// Runs daily via Vercel Cron
// Finds bounties past their expires_at date, sets status to EXPIRED,
// and releases any CLAIMED bounties that weren't fulfilled in time.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/toggles';
import { phantomBounties } from '@/mocks/phantomData';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Auth: CRON_SECRET header required
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    const now = new Date();
    let expired = 0;
    let released = 0;
    const expiredItems: Array<{ id: string; item: string; status: string; wasClaimed: boolean }> = [];

    for (let i = 0; i < phantomBounties.length; i++) {
      const bounty = phantomBounties[i];

      // Skip non-active bounties
      if (bounty.status !== 'ACTIVE') continue;

      // Skip bounties without expiration
      if (!bounty.expires_at) continue;

      const expiresAt = new Date(bounty.expires_at);
      if (expiresAt >= now) continue;

      // Bounty is expired
      const wasClaimed = bounty.fulfillment_status === 'CLAIMED';

      phantomBounties[i] = {
        ...bounty,
        status: 'EXPIRED' as const,
        updated_at: now.toISOString(),
      };

      // If it was CLAIMED, release the claim
      if (wasClaimed) {
        phantomBounties[i] = {
          ...phantomBounties[i],
          fulfillment_status: 'OPEN',
          claimed_by: undefined,
          fulfilled_by_profile: undefined,
          claimed_at: undefined,
        };
        released++;
      }

      expired++;
      expiredItems.push({
        id: bounty.id,
        item: bounty.target_item_name,
        status: wasClaimed ? 'released' : 'expired',
        wasClaimed,
      });

      console.log(
        `[CRON:bounty-expire] DEMO — ${wasClaimed ? 'Released claim on' : 'Expired'} ` +
        `bounty ${bounty.id} (${bounty.target_item_name})`
      );
    }

    return NextResponse.json({
      expired,
      released,
      items: expiredItems,
      message: `Expired ${expired} bounties, released ${released} claims`,
    });
  }

  // Production mode
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // 1. Expire ACTIVE bounties past their expires_at
    const { data: expiredBounties, error: fetchErr } = await supabase
      .from('bounties')
      .select('id, target_item_name, fulfillment_status')
      .eq('status', 'ACTIVE')
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (fetchErr) throw fetchErr;

    if (!expiredBounties || expiredBounties.length === 0) {
      return NextResponse.json({ expired: 0, released: 0, message: 'No expired bounties' });
    }

    let expired = 0;
    let released = 0;
    const expiredItems: Array<{ id: string; item: string; status: string }> = [];

    for (const bounty of expiredBounties) {
      const b = bounty as { id: string; target_item_name: string; fulfillment_status?: string };
      const wasClaimed = b.fulfillment_status === 'CLAIMED';

      // Update status to EXPIRED
      const updateFields: Record<string, unknown> = {
        status: 'EXPIRED',
        updated_at: now,
      };

      // If it was CLAIMED, release the claim
      if (wasClaimed) {
        updateFields.fulfillment_status = 'OPEN';
        updateFields.claimed_by = null;
        updateFields.fulfilled_by_profile = null;
        updateFields.claimed_at = null;
      }

      const { error: updateErr } = await supabase
        .from('bounties')
        .update(updateFields)
        .eq('id', b.id);

      if (updateErr) {
        console.error(`[CRON:bounty-expire] Failed to expire ${b.id}:`, updateErr);
        continue;
      }

      expired++;
      if (wasClaimed) released++;

      expiredItems.push({
        id: b.id,
        item: b.target_item_name,
        status: wasClaimed ? 'released' : 'expired',
      });

      console.log(
        `[CRON:bounty-expire] ${wasClaimed ? 'Released claim on' : 'Expired'} ` +
        `bounty ${b.id} (${b.target_item_name})`
      );
    }

    return NextResponse.json({
      expired,
      released,
      items: expiredItems,
      message: `Expired ${expired} bounties, released ${released} claims`,
    });
  } catch (err) {
    console.error('[CRON:bounty-expire] Failed:', err);
    return NextResponse.json({ error: 'Bounty expiration failed' }, { status: 500 });
  }
}
