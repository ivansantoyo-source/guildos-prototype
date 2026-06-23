import { NextRequest, NextResponse } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomBounties } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";
import { withHardening, ValidatedNextRequest } from "@/lib/auth/server-auth";
import { BountySchema } from "@/lib/validation/schemas";

// ============================================================================
// GET /api/bounties — List bounties with optional filters
// ============================================================================
export const GET = withHardening(
  async (req, session) => {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const demoMode = await isDemoModeServer(searchParams);

    // Demo mode — return filtered phantom data
    if (demoMode) {
      let bounties = [...phantomBounties];
      if (status) {
        bounties = bounties.filter((b) => b.status === status);
      }
      return NextResponse.json({
        data: bounties,
        count: bounties.length,
        source: "demo",
      });
    }

    // Production mode — query Supabase with org_id scoping
    try {
      const supabase = await createClient();
      let query = supabase
        .from("bounties")
        .select("*")
        .eq("organization_id", session.dbUser.organization_id)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[bounties:GET] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to fetch bounties" }, { status: 500 });
      }

      return NextResponse.json({
        data: data || [],
        count: (data || []).length,
        source: "production",
      });
    } catch (err) {
      console.error("[bounties:GET] Unexpected error:", err);
      return NextResponse.json({ error: "Failed to fetch bounties" }, { status: 500 });
    }
  },
  {
    rateLimit: { key: "bounties-list", maxRequests: 60, windowMs: 60_000 },
  }
);

// ============================================================================
// POST /api/bounties — Create new bounty (admin/owner only)
// ============================================================================
export const POST = withHardening(
  async (req, session) => {
    const data = (req as ValidatedNextRequest<typeof BountySchema._output>).validatedData;
    const demoMode = await isDemoModeServer(req.nextUrl.searchParams);

    const basePrice = data.base_market_price || 0;
    const scarcityMult = data.scarcity_mult || 1.0;

    // Demo mode — create phantom bounty
    if (demoMode) {
      const newBounty = {
        id: `bnt-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        target_item_name: data.target_item_name,
        platform: data.platform || null,
        base_market_price: basePrice,
        scarcity_mult: scarcityMult,
        store_credit_value: basePrice * scarcityMult,
        status: "ACTIVE" as const,
        fulfilled_by: null,
        fulfilled_at: null,
        expires_at: data.expires_at || null,
        description: data.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({ data: newBounty, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase with org_id
    try {
      const supabase = await createClient();
      const { data: inserted, error } = await supabase
        .from("bounties")
        .insert({
          organization_id: session.dbUser.organization_id,
          target_item_name: data.target_item_name,
          platform: data.platform || null,
          base_market_price: basePrice,
          scarcity_mult: scarcityMult,
          store_credit_value: basePrice * scarcityMult,
          status: "ACTIVE",
          description: data.description || null,
          expires_at: data.expires_at || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[bounties:POST] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 });
      }

      return NextResponse.json({ data: inserted, source: "production" }, { status: 201 });
    } catch (err) {
      console.error("[bounties:POST] Unexpected error:", err);
      return NextResponse.json({ error: "Failed to create bounty" }, { status: 500 });
    }
  },
  {
    roles: ["admin", "owner"],
    schema: BountySchema,
    rateLimit: { key: "bounties-create", maxRequests: 30, windowMs: 60_000 },
  }
);
