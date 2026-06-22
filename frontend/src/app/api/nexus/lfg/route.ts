import { NextRequest } from "next/server";
import { phantomLfgs } from "@/mocks/phantomData";

// GET: List LFG lobbies
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  let lobbies = [...phantomLfgs];

  if (status) {
    lobbies = lobbies.filter((l) => l.lobby_status === status);
  }

  return Response.json({
    data: lobbies,
    count: lobbies.length,
  });
}

// POST: Create new lobby
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newLobby = {
      id: `lfg-${Date.now()}`,
      organization_id: "demo-time-warp-001",
      creator_id: body.creator_id || "unknown",
      game_title: body.game_title || "Unknown Game",
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

    return Response.json({ data: newLobby }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Invalid request body", details: String(error) },
      { status: 400 }
    );
  }
}
