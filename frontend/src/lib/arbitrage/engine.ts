// ============================================================================
// GUILDOS — Bounty Board Arbitrage Engine
// Market spread analysis, price suggestion, arbitrage opportunity detection
// ============================================================================

import { fetchMarketPrice, type PriceChartingResult } from "@/lib/integrations/pricecharting";
import type { Bounty, ArbitrageMatch } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

export interface SpreadResult {
  spreadPct: number;
  margin: number;
  profitable: boolean;
}

export interface PriceSuggestion {
  marketPrice: number;
  suggestedBuyPrice: number;
  suggestedStoreCredit: number;
  spread: SpreadResult;
  confidence: number;
  source: string;
}

export interface ArbitrageOpportunity {
  bounty: Bounty;
  marketPrice: number;
  spread: SpreadResult;
  matchConfidence: number;
  suggestion: {
    buyPrice: number;
    sellPrice: number;
    potentialProfit: number;
  };
}

// ============================================================================
// 1. calculateSpread — Compute spread percentage and margin between two prices
// ============================================================================

export function calculateSpread(marketPrice: number, buyPrice: number): SpreadResult {
  if (marketPrice <= 0 || buyPrice <= 0) {
    return { spreadPct: 0, margin: 0, profitable: false };
  }

  const spreadPct = ((marketPrice - buyPrice) / marketPrice) * 100;
  const margin = marketPrice - buyPrice;

  return {
    spreadPct: Math.round(spreadPct * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    profitable: spreadPct > 0,
  };
}

// ============================================================================
// 2. suggestBountyPrice — Given an item name, fetch market price and suggest
//    a buy price at 60% of market (40% margin for the merchant), then compute
//    store credit at 70% of market (slightly above buy price to incentivize).
// ============================================================================

export async function suggestBountyPrice(
  itemName: string,
  platform?: string
): Promise<PriceSuggestion> {
  const priceData: PriceChartingResult = await fetchMarketPrice(itemName, platform);

  const marketPrice = priceData.price;

  // Merchant pays 60% of market price (40% margin)
  const suggestedBuyPrice = Math.round(marketPrice * 0.6 * 100) / 100;

  // Store credit offered at 70% of market (10% above buy price to incentivize hunters)
  const suggestedStoreCredit = Math.round(marketPrice * 0.7 * 100) / 100;

  const spread = calculateSpread(marketPrice, suggestedBuyPrice);

  // Confidence based on data source and price reasonableness
  const confidence = priceData.source === "pricecharting"
    ? Math.min(0.95, marketPrice > 1000 ? 0.85 : 0.90)
    : Math.min(0.75, marketPrice > 1000 ? 0.60 : 0.70);

  return {
    marketPrice,
    suggestedBuyPrice,
    suggestedStoreCredit,
    spread,
    confidence: Math.round(confidence * 100) / 100,
    source: priceData.source,
  };
}

// ============================================================================
// 3. findArbitrageOpportunities — Scan limit buys vs available inventory
//    across the org to find profitable spread opportunities.
// ============================================================================

export function findArbitrageOpportunities(
  orgId: string,
  bounties: Bounty[],
  marketPrices: Map<string, number>
): ArbitrageOpportunity[] {
  // Only consider LIMIT_BUY bounties (they represent what someone wants to buy)
  const limitBuys = bounties.filter(
    (b) => b.order_type === "LIMIT_BUY" && b.status === "ACTIVE"
  );

  if (limitBuys.length === 0) return [];

  const opportunities: ArbitrageOpportunity[] = [];

  for (const bounty of limitBuys) {
    const marketPrice = marketPrices.get(bounty.target_item_name.toLowerCase());

    if (!marketPrice || marketPrice <= 0) continue;

    // Use trigger_price as the buy price if set, otherwise use base_market_price
    const buyPrice = bounty.trigger_price ?? bounty.base_market_price;

    const spread = calculateSpread(marketPrice, buyPrice);

    // Only include if profitable (market > buy) with at least 5% spread
    if (!spread.profitable || spread.spreadPct < 5) continue;

    const matchConfidence = spread.spreadPct > 20 ? 0.9
      : spread.spreadPct > 10 ? 0.75
      : 0.6;

    opportunities.push({
      bounty,
      marketPrice,
      spread,
      matchConfidence: Math.round(matchConfidence * 100) / 100,
      suggestion: {
        buyPrice,
        sellPrice: marketPrice,
        potentialProfit: spread.margin,
      },
    });
  }

  // Sort by spread descending (most profitable first)
  return opportunities.sort((a, b) => b.spread.spreadPct - a.spread.spreadPct);
}

// ============================================================================
// 4. shouldAutoFulfill — Check if a bounty's trigger price threshold is met
//    by a given market price. Returns true if auto-fulfillment should fire.
// ============================================================================

export function shouldAutoFulfill(bounty: Bounty, marketPrice: number): boolean {
  // Only auto-fulfill LIMIT_BUY bounties with a trigger_price set
  if (bounty.order_type !== "LIMIT_BUY" || !bounty.trigger_price) {
    return false;
  }

  // Auto-fulfill if market price drops to or below the trigger_price
  // This means the merchant can buy at or below their target price
  return marketPrice <= bounty.trigger_price;
}

// ============================================================================
// 5. Demo mode helpers — Returns mock data for development
// ============================================================================

export const DEMO_PRICE_SUGGESTIONS: Record<string, PriceSuggestion> = {
  "earthbound": {
    marketPrice: 350.00,
    suggestedBuyPrice: 210.00,
    suggestedStoreCredit: 245.00,
    spread: { spreadPct: 40.00, margin: 140.00, profitable: true },
    confidence: 0.85,
    source: "mock",
  },
  "chrono trigger": {
    marketPrice: 185.00,
    suggestedBuyPrice: 111.00,
    suggestedStoreCredit: 129.50,
    spread: { spreadPct: 40.00, margin: 74.00, profitable: true },
    confidence: 0.85,
    source: "mock",
  },
  "mega man x3": {
    marketPrice: 250.00,
    suggestedBuyPrice: 150.00,
    suggestedStoreCredit: 175.00,
    spread: { spreadPct: 40.00, margin: 100.00, profitable: true },
    confidence: 0.75,
    source: "mock",
  },
  "stadium events": {
    marketPrice: 15000.00,
    suggestedBuyPrice: 9000.00,
    suggestedStoreCredit: 10500.00,
    spread: { spreadPct: 40.00, margin: 6000.00, profitable: true },
    confidence: 0.60,
    source: "mock",
  },
  "panzer dragoon saga": {
    marketPrice: 850.00,
    suggestedBuyPrice: 510.00,
    suggestedStoreCredit: 595.00,
    spread: { spreadPct: 40.00, margin: 340.00, profitable: true },
    confidence: 0.70,
    source: "mock",
  },
  "suikoden ii": {
    marketPrice: 180.00,
    suggestedBuyPrice: 108.00,
    suggestedStoreCredit: 126.00,
    spread: { spreadPct: 40.00, margin: 72.00, profitable: true },
    confidence: 0.85,
    source: "mock",
  },
  "sonic the hedgehog 2": {
    marketPrice: 25.00,
    suggestedBuyPrice: 15.00,
    suggestedStoreCredit: 17.50,
    spread: { spreadPct: 40.00, margin: 10.00, profitable: true },
    confidence: 0.90,
    source: "mock",
  },
};
