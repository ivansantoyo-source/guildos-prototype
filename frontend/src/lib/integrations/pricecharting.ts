// ============================================================================
// GUILDOS — PriceCharting API Integration
// Real-time market price lookups for retro games and hardware
// ============================================================================

import { shouldUseMock } from '@/lib/toggles';

export interface PriceChartingResult {
  itemName: string;
  platform: string;
  price: number;
  condition: string;
  lastUpdated: string;
  source: 'pricecharting' | 'mock';
  priceUrl?: string;
}

// Demo market prices for well-known retro titles
const DEMO_PRICES: Record<string, number> = {
  'earthbound': 350.00,
  'mother 2': 350.00,
  'chrono trigger': 185.00,
  'chrono cross': 45.00,
  'final fantasy iii': 65.00,
  'final fantasy vi': 65.00,
  'super mario rpg': 85.00,
  'legend of zelda: ocarina of time': 95.00,
  'legend of zelda: majora\'s mask': 75.00,
  'mega man x3': 250.00,
  'panzer dragoon saga': 850.00,
  'sonic the hedgehog 2': 25.00,
  'metal gear solid': 35.00,
  'suikoden ii': 180.00,
  'stadium events': 15000.00,
  'powerstone 2': 120.00,
  'goldeneye 007': 30.00,
  'super smash bros. melee': 65.00,
  'street fighter iii: 3rd strike': 85.00,
  'nintendo 64 console': 75.00,
  'sega dreamcast console': 40.00,
};

/**
 * Fetch the current market price for a single item from PriceCharting.
 * Falls back to demo/mock data when PriceCharting API key is not configured.
 */
export async function fetchMarketPrice(
  itemName: string,
  platform?: string
): Promise<PriceChartingResult> {
  if (shouldUseMock('pricing')) {
    return mockPriceLookup(itemName, platform);
  }

  // Production: call PriceCharting API
  try {
    const apiKey = process.env.PRICECHARTING_API_KEY;
    const query = platform ? `${itemName} ${platform}` : itemName;

    const response = await fetch(
      `https://www.pricecharting.com/api/product?t=${encodeURIComponent(query)}&key=${apiKey}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`PriceCharting API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      itemName,
      platform: platform ?? 'Unknown',
      price: data.price ?? data['loose-price'] ?? 0,
      condition: 'LOOSE',
      lastUpdated: new Date().toISOString(),
      source: 'pricecharting',
      priceUrl: data.url,
    };
  } catch (error) {
    console.error('PriceCharting API error:', error);
    // Fall back to mock
    return mockPriceLookup(itemName, platform);
  }
}

/**
 * Bulk price check for multiple items.
 */
export async function bulkPriceCheck(
  items: Array<{ name: string; platform?: string }>
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Process in parallel with a concurrency limit of 3
  const batches = chunkArray(items, 3);

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((item) => fetchMarketPrice(item.name, item.platform))
    );
    batchResults.forEach((r) => results.set(r.itemName, r.price));
  }

  return results;
}

// --- Mock / Demo Helpers ---

function mockPriceLookup(itemName: string, platform?: string): PriceChartingResult {
  // Fuzzy match the item name against demo prices
  const key = itemName.toLowerCase().trim();
  let price = DEMO_PRICES[key] ?? randomDemoPrice();

  // Add some "market fluctuation" for realism
  const fluctuation = (Math.random() - 0.5) * 0.1; // ±5%
  price = Math.round(price * (1 + fluctuation) * 100) / 100;

  return {
    itemName,
    platform: platform ?? inferPlatform(itemName),
    price,
    condition: 'LOOSE',
    lastUpdated: new Date().toISOString(),
    source: 'mock',
    priceUrl: `https://www.pricecharting.com/game/${encodeURIComponent(itemName.replace(/\s+/g, '-').toLowerCase())}`,
  };
}

function inferPlatform(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('snes') || lower.includes('super nintendo') || ['earthbound', 'chrono trigger', 'super mario rpg', 'mega man x3'].some((n) => lower.includes(n))) return 'SNES';
  if (lower.includes('nes') || lower.includes('nintendo entertainment') || lower.includes('stadium events')) return 'NES';
  if (lower.includes('n64') || lower.includes('nintendo 64') || ['ocarina of time', 'majora\'s mask', 'goldeneye 007'].some((n) => lower.includes(n))) return 'N64';
  if (lower.includes('ps1') || lower.includes('playstation 1') || ['chrono cross', 'metal gear solid', 'suikoden ii'].some((n) => lower.includes(n))) return 'PS1';
  if (lower.includes('genesis') || lower.includes('mega drive') || ['sonic the hedgehog'].some((n) => lower.includes(n))) return 'GENESIS';
  if (lower.includes('saturn') || lower.includes('panzer dragoon')) return 'SATURN';
  if (lower.includes('dreamcast') || lower.includes('powerstone')) return 'DREAMCAST';
  if (lower.includes('gamecube') || lower.includes('melee')) return 'GAMECUBE';
  return 'Unknown';
}

function randomDemoPrice(): number {
  const prices = [15, 20, 25, 30, 35, 40, 45, 50, 65, 75, 85, 95, 120, 150, 185];
  return prices[Math.floor(Math.random() * prices.length)];
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
