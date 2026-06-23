import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withHardening, ValidatedNextRequest } from '@/lib/auth/server-auth';
import { ShopkeeperQuerySchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import type { TenantConfig } from '@/lib/types/tenant-keys';
import type { ShopkeeperMessage } from '@/lib/types';

// ============================================================================
// GUILDOS — Synthetic Shopkeeper AI Route (Fixed)
// DeepSeek-V3 via NVIDIA NIM with rich mock fallback
// Supports: BYO tenant AI keys, conversation history, RAG filtering, streaming
// ============================================================================

const SYSTEM_PROMPT = `You are the Synthetic Shopkeeper — an automated, highly advanced retro-gaming clerk running inside GuildOS, the multi-tenant RPG-commerce platform. You possess absolute encyclopedic knowledge of video game software, hardware variants, and history from the Atari 2600 to the PlayStation 5.

VOICE: Witty, authentic, slightly nerdy, and deeply respectful of vintage tech. You speak like a seasoned RPG NPC merchant — knowledgeable, slightly dramatic, and genuinely passionate about retro games. Use gaming terminology naturally but don't overdo it. You call customers "traveler," "adventurer," or "collector."

CURRENT INVENTORY CONTEXT:
The user query includes a JSON inventory payload from the current store. When asked about stock, ALWAYS query this payload first. If an item IS in the inventory, confirm it enthusiastically with its CURRENT price and condition from the payload. If an item is ABSENT from the inventory, NEVER claim to have it — instead, recommend the Bounty Board feature where customers can post wanted items for the community to find.

RULES:
1. Never hallucinate store availability. Only confirm items actually listed in the inventory payload.
2. Never make up prices — use ONLY the prices and values provided in the inventory payload at the end of each customer query.
3. If asked about an item not in stock, redirect to the Bounty Board with its store credit formula.
4. Provide accurate market value context based on known retro-gaming pricing trends, but do not quote specific dollar amounts for items not present in the inventory payload.
5. Use RPG terminology naturally (loot, legendary drops, quests, faction wars, the Nexus).
6. The store has three customer factions: Sega Syndicate (🔵), Nintendo Nomads (🔴), Sony Sentinels (🟣).
7. Legendary items (market value >= $150) should be described with extra enthusiasm — they are "grail drops."
8. Keep responses concise but flavorful (2-4 paragraphs max).
9. Items marked SCRAP have harvestable components — mention "the Scrap Yard" if relevant.
10. Stay in character. Never break the fourth wall or mention being an AI.`;

// Rich mock responses for demo mode
const MOCK_RESPONSES: Record<string, string> = {
  default:
    "Ah, an excellent question, traveler! Based on my encyclopedic knowledge of retro-gaming history and the current inventory matrix, I'd recommend browsing our shelves — both physical and digital. Is there a specific console generation, genre, or grail you're hunting for today? The faction wars are heating up this month, and the Sony Sentinels are currently leading!",

  price:
    "Market values in the retro-gaming world are as volatile as a randomized loot table. I cross-reference PriceCharting data, recent sold eBay listings, and our own transaction history. For true grails, condition is everything — a CIB (Complete in Box) copy can command 3-5x the value of a loose cartridge. Always check the manual, inserts, and box condition. The difference between 'mint' and 'near-mint' on a Saturn RPG can be hundreds of dollars.",

  recommend:
    "Let me consult the inventory matrix... Based on current market trends and what's in stock, I'd point you toward our JRPG selection. Chrono Trigger for the SNES is a timeless masterpiece with a soundtrack by Yasunori Mitsuda that still gives collectors chills. For PlayStation collectors, Suikoden II is on our Bounty Board if you're up for a quest!",

  earthbound:
    "Ah, EarthBound — the crown jewel of any serious SNES collection! This 1995 cult classic from Shigesato Itoi and HAL Laboratory was a commercial flop at launch (only about 140,000 North American copies sold) but has since become one of the most sought-after JRPGs in existence. The oversized box with the scratch-and-sniff strategy guide makes CIB copies especially rare. Fun fact: the game's quirky humor and modern-day setting were so ahead of their time that it took the collector market nearly two decades to fully appreciate it.",

  faction:
    "The Faction Wars are the beating heart of GuildOS! Every customer picks a side when they register: the Sega Syndicate (🔵) values speed, arcade-perfect ports, and the 16-bit wars. The Nintendo Nomads (🔴) champion quality, nostalgia, and iconic first-party IPs. The Sony Sentinels (🟣) represent the 3D revolution, innovation, and deep JRPG libraries. Every dollar you spend fuels your faction's monthly total. The winning faction at month's end gets a permanent 10% discount on their tagged inventory for the following 30 days. Right now, the Sony Sentinels are on top with $5,100 in total spend this month!",

  scrap:
    "The Scrap Yard — where damaged carts and consoles go for one last adventure before being parted out! We assess each item's harvestable components: laser lenses from optical drive consoles, power supplies, shell casings, controller ports, and working PCB boards. A scrap-condition Sega Dreamcast, for instance, might have $22 in salvageable parts that local modders and repair enthusiasts will happily pay for. It's our way of ensuring no retro hardware ever truly dies — components live on in restoration projects. Want to browse our current scrap matrix?",

  konami:
    "↑ ↑ ↓ ↓ ← → ← → B A — ah, a collector of culture, I see! The Konami Code, created by Kazuhisa Hashimoto for the NES port of Gradius in 1986, is perhaps the most famous cheat code in gaming history. It's appeared in countless games, from Contra (30 lives!) to Dance Dance Revolution. Here at GuildOS, we've got our own easter egg tied to that legendary sequence. But I can't reveal what happens — some secrets must be discovered naturally, traveler.",

  bounty:
    "The Bounty Board is our community-sourced supply chain system — think of it as a quest log for retro collectors. Store owners post high-demand items they're hunting for, set a scarcity multiplier based on how badly they want it, and the system calculates a dynamic store credit value. For example, right now we have a staggering bounty posted for Stadium Events on the NES — the rarest licensed NES game in existence. Customers who fulfill bounties earn XP toward their faction ranking. It's a win-win: stores get inventory, players get rewarded!",
};

// ============================================================================
// RAG: Filter inventory to items relevant to the user's query
// ============================================================================

function filterInventoryByQuery(
  inventory: Array<{
    item_name: string;
    platform?: string;
    tags?: string[];
    condition?: string;
    market_value: number;
    stock_count: number;
  }>,
  query: string,
  maxItems: number = 5
): Array<{
  item_name: string;
  platform?: string;
  condition?: string;
  market_value: number;
  stock_count: number;
}> {
  if (!inventory || inventory.length === 0) return [];

  const q = query.toLowerCase();
  const keywords = q
    .split(/\s+/)
    .filter((k) => k.length > 2)
    .map((k) => k.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  // No useful keywords: return top items by market value
  if (keywords.length === 0) {
    return [...inventory]
      .sort((a, b) => b.market_value - a.market_value)
      .slice(0, maxItems);
  }

  // Score each item by keyword overlap
  const scored = inventory.map((item) => {
    let score = 0;
    const name = (item.item_name || '').toLowerCase();
    const platform = (item.platform || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();
    const condition = (item.condition || '').toLowerCase();

    const searchable = `${name} ${platform} ${tags} ${condition}`;

    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        score += 3; // Strong boost for name match
      }
      if (platform.includes(keyword)) {
        score += 2; // Medium boost for platform match
      }
      if (searchable.includes(keyword)) {
        score += 1; // General match
      }
    }

    // Boost for items actually in stock
    if (item.stock_count > 0) score += 0.5;

    return { item: item as { item_name: string; platform?: string; condition?: string; market_value: number; stock_count: number }, score };
  });

  // Sort by relevance, take top items
  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((s) => s.item);

  // Fallback: top sellers if no keyword overlap
  if (relevant.length === 0) {
    return [...inventory]
      .sort((a, b) => b.stock_count - a.stock_count)
      .slice(0, maxItems);
  }

  return relevant;
}

// ============================================================================
// Build inventory context string
// ============================================================================

function buildInventoryContext(
  relevantItems: Array<{ item_name: string; platform?: string; condition?: string; market_value: number; stock_count: number }>,
  totalCount: number
): string {
  if (relevantItems.length === 0) {
    return 'No inventory data available for this store.';
  }

  const lines = relevantItems.map(
    (i) =>
      `- ${i.item_name} (${i.platform ?? 'Unknown'}) | $${i.market_value} | ${i.stock_count} in stock | ${i.condition ?? 'LOOSE'}`
  );

  // Append total inventory count so the AI knows what it's not seeing
  if (totalCount > relevantItems.length) {
    lines.push(`\n(Showing ${relevantItems.length} of ${totalCount} total inventory items.)`);
  }

  return lines.join('\n');
}

// ============================================================================
// Build AI messages array with conversation history
// ============================================================================

function buildAIMessages(
  query: string,
  inventoryContext: string,
  conversationHistory?: ShopkeeperMessage[]
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add conversation history — last 6 turns for token economy
  if (conversationHistory && conversationHistory.length > 0) {
    const recentTurns = conversationHistory.slice(-6);
    for (const msg of recentTurns) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // Append current query with inventory context
  messages.push({
    role: 'user',
    content: `STORE INVENTORY:\n${inventoryContext}\n\nCUSTOMER QUERY: ${query}`,
  });

  return messages;
}

// ============================================================================
// Stream response from NVIDIA NIM (DeepSeek R1)
// ============================================================================

async function streamFromNIM(
  apiKey: string,
  aiMessages: Array<{ role: string; content: string }>,
  startTime: number
): Promise<NextResponse> {
  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-r1',
        messages: aiMessages,
        max_tokens: 512,
        temperature: 0.7,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA NIM returned ${response.status}: ${errText.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error('NVIDIA NIM returned no response body');
  }

  const encoder = new TextEncoder();

  // Transform stream: parse SSE, extract content deltas, emit plain text
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        } catch {
          // Skip malformed JSON from token-boundary splits
        }
      }
    },
  });

  const stream = response.body.pipeThrough(transformStream);

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Source': 'nvidia-nim-deepseek',
      'X-Model': 'deepseek-ai/deepseek-r1',
      'X-Processing-Time': String(Date.now() - startTime),
    },
  });
}

