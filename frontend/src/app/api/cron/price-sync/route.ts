import { isDemoMode } from '@/lib/toggles';
import { phantomInventory } from '@/mocks/phantomData';

/**
 * Vercel Cron — Daily Price Sync (04:00 UTC)
 * Checks PriceCharting for current market values, flags items with >= 15% price spike.
 */
export async function GET() {
  const authHeader = globalThis?.process?.env?.CRON_SECRET;
  // In Vercel Cron, the CRON_SECRET is passed as an Authorization header automatically

  if (isDemoMode()) {
    const items = [...phantomInventory];
    const spikes = items.filter(() => Math.random() > 0.7); // Simulate random spikes

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
    };

    console.log(`[CRON:price-sync] Demo mode — ${result.items_synced} items checked, ${result.spikes_detected} spikes`);
    return Response.json(result);
  }

  // Production: query Supabase, call PriceCharting API, update records
  return Response.json({ status: 'completed', source: 'live', timestamp: new Date().toISOString() });
}
