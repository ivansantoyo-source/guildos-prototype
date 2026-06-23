import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/toggles';
import { phantomBounties, phantomInventory } from '@/mocks/phantomData';
import { shouldAutoFulfill } from '@/lib/arbitrage/engine';
import { createClient } from '@/lib/supabase/server';
import { fetchMarketPrice, bulkPriceCheck } from '@/lib/integrations/pricecharting';

/**
 * Vercel Cron — Daily Price Sync (04:00 UTC)
 * Checks PriceCharting for current market values, flags items with >= 15% price spike.
 * Also runs auto-fulfillment for LIMIT_BUY bounties whose trigger_price is met.
 *
 * Protected by CRON_SECRET authorization header (set automatically by Vercel Cron).
 */
export async function GET(request?: NextRequest) {
  // Auth: CRON_SECRET header check
  const authHeader = request?.headers?.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    const items = [...phantomInventory];
    const spikes = items.filter(() => Math.random() > 0.7); // Simulate random spikes

    // Simulate auto-fulfillment check on demo limit buys
    const limitBuys = phantomBounties.filter(
      (b) => b.order_type === 'LIMIT_BUY' && b.status === 'ACTIVE' && b.trigger_price
    );
    const autoFulfilled: Array<{ id: string; item: string; marketPrice: number; triggerPrice: number }> = [];

    for (const bounty of limitBuys) {
      const tp = bounty.trigger_price!;
      // Simulate a current market price that fluctuates ±10% from base
      const fluctuation = (Math.random() - 0.5) * 0.2; // ±10%
      const simulatedMarketPrice = Math.round(
        bounty.base_market_price * (1 + fluctuation) * 100
      ) / 100;

      if (shouldAutoFulfill(bounty, simulatedMarketPrice)) {
        autoFulfilled.push({
          id: bounty.id,
          item: bounty.target_item_name,
          marketPrice: simulatedMarketPrice,
          triggerPrice: tp,
        });
        console.log(
          `[CRON:price-sync:auto-fulfill] DEMO — Bounty ${bounty.id} (${bounty.target_item_name}) ` +
          `auto-fulfilled: market $${simulatedMarketPrice.toFixed(2)} ` +
          `<= trigger $${tp.toFixed(2)}`
        );
      }
    }

    const result = {
      status: 'completed',
      source: 'demo',
      timestamp: new Date().toISOString(),
      items_synced: items.length,
      spikes_detected: spikes.length,
      avg_price_change_pct: +(Math.random() * 8 - 3).toFixed(1),
      spike_items: spikes.map((item) => ({
        id: item.id,
        name: item.item_name,
        old_value: +(item.market_value * 0.9).toFixed(2),
        new_value: item.market_value,
        change_pct: +((item.market_value / (item.market_value * 0.9) - 1) * 100).toFixed(1),
      })),
      auto_fulfillment: {
        checked: limitBuys.length,
        fulfilled: autoFulfilled.length,
        items: autoFulfilled,
      },
    };

    console.log(
      `[CRON:price-sync] Demo mode — ${result.items_synced} items checked, ` +
      `${result.spikes_detected} spikes, ` +
      `${result.auto_fulfillment.fulfilled} auto-fulfilled`
    );
    return Response.json(result);
  }

  // Production: query Supabase, call PriceCharting API, update records, auto-fulfill
  try {
    const supabase = await createClient();

    // 1. Sync prices — fetch inventory items needing price updates
    const { data: inventoryItems, error: invErr } = await supabase
      .from('inventory')
      .select('id, item_name, platform, market_value, pricecharting_id')
      .is('last_price_sync', null)
      .or('last_price_sync.lt.' + new Date(Date.now() - 86400000).toISOString());

    if (invErr) throw invErr;

    const items = (inventoryItems || []).map((i: { item_name: string; platform?: string }) => ({
      name: i.item_name,
      platform: i.platform,
    }));

    let spikesDetected = 0;

    if (items.length > 0) {
      const priceMap = await bulkPriceCheck(items);

      for (const invItem of inventoryItems || []) {
        const newPrice = priceMap.get(invItem.item_name);
        if (newPrice == null) continue;

        const oldPrice = invItem.market_value;
        const changePct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        const isSpike = Math.abs(changePct) >= 15;

        await supabase
          .from('inventory')
          .update({
            market_value: newPrice,
            price_spike_flag: isSpike,
            last_price_sync: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', invItem.id);

        if (isSpike) spikesDetected++;
      }
    }

    // 2. Auto-fulfillment: check LIMIT_BUY bounties with trigger_price
    const { data: limitBuys, error: lbErr } = await supabase
      .from('bounties')
      .select('*')
      .eq('order_type', 'LIMIT_BUY')
      .eq('status', 'ACTIVE')
      .not('trigger_price', 'is', null);

    if (lbErr) throw lbErr;

    const autoFulfilled: Array<{ id: string; item: string; marketPrice: number; triggerPrice: number }> = [];

    for (const bounty of limitBuys || []) {
      // Fetch current market price for this item
      const priceData = await fetchMarketPrice(bounty.target_item_name, bounty.platform);
      const currentMarketPrice = priceData.price;

      if (shouldAutoFulfill(bounty, currentMarketPrice)) {
        const tp = bounty.trigger_price ?? currentMarketPrice;
        // Transition bounty to CLAIMED
        const { error: updateErr } = await supabase
          .from('bounties')
          .update({
            fulfillment_status: 'CLAIMED',
            claimed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', bounty.id);

        if (updateErr) {
          console.error(`[CRON:price-sync:auto-fulfill] Failed to update ${bounty.id}:`, updateErr);
          continue;
        }

        autoFulfilled.push({
          id: bounty.id,
          item: bounty.target_item_name,
          marketPrice: currentMarketPrice,
          triggerPrice: tp,
        });

        console.log(
          `[CRON:price-sync:auto-fulfill] Bounty ${bounty.id} (${bounty.target_item_name}) ` +
          `auto-fulfilled: market $${currentMarketPrice.toFixed(2)} ` +
          `<= trigger $${tp.toFixed(2)}`
        );
      }
    }

    return Response.json({
      status: 'completed',
      source: 'live',
      timestamp: new Date().toISOString(),
      items_synced: (inventoryItems || []).length,
      spikes_detected: spikesDetected,
      auto_fulfillment: {
        checked: (limitBuys || []).length,
        fulfilled: autoFulfilled.length,
        items: autoFulfilled,
      },
    });
  } catch (err) {
    console.error('[CRON:price-sync] Production error:', err);
    return Response.json({ status: 'error', error: 'Price sync failed' }, { status: 500 });
  }
}
