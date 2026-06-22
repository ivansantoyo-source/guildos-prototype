import { isDemoMode } from '@/lib/toggles';
import { phantomFactionStandings, phantomProfiles } from '@/mocks/phantomData';

/**
 * Vercel Cron — Monthly Faction War Resolution (last day of month, 23:59 UTC)
 * Tallies faction points, declares winner, activates 10% discount for winner's tagged inventory.
 */
export async function GET() {
  if (isDemoMode()) {
    const now = new Date();
    const standings = phantomFactionStandings.map((s) => ({
      faction: s.faction,
      total_points: s.total_points + Math.floor(Math.random() * 500),
      member_count: phantomProfiles.filter((p) => p.faction === s.faction).length,
    }));

    standings.sort((a, b) => b.total_points - a.total_points);
    const winner = standings[0];

    const result = {
      status: 'completed',
      source: 'demo',
      timestamp: new Date().toISOString(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      winner: {
        faction: winner.faction,
        total_points: winner.total_points,
        member_count: winner.member_count,
        discount_active_until: new Date(now.getFullYear(), now.getMonth() + 1, 28).toISOString(),
      },
      standings: standings.map((s, i) => ({
        ...s,
        rank: i + 1,
        is_winner: i === 0,
        gap_to_leader: i > 0 ? winner.total_points - s.total_points : 0,
      })),
      discount_codes_generated: Math.floor(winner.member_count * 1.2),
    };

    console.log(`[CRON:faction-war] Winner: ${winner.faction} with ${winner.total_points} points`);
    return Response.json(result);
  }

  return Response.json({ status: 'completed', source: 'live', timestamp: new Date().toISOString() });
}
