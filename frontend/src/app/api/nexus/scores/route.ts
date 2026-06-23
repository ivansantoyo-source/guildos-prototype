import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomScoreboards } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";
import { withHardening, ValidatedNextRequest } from "@/lib/auth/server-auth";
import { ScoreSchema } from "@/lib/validation/schemas";

// ============================================================================
// GET /api/nexus/scores — Leaderboard entries with optional filters
// ============================================================================
export const GET = withHardening(
  async (request: NextRequest, session) => {
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

      return NextResponse.json({
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
        .eq("organization_id", session.dbUser.organization_id)
        .order("score", { ascending: false });

      if (game) {
        // Escape LIKE wildcards to prevent query manipulation
        const safe = game.replace(/[%_*]/g, '\\$&');
        query = query.ilike("game_title", `%${safe}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[nexus:scores:GET] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
      }

      return NextResponse.json({
        data: data || [],
        count: (data || []).length,
        source: "production",
      });
    } catch (err) {
      console.error("[nexus:scores:GET] Unexpected error:", err);
      return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
    }
  },
  {
    rateLimit: { key: "nexus-scores-get", maxRequests: 60, windowMs: 60_000 },
  }
);

// ============================================================================
// POST /api/nexus/scores — Log new score
// ============================================================================
export const POST = withHardening(
  async (request: NextRequest, session) => {
    const data = (request as ValidatedNextRequest<z.infer<typeof ScoreSchema>>).validatedData;
    const { searchParams } = request.nextUrl;
    const demoMode = await isDemoModeServer(searchParams);

    // Demo mode — create phantom score entry
    if (demoMode) {
      const newScore = {
        id: `scr-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        cabinet_name: data.cabinet_name || "Cabinet A",
        game_title: data.game_title,
        player_tag: data.player_tag,
        player_id: data.player_id || null,
        score: data.score,
        rank: null,
        status: "ACTIVE" as const,
        logged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      return NextResponse.json({ data: newScore, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase
    try {
      const supabase = await createClient();
      const { data: inserted, error } = await supabase
        .from("nexus_scoreboards")
        .insert({
          organization_id: session.dbUser.organization_id,
          cabinet_name: data.cabinet_name || "Cabinet A",
          game_title: data.game_title,
          player_tag: data.player_tag,
          score: data.score,
          status: "ACTIVE",
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("[nexus:scores:POST] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to log score" }, { status: 500 });
      }

      return NextResponse.json({ data: inserted, source: "production" }, { status: 201 });
    } catch (err) {
      console.error("[nexus:scores:POST] Unexpected error:", err);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  },
  {
    schema: ScoreSchema,
    rateLimit: { key: "nexus-scores-post", maxRequests: 30, windowMs: 60_000 },
  }
);
