import { NextRequest } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomBounties } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// GET /api/bounties — List bounties with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const demoMode = await isDemoModeServer();

  // Demo mode — return filtered phantom data
  if (demoMode) {
    let bounties = [...phantomBounties];
    if (status) {
      bounties = bounties.filter((b) => b.status === status);
    }
    return Response.json({
      data: bounties,
      count: bounties.length,
      source: "demo",
    });
  }

  // Production mode — query Supabase
  try {
    const supabase = await createClient();
    let query = supabase
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[bounties:GET] Supabase error:", error.message);
      return Response.json({ error: "Failed to fetch bounties" }, { status: 500 });
    }

    return Response.json({
      data: data || [],
      count: (data || []).length,
      source: "production",
    });
  } catch (err) {
    console.error("[bounties:GET] Unexpected error:", err);
    return Response.json({ error: "Failed to fetch bounties" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/bounties — Create new bounty
// ============================================================================
export async function POST(request: NextRequest) {
  const demoMode = await isDemoModeServer();

  try {
    const body = await request.json();

    if (!body.target_item_name) {
      return Response.json({ error: "target_item_name is required" }, { status: 400 });
    }

    const basePrice = body.base_market_price || 0;
    const scarcityMult = body.scarcity_mult || 1.0;

    // Demo mode — create phantom bounty
    if (demoMode) {
      const newBounty = {
        id: `bnt-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        target_item_name: body.target_item_name,
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

      return Response.json({ data: newBounty, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bounties")
      .insert({
        target_item_name: body.target_item_name,
        platform: body.platform || null,
        base_market_price: basePrice,
        scarcity_mult: scarcityMult,
        store_credit_value: basePrice * scarcityMult,
        status: "ACTIVE",
        description: body.description || null,
        expires_at: body.expires_at || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[bounties:POST] Supabase error:", error.message);
      return Response.json({ error: "Failed to create bounty" }, { status: 500 });
    }

    return Response.json({ data, source: "production" }, { status: 201 });
  } catch (err) {
    console.error("[bounties:POST] Unexpected error:", err);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
