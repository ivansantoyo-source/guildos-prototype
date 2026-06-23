import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/toggles';
import { sendOracleAlert } from '@/lib/integrations/twilio';

/**
 * Vercel Cron — Oracle Predictive Engine (every 2 hours)
 * Matches user purchase tags against newly acquired inventory,
 * creates ORACLE_MATCH notifications, triggers SMS alerts.
 *
 * Protected by CRON_SECRET authorization header (set automatically by Vercel Cron).
 */
export async function GET(request?: NextRequest) {
  // Auth: CRON_SECRET header check — unconditional, fails closed
  const authHeader = request?.headers?.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Production mode — query Supabase with service role.
  // Service role is intentional here: this is a cross-tenant system cron that needs to read
  // every org's inventory and profiles. An anon-key client scoped to a single tenant (via RLS)
  // cannot fulfill this. To mitigate risk:
  //   - All queries are capped at 500 rows (prevents OOM on large tenants)
  //   - Statement timeout is set at the session level (30s) to kill runaway queries
  //   - The route is protected by CRON_SECRET (Vercel Cron only, not exposed publicly)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: 'guildos_core' },
    });

    // Set statement timeout (30s) — non-fatal if function doesn't exist
    try {
      await supabase.rpc('set_config', { key: 'statement_timeout', value: '30000' });
    } catch {
      // Non-fatal: timeout defaults to instance limit
    }

    // 1. Get organizations (capped at 500 — prevents OOM on large tenants)
    const { data: organizations, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(500);

    if (orgErr) throw orgErr;
    if (!organizations || organizations.length === 0) {
      return Response.json({
        status: 'completed',
        source: 'live',
        timestamp: new Date().toISOString(),
        organizations_scanned: 0,
        matches_found: 0,
        notifications_created: 0,
        sms_sent: 0,
        matches: [],
      });
    }

    const allMatches: Array<{
      orgId: string;
      orgName: string;
      userId: string;
      displayName: string;
      phone?: string;
      matchedItem: string;
      matchedTag: string;
      confidence: number;
    }> = [];

    // 2. Parallel per-org queries using Promise.all — eliminates N+1 round-trips
    const orgResults = await Promise.all(
      organizations.map(async (org) => {
        const [invResult, profResult] = await Promise.all([
          supabase
            .from('inventory')
            .select('item_name, platform, tags')
            .eq('organization_id', org.id)
            .eq('status', 'ACTIVE')
            .limit(500),
          supabase
            .from('profiles')
            .select('id, display_name, purchase_tags, phone')
            .eq('organization_id', org.id)
            .not('purchase_tags', 'is', null)
            .limit(500),
        ]);

        if (invResult.error) {
          console.error(`[CRON:oracle] Inventory query error for org ${org.id}:`, invResult.error);
          return [];
        }
        if (profResult.error) {
          console.error(`[CRON:oracle] Profiles query error for org ${org.id}:`, profResult.error);
          return [];
        }

        const inventory = invResult.data ?? [];
        const profiles = profResult.data ?? [];
        if (inventory.length === 0 || profiles.length === 0) return [];

        // 3. Run the tag-matching algorithm
        const orgMatches: Array<{
          orgId: string;
          orgName: string;
          userId: string;
          displayName: string;
          phone?: string;
          matchedItem: string;
          matchedTag: string;
          confidence: number;
        }> = [];

        for (const profile of profiles) {
          const userTags: string[] = profile.purchase_tags ?? [];

          for (const item of inventory) {
            const itemTags: string[] = item.tags ?? [];
            if (itemTags.length === 0) continue;

            const matchedTags = itemTags.filter((tag: string) => userTags.includes(tag));
            if (matchedTags.length === 0) continue;

            const confidence = Math.min(
              (matchedTags.length / itemTags.length) * (userTags.length / 10),
              0.99,
            );

            orgMatches.push({
              orgId: org.id,
              orgName: org.name,
              userId: profile.id,
              displayName: profile.display_name,
              phone: profile.phone ?? undefined,
              matchedItem: `${item.item_name}${item.platform ? ` (${item.platform})` : ''}`,
              matchedTag: matchedTags[0],
              confidence,
            });
          }
        }

        return orgMatches;
      }),
    );

    // Flatten results from all orgs
    for (const matches of orgResults) {
      allMatches.push(...matches);
    }

    // Sort by confidence descending, cap at top 50
    allMatches.sort((a, b) => b.confidence - a.confidence);
    const topMatches = allMatches.slice(0, 50);

    // 4. Batch write ORACLE_MATCH notifications to guildos_core.notifications
    const notifications = topMatches.map((match) => ({
      organization_id: match.orgId,
      user_id: match.userId,
      type: 'ORACLE_MATCH',
      title: 'The Oracle has foreseen your next treasure',
      message: `${match.matchedItem} (${Math.round(match.confidence * 100)}% match) — your ${match.matchedTag} collection beckons.`,
      metadata: {
        matched_item: match.matchedItem,
        matched_tag: match.matchedTag,
        confidence: match.confidence,
      },
    }));

    let notificationsCreated = 0;
    if (notifications.length > 0) {
      const { error: notifErr } = await supabase.from('notifications').insert(notifications);
      if (notifErr) {
        console.error('[CRON:oracle] Batch notification insert failed:', notifErr);
      } else {
        notificationsCreated = notifications.length;
      }
    }

    // 5. Send Twilio SMS for high-confidence matches (>=80%)
    let smsSent = 0;
    for (const match of topMatches) {
      if (match.confidence >= 0.8 && match.phone) {
        try {
          await sendOracleAlert(match.phone, match.matchedItem, match.orgName);
          smsSent++;
        } catch (err) {
          console.error(`[CRON:oracle] SMS failed for user ${match.userId}:`, err);
        }
      }
    }

    return Response.json({
      status: 'completed',
      source: 'live',
      timestamp: new Date().toISOString(),
      organizations_scanned: organizations.length,
      matches_found: allMatches.length,
      notifications_created: notificationsCreated,
      sms_sent: smsSent,
      top_matches: topMatches.slice(0, 10).map((m) => ({
        user_display_name: m.displayName,
        matched_item: m.matchedItem,
        confidence: m.confidence,
      })),
    });
  } catch (err) {
    console.error('[CRON:oracle] Production error:', err);
    return Response.json(
      {
        status: 'error',
        error: 'Oracle engine failed',
        details: err instanceof Error ? err.message : 'Unknown',
      },
      { status: 500 },
    );
  }
}
