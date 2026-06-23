import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomInventory } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";
import { withHardening } from "@/lib/auth/server-auth";
import { InventorySchema } from "@/lib/validation/schemas";

type InventoryPayload = z.infer<typeof InventorySchema>;

// ============================================================================
// GET /api/inventory — List inventory with optional filters
// ============================================================================
export const GET = withHardening(async (req, session) => {
  const { searchParams } = req.nextUrl;
  const condition = searchParams.get("condition");
  const platform = searchParams.get("platform");
  const legendary = searchParams.get("legendary");
  const status = searchParams.get("status");
  const search = searchParams.get("q");
  const demoMode = await isDemoModeServer(searchParams);

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

    return NextResponse.json({
      data: items,
      count: items.length,
      totalValue: items.reduce((sum, i) => sum + i.market_value * i.stock_count, 0),
      source: "demo",
    });
  }

  // Production mode — query Supabase scoped to the user's organization
  try {
    const supabase = await createClient();
    const orgId = session.dbUser.organization_id;

    let query = supabase
      .from("inventory")
      .select("*")
      .eq("organization_id", orgId)
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
      // Escape PostgREST LIKE wildcards to prevent query manipulation
      const safe = search.replace(/[%_*]/g, '\\$&');
      query = query.or(
        `item_name.ilike.%${safe}%,platform.ilike.%${safe}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[inventory:GET] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    const items = data || [];
    return NextResponse.json({
      data: items,
      count: items.length,
      totalValue: items.reduce((sum: number, i: { market_value: number; stock_count: number }) => sum + (i.market_value || 0) * (i.stock_count || 0), 0),
      source: "production",
    });
  } catch (err) {
    console.error("[inventory:GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}, {
  rateLimit: { key: 'inventory-list', maxRequests: 60, windowMs: 60_000 },
});

// ============================================================================
// POST /api/inventory — Create new inventory item
// Staff+ role, validated body, rate limited to 30/min
// ============================================================================
export const POST = withHardening(async (req, session) => {
  const demoMode = await isDemoModeServer(req.nextUrl.searchParams);
  // Validated and parsed by withHardening via InventorySchema
  const body = (req as unknown as { validatedData: InventoryPayload }).validatedData;

  // Demo mode — create phantom item
  if (demoMode) {
    const newItem = {
      id: `inv-${Date.now()}`,
      organization_id: session.dbUser.organization_id,
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

    return NextResponse.json({ data: newItem, source: "demo" }, { status: 201 });
  }

  // Production mode — insert into Supabase scoped to the user's organization
  try {
    const supabase = await createClient();
    const orgId = session.dbUser.organization_id;

    const { data, error } = await supabase
      .from("inventory")
      .insert({
        organization_id: orgId,
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
      return NextResponse.json(
        { error: "Failed to create inventory item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, source: "production" }, { status: 201 });
  } catch (err) {
    console.error("[inventory:POST] Unexpected error:", err);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}, {
  schema: InventorySchema,
  roles: ['owner', 'admin', 'staff'],
  rateLimit: { key: 'inventory-create', maxRequests: 30, windowMs: 60_000 },
});
