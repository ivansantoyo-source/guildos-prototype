import { NextRequest, NextResponse } from "next/server";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomLfgs } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";
import { withHardening, ValidatedNextRequest } from "@/lib/auth/server-auth";
import { LfgSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// ============================================================================
// GET /api/nexus/lfg — List LFG lobbies with optional filters
// Rate limit: 60/min (read)
// ============================================================================
export const GET = withHardening(
  async (req: NextRequest, session) => {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const demoMode = await isDemoModeServer(searchParams);

    // Demo mode — return filtered phantom data
    if (demoMode) {
      let lobbies = [...phantomLfgs];
      if (status) {
        lobbies = lobbies.filter((l) => l.lobby_status === status);
      }
      return NextResponse.json({
        data: lobbies,
        count: lobbies.length,
        source: "demo",
      });
    }

    // Production mode — query Supabase scoped to organization
    try {
      const supabase = await createClient();
      let query = supabase
        .from("nexus_lfgs")
        .select("*")
        .eq("organization_id", session.dbUser.organization_id)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("lobby_status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[nexus:lfg:GET] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to fetch lobbies" }, { status: 500 });
      }

      return NextResponse.json({
        data: data || [],
        count: (data || []).length,
        source: "production",
      });
    } catch (err) {
      console.error("[nexus:lfg:GET] Unexpected error:", err);
      return NextResponse.json({ error: "Failed to fetch lobbies" }, { status: 500 });
    }
  },
  {
    rateLimit: { key: "lfg-list", maxRequests: 60, windowMs: 60_000 },
  }
);

// ============================================================================
// POST /api/nexus/lfg — Create new LFG lobby
// Auth: required (authenticated user)
// Validation: LfgSchema
// Rate limit: 30/min (mutation)
// ============================================================================
export const POST = withHardening(
  async (req: NextRequest, session) => {
    const demoMode = await isDemoModeServer(new URL(req.url).searchParams);

    // Demo mode — create phantom lobby
    if (demoMode) {
      // Body still readable — withHardening cloned before schema validation
      const body = await req.json();
      const newLobby = {
        id: `lfg-${Date.now()}`,
        organization_id: session.dbUser.organization_id,
        creator_id: body.creator_id || session.user.id,
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

      return NextResponse.json({ data: newLobby, source: "demo" }, { status: 201 });
    }

    // Production mode — insert into Supabase scoped to organization
    const validatedData = (req as ValidatedNextRequest<z.infer<typeof LfgSchema>>).validatedData;
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from("nexus_lfgs")
        .insert({
          organization_id: session.dbUser.organization_id,
          game_title: validatedData.game_title,
          description: validatedData.description || null,
          console_type: validatedData.console_type || null,
          player_slots_total: validatedData.player_slots_total || 4,
          player_slots_filled: 1,
          max_spectators: validatedData.max_spectators || 0,
          start_time: validatedData.start_time || null,
          lobby_status: "OPEN",
        })
        .select()
        .single();

      if (error) {
        console.error("[nexus:lfg:POST] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to create lobby" }, { status: 500 });
      }

      return NextResponse.json({ data, source: "production" }, { status: 201 });
    } catch (err) {
      console.error("[nexus:lfg:POST] Unexpected error:", err);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  },
  {
    schema: LfgSchema,
    rateLimit: { key: "lfg-create", maxRequests: 30, windowMs: 60_000 },
  }
);
