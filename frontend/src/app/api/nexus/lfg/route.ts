import { NextRequest } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomLfgs } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// GET /api/nexus/lfg — List LFG lobbies with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const demoMode = await isDemoModeServer(searchParams);

  // Demo mode — return filtered phantom data
  if (demoMode) {
    let lobbies = [...phantomLfgs];
    if (status) {
      lobbies = lobbies.filter((l) => l.lobby_status === status);
    }
    return Response.json({
      data: lobbies,
      count: lobbies.length,
      source: "demo",
    });
  }

  // Production mode — query Supabase
  try {
    const supabase = await createClient();
    let query = supabase
      .from("nexus_lfgs")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("lobby_status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[nexus:lfg:GET] Supabase error:", error.message);
      return Response.json({ error: "Failed to fetch lobbies" }, { status: 500 });
    }

    return Response.json({
      data: data || [],
      count: (data || []).length,
      source: "production",
    });
  } catch (err) {
    console.error("[nexus:lfg:GET] Unexpected error:", err);
    return Response.json({ error: "Failed to fetch lobbies" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/nexus/lfg — Create new LFG lobby
// ============================================================================
export async function POST(request: NextRequest) {
  const demoMode = await isDemoModeServer(new URL(request.url).searchParams);

  try {
    const body = await request.json();

    if (!body.game_title) {
      return Response.json({ error: "game_title is required" }, { status: 400 });
    }

    // Demo mode — create phantom lobby
    if (demoMode) {
      const newLobby = {
        id: `lfg-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        creator_id: body.creator_id || "unknown",
        game_title: body.game_title,
        description: body.description || null,
        console_type: body.console_type || null,
        player_slots_total: body.player_slots_total || 4,
        player_slots_filled: 1,
        max_spectators: body.max_spectators || 0,
        start_time: body.start_time || null,
        end_time: null,
        lobby_status: "OPEN" as const,
        created_at: new Date().toISOString(),
      };

      return Response.json({ data: newLobby, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nexus_lfgs")
      .insert({
        game_title: body.game_title,
        description: body.description || null,
        console_type: body.console_type || null,
        player_slots_total: body.player_slots_total || 4,
        player_slots_filled: 1,
        max_spectators: body.max_spectators || 0,
        start_time: body.start_time || null,
        lobby_status: "OPEN",
      })
      .select()
      .single();

    if (error) {
      console.error("[nexus:lfg:POST] Supabase error:", error.message);
      return Response.json({ error: "Failed to create lobby" }, { status: 500 });
    }

    return Response.json({ data, source: "production" }, { status: 201 });
  } catch (err) {
    console.error("[nexus:lfg:POST] Unexpected error:", err);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
