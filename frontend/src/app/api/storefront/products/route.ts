// ============================================================================
// GUILDOS — Storefront Products API
// Customer-facing product catalog endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { isDemoModeServer } from '@/lib/toggles/server';
import { phantomInventory } from '@/mocks/phantomData';

export async function GET(request: NextRequest) {
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
      // Production: query Supabase guildos_core.inventory
      // For now, fall back to phantom in production without Supabase
      items = [...phantomInventory];
    }

    // Filter: only show ACTIVE items (customer-facing)
    items = items.filter((item) => item.status === 'ACTIVE');

    // Filter: single item by ID
    if (id) {
      const item = items.find((i) => i.id === id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      return NextResponse.json({ data: item });
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
      data: paged,
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
