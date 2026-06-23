import { NextRequest, NextResponse } from 'next/server';
import { phantomBounties, phantomInventory } from '@/mocks/phantomData';
import { createClient } from '@/lib/supabase/server';
import { withHardening } from '@/lib/auth/server-auth';
import { findArbitrageOpportunities } from '@/lib/arbitrage/engine';
import { bulkPriceCheck } from '@/lib/integrations/pricecharting';

/**
 * GET /api/b2b/arbitrage
 * Inter-Guild Trade Routes: Finds arbitrage opportunities by analyzing limit buy
 * bounties against current market prices using the Bounty Arbitrage Engine.
 *
 * Protected by CRON_SECRET header + session auth.
 * Rate limited: 60/min for reads.
 */
export const GET = withHardening(
  async (req: NextRequest, session) => {
    // Primary auth: CRON_SECRET authorization for production cron jobs
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.isDemo) {
      // === Demo Mode: Phantom data arbitrage analysis ===
      const staleBounties = phantomBounties.filter(
        (b) => b.status === 'ACTIVE'
      );

      // Build market price map from phantom inventory
      const marketPrices = new Map<string, number>();
      phantomInventory.forEach((inv) => {
        marketPrices.set(inv.item_name.toLowerCase(), inv.market_value);
      });

      // Run the arbitrage engine on phantom limit buys
      const engineOpportunities = findArbitrageOpportunities(
        session.organization_id,
        staleBounties,
        marketPrices
      );

      // Cross-org matching (existing mock logic kept for B2B proposals)
      const crossOrgProposals = staleBounties.map((bounty) => {
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
            requesting_tenant: session.organization_id,
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

      // Map engine opportunities to B2B proposal format
      const engineProposals = engineOpportunities.map((opp) => ({
        bounty_id: opp.bounty.id,
        target_item: `${opp.bounty.target_item_name} (${opp.bounty.platform || 'Any'})`,
        requesting_tenant: session.organization_id,
        matching_tenant: 'market',
        matching_stock: 1,
        matching_market_value: opp.marketPrice,
        wholesale_price: opp.suggestion.buyPrice,
        potential_margin: opp.suggestion.potentialProfit,
        spread_pct: opp.spread.spreadPct,
        match_confidence: opp.matchConfidence,
        proposal_created: new Date().toISOString(),
        source: 'arbitrage_engine',
      }));

      return NextResponse.json({
        success: true,
        source: 'demo',
        stale_bounties_scanned: staleBounties.length,
        matches_found: crossOrgProposals.length + engineProposals.length,
        cross_org_proposals: crossOrgProposals,
        engine_opportunities: engineProposals,
      });
    }

    // === Production Mode: Real arbitrage analysis ===
    try {
      const supabase = await createClient();
      const orgId = session.organization_id;

      // 1. Fetch active bounties for this org
      const { data: bounties, error: bountyErr } = await supabase
        .from('bounties')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (bountyErr) throw bountyErr;

      // 2. Build item name list for price lookup
      const items = (bounties || []).map((b: { target_item_name: string; platform?: string }) => ({
        name: b.target_item_name,
        platform: b.platform,
      }));

      // 3. Fetch current market prices via PriceCharting bulk check
      const marketPrices = items.length > 0
        ? await bulkPriceCheck(items)
        : new Map<string, number>();

      // 4. Run the arbitrage engine
      const opportunities = findArbitrageOpportunities(
        orgId,
        bounties || [],
        marketPrices
      );

      // 5. Map to B2B proposal format
      const proposals = opportunities.map((opp) => ({
        bounty_id: opp.bounty.id,
        target_item: `${opp.bounty.target_item_name} (${opp.bounty.platform || 'Any'})`,
        requesting_tenant: orgId,
        matching_tenant: 'market',
        matching_stock: 1,
        matching_market_value: opp.marketPrice,
        wholesale_price: opp.suggestion.buyPrice,
        potential_margin: opp.suggestion.potentialProfit,
        spread_pct: opp.spread.spreadPct,
        match_confidence: opp.matchConfidence,
        proposal_created: new Date().toISOString(),
        source: 'arbitrage_engine',
      }));

      return NextResponse.json({
        success: true,
        source: 'supabase',
        stale_bounties_scanned: (bounties || []).length,
        matches_found: opportunities.length,
        proposals,
      });
    } catch (err) {
      console.error('[b2b-arbitrage:GET] Error:', err);
      return NextResponse.json({ error: 'Failed to scan arbitrage opportunities' }, { status: 500 });
    }
  },
  {
    rateLimit: { key: 'b2b-arbitrage', maxRequests: 60, windowMs: 60_000 },
  }
);
