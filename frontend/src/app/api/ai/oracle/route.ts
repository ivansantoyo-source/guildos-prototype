import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import type { OracleMatch } from '@/lib/types';
import { phantomInventory, phantomProfiles } from '@/mocks/phantomData';
import { isDemoMode } from '@/lib/toggles';

/**
 * POST /api/ai/oracle
 * The Oracle Predictive Engine — matches user purchase vectors against
 * newly acquired inventory to find items customers might want.
 *
 * Body: { userIds?: string[] } — optionally filter to specific users
 * Returns: { matches: OracleMatch[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = rateLimit(`oracle:${ip}`, { windowMs: 60_000, maxRequests: 10 });
    if (!success) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { userIds } = body as { userIds?: string[] };

    if (isDemoMode()) {
      return handleDemoOracle(userIds);
    }

    // Production mode — query Supabase
    // TODO: Wire to Supabase when PRODUCTION mode is active
    return Response.json({ matches: [], source: 'supabase' });
  } catch (error) {
    console.error('[Oracle] Engine error:', error);
    return Response.json(
      { error: 'Unable to process request' },
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

  return Response.json({
    matches: matches.slice(0, 5),
    source: 'mock-oracle',
    totalProfilesScanned: profiles.length,
    totalInventoryScanned: phantomInventory.length,
  });
}

/**
 * GET /api/ai/oracle?userId=xxx
 * Quick check for a specific user's matches
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: 'userId query parameter required' }, { status: 400 });
  }

  // Delegate to POST logic
  const req = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ userIds: [userId] }),
  });

  return POST(req);
}