// ============================================================================
// Mock response — keyword-matched with inventory awareness
// ============================================================================

function matchMockResponse(query: string, inventoryContext: string): string {
  const q = query.toLowerCase();

  // Multi-keyword matching, ordered by specificity
  if (q.includes('earthbound') || q.includes('earth bound') || q.includes('mother 2')) {
    return MOCK_RESPONSES.earthbound;
  }
  if (q.includes('konami') || q.includes('cheat code') || q.includes('contra') || (q.includes('up') && q.includes('down') && q.includes('b a'))) {
    return MOCK_RESPONSES.konami;
  }
  if (q.includes('faction') || q.includes('syndicate') || q.includes('nomad') || q.includes('sentinel') || q.includes('war')) {
    return MOCK_RESPONSES.faction;
  }
  if (q.includes('scrap') || q.includes('junk') || q.includes('broken') || q.includes('repair') || q.includes('parts') || q.includes('harvest')) {
    return MOCK_RESPONSES.scrap;
  }
  if (q.includes('bounty') || q.includes('quest') || q.includes('wanted') || q.includes('looking for')) {
    return MOCK_RESPONSES.bounty;
  }
  if (q.includes('price') || q.includes('worth') || q.includes('value') || q.includes('cost') || q.includes('market')) {
    return MOCK_RESPONSES.price;
  }
  if (q.includes('recommend') || q.includes('suggest') || q.includes('should i') || q.includes('what should') || q.includes('what would you')) {
    return MOCK_RESPONSES.recommend;
  }

  // Default response with inventory awareness
  const itemCount = (inventoryContext.match(/\n/g) || []).length;
  let bonus = '';
  if (itemCount > 5) {
    const legendaryCount = (inventoryContext.match(/GRAIL|legendary|is_legendary/gi) || []).length;
    if (legendaryCount >= 2) {
      bonus = `\n\nBy the way, traveler — our current inventory contains ${itemCount} items, including some true legendary drops that would make any collector's heart race. Care to browse?`;
    } else {
      bonus = `\n\nOur shelves currently hold ${itemCount} unique items. Is there a particular console or genre you're hunting for?`;
    }
  }

  return MOCK_RESPONSES.default + bonus;
}

