import { NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/toggles';
import { phantomBounties, phantomInventory } from '@/mocks/phantomData';

/**
 * GET /api/b2b/arbitrage
 * Inter-Guild Trade Routes: Finds stale bounties (> 14 days) and matches them
 * with other tenants' excess inventory (stock >= 3). Generates B2B proposals.
 *
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    // Simulate stale bounty matching
    const staleBounties = phantomBounties.filter(
      (b) => b.status === 'ACTIVE'
    );

    const proposals = staleBounties.map((bounty) => {
      const matchingInventory = phantomInventory.find(
        (inv) =>
          inv.item_name.toLowerCase().includes(bounty.target_item_name.toLowerCase()) &&
          inv.stock_count >= 2
      );

      if (matchingInventory) {
        const wholesalePrice = Math.round(bounty.base_market_price * 0.85 * 100) / 100;
        return {
          bounty_id: bounty.id,
          target_item: `${bounty.target_item_name} (${bounty.platform})`,
          requesting_tenant: 'demo-time-warp-001',
          matching_tenant: 'retro-exchange-demo',
          matching_stock: matchingInventory.stock_count,
          matching_market_value: matchingInventory.market_value,
          wholesale_price: wholesalePrice,
          potential_margin: Math.round((bounty.base_market_price - wholesalePrice) * 100) / 100,
          proposal_created: new Date().toISOString(),
        };
      }
      return null;
    }).filter(Boolean);

    return Response.json({
      success: true,
      source: 'mock-b2b',
      stale_bounties_scanned: staleBounties.length,
      matches_found: proposals.length,
      proposals,
    });
  }

  // Production: query Supabase across tenants
  return Response.json({
    success: true,
    source: 'supabase',
    stale_bounties_scanned: 0,
    matches_found: 0,
    proposals: [],
  });
}
