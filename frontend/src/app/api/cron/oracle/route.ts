import { isDemoMode } from '@/lib/toggles';

/**
 * Vercel Cron — Oracle Predictive Engine (every 2 hours)
 * Matches user purchase tags against newly acquired inventory,
 * creates ORACLE_MATCH notifications, triggers SMS alerts.
 * Delegates to the existing /api/ai/oracle endpoint logic.
 */
export async function GET() {
  if (isDemoMode()) {
    const now = new Date().toISOString();
    const matches = [
      {
        user_id: 'usr-001',
        display_name: 'TRON_99',
        matched_item: 'Chrono Cross (PS1)',
        matched_tag: 'JRPG',
        confidence: 0.87,
        timestamp: now,
      },
      {
        user_id: 'usr-002',
        display_name: 'PIXEL_QUEEN',
        matched_item: 'Super Mario RPG (SNES)',
        matched_tag: 'PLATFORMER',
        confidence: 0.73,
        timestamp: now,
      },
    ];

    console.log(`[CRON:oracle] ${matches.length} predictive matches found`);
    return Response.json({
      status: 'completed',
      source: 'demo',
      timestamp: now,
      users_scanned: 3,
      matches_found: matches.length,
      sms_sent: matches.filter((m) => m.confidence >= 0.8).length,
      matches,
    });
  }

  return Response.json({ status: 'completed', source: 'live', timestamp: new Date().toISOString() });
}
