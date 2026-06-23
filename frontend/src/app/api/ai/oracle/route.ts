import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withHardening, ValidatedNextRequest } from '@/lib/auth/server-auth';
import { createClient } from '@/lib/supabase/server';
import type { ServerSession } from '@/lib/auth/server-auth';
import type { OracleMatch } from '@/lib/types';
import { phantomInventory, phantomProfiles } from '@/mocks/phantomData';
import { OracleSchema } from '@/lib/validation/schemas';

/**
 * POST /api/ai/oracle
 * The Oracle Predictive Engine — matches user purchase vectors against
 * newly acquired inventory to find items customers might want.
 *
 * Body: { userIds?: string[] } — optionally filter to specific users
 * Returns: { matches: OracleMatch[] }
 */
const postHandler = async (req: NextRequest, session: ServerSession) => {
  try {
    const { userIds } = (req as ValidatedNextRequest<z.infer<typeof OracleSchema>>).validatedData;

    if (session.isDemo) {
      return handleDemoOracle(userIds);
    }

    // Production mode — query Supabase with org scoping
    return runProductionOracle(session.organization_id, userIds);
  } catch (error) {
    console.error('[Oracle] Engine error:', error);
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 500 }
    );
  }
};

export const POST = withHardening(postHandler, {
  schema: OracleSchema,
  rateLimit: { key: 'oracle-post', maxRequests: 30, windowMs: 60_000 },
});

/**
 * GET /api/ai/oracle?userId=xxx
 * Quick check for a specific user's matches
 */
const getHandler = async (req: NextRequest, session: ServerSession) => {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter required' }, { status: 400 });
  }

  if (session.isDemo) {
    return handleDemoOracle([userId]);
  }

  // Production mode — delegate to shared oracle logic
  return runProductionOracle(session.organization_id, [userId]);
};

export const GET = withHardening(getHandler, {
  rateLimit: { key: 'oracle-get', maxRequests: 60, windowMs: 60_000 },
});

/**
 * Shared production Oracle logic — queries Supabase profiles and inventory,
 * computes tag-intersection matches with confidence scoring, and writes
 * ORACLE_MATCH notifications for the organization.
 */
async function runProductionOracle(
  organizationId: string,
  userIds?: string[]
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // 1. Fetch profiles with purchase_tags (optionally filtered to specific users)
    let profilesQuery = supabase
      .from('profiles')
      .select('id, display_name, purchase_tags')
      .eq('organization_id', organizationId)
      .not('purchase_tags', 'eq', '[]');

    if (userIds && userIds.length > 0) {
      profilesQuery = profilesQuery.in('id', userIds);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('[Oracle] Profiles query error:', profilesError.message);
      return NextResponse.json(
        { error: 'Failed to query profiles', matches: [], source: 'supabase' },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        matches: [],
        source: 'supabase',
        organization_id: organizationId,
        totalProfilesScanned: 0,
        totalInventoryScanned: 0,
      });
    }

    // 2. Fetch active inventory with tags for the organization
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, item_name, platform, tags')
      .eq('organization_id', organizationId)
      .eq('status', 'ACTIVE')
      .not('tags', 'eq', '[]');

    if (inventoryError) {
      console.error('[Oracle] Inventory query error:', inventoryError.message);
      return NextResponse.json(
        { error: 'Failed to query inventory', matches: [], source: 'supabase' },
        { status: 500 }
      );
    }

    if (!inventory || inventory.length === 0) {
      return NextResponse.json({
        matches: [],
        source: 'supabase',
        organization_id: organizationId,
        totalProfilesScanned: profiles.length,
        totalInventoryScanned: 0,
      });
    }

    // 3. Compute tag-intersection matches with confidence scoring
    const matches: OracleMatch[] = [];

    for (const profile of profiles) {
      const purchaseTags: string[] = (profile as { purchase_tags: string[] }).purchase_tags ?? [];

      if (purchaseTags.length === 0) continue;

      for (const item of inventory) {
        const itemTags: string[] = (item as { tags: string[] }).tags ?? [];

        if (itemTags.length === 0) continue;

        const matchedTags = itemTags.filter((tag) => purchaseTags.includes(tag));

        if (matchedTags.length > 0) {
          const primaryTag = matchedTags[0];
          const profile_ = profile as { id: string; display_name: string };
          const item_ = item as { item_name: string; platform?: string };

          matches.push({
            userId: profile_.id,
            userDisplayName: profile_.display_name || 'Unknown',
            matchedItem: `${item_.item_name}${item_.platform ? ` (${item_.platform})` : ''}`,
            matchedTag: primaryTag,
            confidence: Math.min(
              (matchedTags.length / itemTags.length) * (purchaseTags.length / 10),
              0.99
            ),
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Sort by confidence descending, limit to top 5
    matches.sort((a, b) => b.confidence - a.confidence);
    const topMatches = matches.slice(0, 5);

    // 5. Write ORACLE_MATCH notifications so merchants see results in-app
    if (topMatches.length > 0) {
      const notifications = topMatches.map((match) => ({
        organization_id: organizationId,
        user_id: match.userId,
        type: 'ORACLE_MATCH' as const,
        title: `Oracle found a match for ${match.userDisplayName}`,
        message: `Recommended: ${match.matchedItem} (${(match.confidence * 100).toFixed(0)}% confidence)`,
        metadata: {
          matchedItem: match.matchedItem,
          matchedTag: match.matchedTag,
          confidence: match.confidence,
          timestamp: match.timestamp,
        },
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) {
        console.error('[Oracle] Failed to write notifications:', notifyError.message);
        // Non-fatal — matches are still returned even if notifications fail
      }
    }

    return NextResponse.json({
      matches: topMatches,
      source: 'supabase',
      organization_id: organizationId,
      totalProfilesScanned: profiles.length,
      totalInventoryScanned: inventory.length,
    });
  } catch (error) {
    console.error('[Oracle] Production oracle error:', error);
    return NextResponse.json(
      { error: 'Oracle engine failed', matches: [], source: 'supabase' },
      { status: 500 }
    );
  }
}

function handleDemoOracle(userIds?: string[]) {
  const matches: OracleMatch[] = [];

  // Filter profiles if specific userIds provided
  const profiles = userIds
    ? phantomProfiles.filter((p) => userIds.includes(p.id))
    : phantomProfiles;

  for (const profile of profiles) {
    // Find inventory items whose tags match the user's purchase tags
    for (const item of phantomInventory) {
      if (item.status !== 'ACTIVE') continue;

      const matchedTags = item.tags.filter((tag) =>
        profile.purchase_tags.includes(tag)
      );

      if (matchedTags.length > 0) {
        // Use the first matching tag as the primary match
        const primaryTag = matchedTags[0];

        matches.push({
          userId: profile.id,
          userDisplayName: profile.display_name,
          matchedItem: `${item.item_name} (${item.platform})`,
          matchedTag: primaryTag,
          confidence: Math.min(
            matchedTags.length / item.tags.length * profile.purchase_tags.length / 10,
            0.99
          ),
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  // Sort by confidence, limit to top 5
  matches.sort((a, b) => b.confidence - a.confidence);

  return NextResponse.json({
    matches: matches.slice(0, 5),
    source: 'mock-oracle',
    totalProfilesScanned: profiles.length,
    totalInventoryScanned: phantomInventory.length,
  });
}
