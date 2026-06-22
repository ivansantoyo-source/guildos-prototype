import { NextRequest } from "next/server";
import { phantomBounties } from "@/mocks/phantomData";

// GET: List bounties (public access for active bounties)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  let bounties = [...phantomBounties];

  if (status) {
    bounties = bounties.filter((b) => b.status === status);
  }

  return Response.json({
    data: bounties,
    count: bounties.length,
  });
}

// POST: Create new bounty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const basePrice = body.base_market_price || 0;
    const scarcityMult = body.scarcity_mult || 1.0;

    const newBounty = {
      id: `bnt-${Date.now()}`,
      organization_id: "demo-time-warp-001",
      target_item_name: body.target_item_name || "Unknown Item",
      platform: body.platform || null,
      base_market_price: basePrice,
      scarcity_mult: scarcityMult,
      store_credit_value: basePrice * scarcityMult,
      status: "ACTIVE" as const,
      fulfilled_by: null,
      fulfilled_at: null,
      expires_at: body.expires_at || null,
      description: body.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return Response.json({ data: newBounty }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Invalid request body", details: String(error) },
      { status: 400 }
    );
  }
}
