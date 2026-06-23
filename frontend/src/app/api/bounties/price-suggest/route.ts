// ============================================================================
// GUILDOS — Bounty Price Suggestion API
// GET /api/bounties/price-suggest?item=...&platform=...
// Returns market price + suggested buy price from PriceCharting
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { withHardening } from "@/lib/auth/server-auth";
import { BountySchema } from "@/lib/validation/schemas";
import { suggestBountyPrice, DEMO_PRICE_SUGGESTIONS } from "@/lib/arbitrage/engine";

// ============================================================================
// GET /api/bounties/price-suggest
// Read-only price lookup — any authenticated user can query.
// Rate limited at 60/min for reads.
// ============================================================================
export const GET = withHardening(
  async (request: NextRequest, session) => {
    const { searchParams } = request.nextUrl;
    const itemName = searchParams.get("item");
    const platform = searchParams.get("platform");

    if (!itemName || !itemName.trim()) {
      return NextResponse.json({ error: "item query parameter is required" }, { status: 400 });
    }

    // Demo mode — return mock price suggestion
    if (session.isDemo) {
      const key = itemName.trim().toLowerCase();
      const mockSuggestion = DEMO_PRICE_SUGGESTIONS[key];

      if (mockSuggestion) {
        return NextResponse.json({ data: mockSuggestion, source: "demo" });
      }

      // Generate a reasonable mock for unknown items
      const genericPrice = Math.round((Math.random() * 200 + 15) * 100) / 100;
      const suggestedBuy = Math.round(genericPrice * 0.6 * 100) / 100;
      const suggestedStoreCredit = Math.round(genericPrice * 0.7 * 100) / 100;

      return NextResponse.json({
        data: {
          marketPrice: genericPrice,
          suggestedBuyPrice: suggestedBuy,
          suggestedStoreCredit,
          spread: {
            spreadPct: 40.00,
            margin: Math.round((genericPrice - suggestedBuy) * 100) / 100,
            profitable: true,
          },
          confidence: 0.70,
          source: "demo",
        },
        source: "demo",
      });
    }

    // Production mode — call PriceCharting and compute suggestion
    try {
      const suggestion = await suggestBountyPrice(itemName.trim(), platform || undefined);
      return NextResponse.json({ data: suggestion, source: "production" });
    } catch (err) {
      console.error("[price-suggest:GET] Error:", err);
      return NextResponse.json({ error: "Failed to get price suggestion" }, { status: 500 });
    }
  },
  {
    rateLimit: { key: "price-suggest-list", maxRequests: 60, windowMs: 60_000 },
  }
);
