import { NextRequest } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomInventory } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// GET /api/inventory — List inventory with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const condition = searchParams.get("condition");
  const platform = searchParams.get("platform");
  const legendary = searchParams.get("legendary");
  const status = searchParams.get("status");
  const search = searchParams.get("q");
  const demoMode = await isDemoModeServer();

  // Demo mode — return phantom data with filters applied
  if (demoMode) {
    let items = [...phantomInventory];

    if (condition && condition !== "ALL") {
      items = items.filter((i) => i.condition === condition);
    }
    if (platform && platform !== "ALL") {
      items = items.filter((i) => i.platform === platform);
    }
    if (legendary === "true") {
      items = items.filter((i) => i.is_legendary);
    }
    if (status) {
      items = items.filter((i) => i.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.platform?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return Response.json({
      data: items,
      count: items.length,
      totalValue: items.reduce((sum, i) => sum + i.market_value * i.stock_count, 0),
      source: "demo",
    });
  }

  // Production mode — query Supabase
  try {
    const supabase = await createClient();

    let query = supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (condition && condition !== "ALL") {
      query = query.eq("condition", condition);
    }
    if (platform && platform !== "ALL") {
      query = query.eq("platform", platform);
    }
    if (legendary === "true") {
      query = query.eq("is_legendary", true);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.or(
        `item_name.ilike.%${search}%,platform.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[inventory:GET] Supabase error:", error.message);
      return Response.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    const items = data || [];
    return Response.json({
      data: items,
      count: items.length,
      totalValue: items.reduce((sum: number, i: { market_value: number; stock_count: number }) => sum + (i.market_value || 0) * (i.stock_count || 0), 0),
      source: "production",
    });
  } catch (err) {
    console.error("[inventory:GET] Unexpected error:", err);
    return Response.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory — Create new inventory item
// ============================================================================
export async function POST(request: NextRequest) {
  const demoMode = await isDemoModeServer();

  try {
    const body = await request.json();

    // Basic validation
    if (!body.item_name) {
      return Response.json(
        { error: "item_name is required" },
        { status: 400 }
      );
    }

    // Demo mode — create phantom item
    if (demoMode) {
      const newItem = {
        id: `inv-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        item_name: body.item_name,
        platform: body.platform || null,
        condition: body.condition || "LOOSE",
        market_value: body.market_value || 0,
        our_price: body.our_price || null,
        scrap_value: body.scrap_value || 0,
        stock_count: body.stock_count || 1,
        is_legendary: (body.market_value || 0) >= 150,
        price_spike_flag: false,
        tags: body.tags || [],
        image_url: body.image_url || null,
        scanned_image_url: null,
        pricecharting_id: null,
        last_price_sync: null,
        status: "ACTIVE" as const,
        notes: body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return Response.json({ data: newItem, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory")
      .insert({
        item_name: body.item_name,
        platform: body.platform || null,
        condition: body.condition || "LOOSE",
        market_value: body.market_value || 0,
        our_price: body.our_price || null,
        scrap_value: body.scrap_value || 0,
        stock_count: body.stock_count || 1,
        tags: body.tags || [],
        status: "ACTIVE",
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[inventory:POST] Supabase error:", error.message);
      return Response.json(
        { error: "Failed to create inventory item" },
        { status: 500 }
      );
    }

    return Response.json({ data, source: "production" }, { status: 201 });
  } catch (err) {
    console.error("[inventory:POST] Unexpected error:", err);
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