// ============================================================================
// Type for validated input
// ============================================================================

type ShopkeeperInput = z.infer<typeof ShopkeeperQuerySchema>;

// ============================================================================
// Main Handler
// ============================================================================

export const POST = withHardening(
  async (request, session) => {
    try {
      const startTime = Date.now();
      const body = (request as ValidatedNextRequest<ShopkeeperInput>).validatedData;
      const { query, inventory, messages } = body;

      // --- RAG: Filter inventory to items relevant to the query ---
      const relevantItems = filterInventoryByQuery(inventory ?? [], query);

      // --- Build inventory context with total count ---
      const inventoryContext = buildInventoryContext(relevantItems, inventory?.length ?? 0);

      // --- Get effective AI key ---
      // Priority: tenant BYO key (from DB) > platform env var > null (mock fallback)
      let apiKey: string | null = null;

      if (!session.isDemo) {
        try {
          const supabase = await createClient();
          const { data } = await supabase
            .from('organizations')
            .select('config')
            .eq('id', session.organization_id)
            .single();
          const tenantConfig = data?.config as TenantConfig | null;
          apiKey = tenantConfig?.ai?.nvidia_nim_api_key ?? null;
        } catch (err) {
          console.error('[Shopkeeper] Failed to read tenant config:', err);
        }
      }

      // Fallback: platform-level env var (works for both demo and production)
      if (!apiKey) {
        apiKey = process.env.NVIDIA_NIM_API_KEY || null;
      }

      // --- Build messages array with conversation history ---
      const aiMessages = buildAIMessages(query, inventoryContext, messages);

      // --- Attempt NVIDIA NIM (DeepSeek R1) with streaming ---
      if (apiKey) {
        try {
          return await streamFromNIM(apiKey, aiMessages, startTime);
        } catch (err) {
          console.error('[Shopkeeper] NVIDIA NIM error:', err);
          // Fall through to mock
        }
      }

      // --- Mock Fallback ---
      // Simulate "thinking" delay for realism
      const thinkDelay = 300 + Math.random() * 500;
      const reply = matchMockResponse(query, inventoryContext);
      const processingTime = Date.now() - startTime;

      await new Promise((resolve) => setTimeout(resolve, thinkDelay));

      return NextResponse.json({
        reply,
        source: 'mock',
        model: 'guildos-mock-engine-v1',
        processingTimeMs: processingTime + thinkDelay,
        inventoryCount: inventory?.length ?? 0,
        demo: true,
      });
    } catch (error) {
      console.error('[Shopkeeper] Engine error:', error);
      return NextResponse.json(
        { error: 'Unable to process request' },
        { status: 500 }
      );
    }
  },
  {
    rateLimit: { key: 'shopkeeper-query', maxRequests: 30, windowMs: 60_000 },
    schema: ShopkeeperQuerySchema,
  }
);
