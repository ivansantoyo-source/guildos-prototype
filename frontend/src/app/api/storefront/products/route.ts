// ============================================================================
// GUILDOS — Storefront Products API
//
// PUBLIC ENDPOINT — Customer-facing product catalog.
// This endpoint is intentionally unauthenticated and serves public product
// listings to storefront visitors. No authentication or role checks are
// applied because customers browsing the catalog are not required to log in.
//
// Security considerations (READ BEFORE MODIFYING):
//  - Rate limited (120 req/min) to prevent scraping / abuse.
//  - Only returns items with status === 'ACTIVE'.
//  - ALL internal fields (organization_id, stock_count, scrap_value,
//    price_spike_flag, notes, pricecharting_id, last_price_sync,
//    created_at, updated_at) are stripped by sanitizeItem() before
//    the response is sent — this is the SECOND line of defense after RLS.
//  - In production, the Supabase query MUST filter by the session's
//    organization_id. Never query guildos_core.inventory without
//    WHERE organization_id = <session_org>. RLS is NOT sufficient alone
//    because a misconfigured policy or a super-user role could bypass it.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { phantomInventory } from '@/mocks/phantomData';
import { withRateLimit } from '@/lib/auth/server-auth';
import type { ServerSession } from '@/lib/auth/server-auth';

// ────────────────────────────────────────────────────────────────────────────
// Typesafe public product shape — NO internal fields exposed to customers.
// ────────────────────────────────────────────────────────────────────────────
interface PublicStorefrontItem {
  id: string;
  item_name: string;
  platform?: string;
  condition?: string;
  market_value: number;
  our_price?: number;
  is_legendary: boolean;
  tags: string[];
  image_url?: string;
  scanned_image_url?: string;
  status: string;
}

/**
 * Strip all internal/administrative fields from an inventory item before
 * returning it to the public storefront. This is the application-layer
 * sanitization that backs up RLS / query scoping.
 *
 * Fields removed: organization_id, scrap_value, stock_count, price_spike_flag,
 * pricecharting_id, last_price_sync, notes, created_at, updated_at.
 */
function sanitizeItem(item: Record<string, unknown>): PublicStorefrontItem {
  return {
    id: item.id as string,
    item_name: item.item_name as string,
    platform: item.platform as string | undefined,
    condition: item.condition as string | undefined,
    market_value: item.market_value as number,
    our_price: item.our_price as number | undefined,
    is_legendary: item.is_legendary as boolean,
    tags: item.tags as string[],
    image_url: item.image_url as string | undefined,
    scanned_image_url: item.scanned_image_url as string | undefined,
    status: item.status as string,
  };
}

async function handler(
  request: NextRequest,
  session: ServerSession | null
): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const demo = await isDemoModeServer(searchParams);

  const platform = searchParams.get('platform');
  const condition = searchParams.get('condition');
  const search = searchParams.get('search')?.toLowerCase();
  const minPrice = parseFloat(searchParams.get('min_price') || '0');
  const maxPrice = parseFloat(searchParams.get('max_price') || '999999');
  const legendaryOnly = searchParams.get('legendary') === 'true';
  const tags = searchParams.get('tags')?.split(',') || [];
  const sort = searchParams.get('sort') || 'name_asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const id = searchParams.get('id');

  try {
    let items;

    if (demo) {
      items = [...phantomInventory];
    } else {
      // PRODUCTION PATH — SECURITY CRITICAL
      //
      // When wiring Supabase, this query MUST:
      //   1.  Scope to the tenant's organization_id from the session:
      //         supabase.from('inventory')
      //           .select('*')
      //           .eq('organization_id', session?.organization_id)
      //   2.  Never fall back to a query without organization_id filter
      //   3.  Never use .select('*') with a service-role client outside a
      //       tenant-scoped RPC
      //
      // If session is null (no auth), return 401 — anonymous customers
      // browsing the storefront use the ?demo=true path, not production.
      // An unauthenticated production request should never hit the DB.
      //
      // TODO: Replace with Supabase query once production DB is wired.
      //       See security notes above.
      if (!session?.organization_id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      items = [...phantomInventory];
    }

    // Security: only expose ACTIVE items to customers
    items = items.filter((item) => item.status === 'ACTIVE');

    // Filter: single item by ID
    if (id) {
      const item = items.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ data: sanitizeItem(item as unknown as Record<string, unknown>) });
    }

    // Filter: search
    if (search) {
      items = items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(search) ||
          i.platform?.toLowerCase().includes(search) ||
          i.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Filter: platform
    if (platform) {
      items = items.filter((i) => i.platform === platform);
    }

    // Filter: condition
    if (condition) {
      items = items.filter((i) => i.condition === condition);
    }

    // Filter: price range
    items = items.filter((i) => {
      const price = i.our_price ?? i.market_value;
      return price >= minPrice && price <= maxPrice;
    });

    // Filter: legendary
    if (legendaryOnly) {
      items = items.filter((i) => i.is_legendary);
    }

    // Filter: tags
    if (tags.length > 0) {
      items = items.filter((i) =>
        tags.some((t) => i.tags.map((tag) => tag.toLowerCase()).includes(t.toLowerCase()))
      );
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => (a.our_price ?? a.market_value) - (b.our_price ?? b.market_value));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.our_price ?? b.market_value) - (a.our_price ?? a.market_value));
        break;
      case 'name_desc':
        items.sort((a, b) => b.item_name.localeCompare(a.item_name));
        break;
      case 'newest':
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'name_asc':
      default:
        items.sort((a, b) => a.item_name.localeCompare(b.item_name));
        break;
    }

    // Extract unique platforms and tags for filter UI
    const allPlatforms = [...new Set(items.map((i) => i.platform).filter(Boolean))];
    const allTags = [...new Set(items.flatMap((i) => i.tags))];

    // Pagination
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return NextResponse.json({
      data: paged.map((i) => sanitizeItem(i as unknown as Record<string, unknown>)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        filters: {
          platforms: allPlatforms,
          tags: allTags,
          conditions: ['NEW', 'CIB', 'LOOSE'],
        },
      },
    });
  } catch (error) {
    console.error('[storefront/products] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

/**
 * GET /api/storefront/products
 *
 * Public product catalog. Rate-limited at 120 requests per 60 seconds.
 * Wrapped with withRateLimit (no auth required) to guard against abuse
 * while keeping the endpoint accessible to anonymous storefront visitors.
 */
export const GET = withRateLimit(handler, 'storefront-products', 120, 60_000);
