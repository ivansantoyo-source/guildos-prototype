import { NextRequest } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomScoreboards } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// GET /api/nexus/scores — Leaderboard entries with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const game = searchParams.get("game");
  const demoMode = await isDemoModeServer(searchParams);

  // Demo mode — return filtered phantom data
  if (demoMode) {
    let scores = [...phantomScoreboards];
    if (game) {
      scores = scores.filter(
        (s) => s.game_title.toLowerCase() === game.toLowerCase()
      );
    }
    scores.sort((a, b) => b.score - a.score);

    return Response.json({
      data: scores,
      count: scores.length,
      source: "demo",
    });
  }

  // Production mode — query Supabase
  try {
    const supabase = await createClient();
    let query = supabase
      .from("nexus_scoreboards")
      .select("*")
      .order("score", { ascending: false });

    if (game) {
      // Escape LIKE wildcards to prevent query manipulation
      const safe = game.replace(/[%_*]/g, '\\$&');
      query = query.ilike("game_title", `%${safe}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[nexus:scores:GET] Supabase error:", error.message);
      return Response.json({ error: "Failed to fetch scores" }, { status: 500 });
    }

    return Response.json({
      data: data || [],
      count: (data || []).length,
      source: "production",
    });
  } catch (err) {
    console.error("[nexus:scores:GET] Unexpected error:", err);
    return Response.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/nexus/scores — Log new score
// ============================================================================
export async function POST(request: NextRequest) {
  const demoMode = await isDemoModeServer(new URL(request.url).searchParams);

  try {
    const body = await request.json();

    if (!body.game_title || !body.player_tag || body.score == null) {
      return Response.json(
        { error: "game_title, player_tag, and score are required" },
        { status: 400 }
      );
    }

    // Demo mode — create phantom score entry
    if (demoMode) {
      const newScore = {
        id: `scr-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        cabinet_name: body.cabinet_name || "Cabinet A",
        game_title: body.game_title,
        player_tag: body.player_tag,
        player_id: body.player_id || null,
        score: body.score,
        rank: null,
        status: "ACTIVE" as const,
        logged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return Response.json({ data: newScore, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nexus_scoreboards")
      .insert({
        cabinet_name: body.cabinet_name || "Cabinet A",
        game_title: body.game_title,
        player_tag: body.player_tag,
        score: body.score,
        status: "ACTIVE",
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[nexus:scores:POST] Supabase error:", error.message);
      return Response.json({ error: "Failed to log score" }, { status: 500 });
    }

    return Response.json({ data, source: "production" }, { status: 201 });
  } catch (err) {
    console.error("[nexus:scores:POST] Unexpected error:", err);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
