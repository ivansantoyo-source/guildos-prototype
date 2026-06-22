import { NextRequest } from "next/server";
import { phantomScoreboards } from "@/mocks/phantomData";

// GET: Leaderboard entries
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const game = searchParams.get("game");

  let scores = [...phantomScoreboards];

  if (game) {
    scores = scores.filter((s) => s.game_title.toLowerCase() === game.toLowerCase());
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return Response.json({
    data: scores,
    count: scores.length,
  });
}

// POST: Log new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newScore = {
      id: `scr-${Date.now()}`,
      organization_id: "demo-time-warp-001",
      cabinet_name: body.cabinet_name || "Cabinet A",
      game_title: body.game_title || "Unknown Game",
      player_tag: body.player_tag || "ANON",
      player_id: body.player_id || null,
      score: body.score || 0,
      rank: null,
      status: "ACTIVE" as const,
      logged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    return Response.json({ data: newScore }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Invalid request body", details: String(error) },
      { status: 400 }
    );
  }
}
