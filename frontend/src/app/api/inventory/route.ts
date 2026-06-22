import { NextRequest } from "next/server";
import {
  phantomInventory,
} from "@/mocks/phantomData";

// GET: List inventory with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const condition = searchParams.get("condition");
  const platform = searchParams.get("platform");
  const legendary = searchParams.get("legendary");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  // Demo mode — return phantom data
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
  });
}

// POST: Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newItem = {
      id: `inv-${Date.now()}`,
      organization_id: "demo-time-warp-001",
      item_name: body.item_name || "Unknown Item",
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

    return Response.json({ data: newItem }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Invalid request body", details: String(error) },
      { status: 400 }
    );
  }
}
