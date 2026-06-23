import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';

// ============================================================================
// GUILDOS — Synthetic Shopkeeper AI Route
// DeepSeek-V3 via NVIDIA NIM with rich mock fallback
// ============================================================================

const SYSTEM_PROMPT = `You are the Synthetic Shopkeeper — an automated, highly advanced retro-gaming clerk running inside GuildOS, the multi-tenant RPG-commerce platform. You possess absolute encyclopedic knowledge of video game software, hardware variants, and history from the Atari 2600 to the PlayStation 5.

VOICE: Witty, authentic, slightly nerdy, and deeply respectful of vintage tech. You speak like a seasoned RPG NPC merchant — knowledgeable, slightly dramatic, and genuinely passionate about retro games. Use gaming terminology naturally but don't overdo it. You call customers "traveler," "adventurer," or "collector."

CURRENT INVENTORY CONTEXT:
The user query includes a JSON inventory payload from the current store. When asked about stock, ALWAYS query this payload first. If an item IS in the inventory, confirm it enthusiastically with the current price and condition. If an item is ABSENT from the inventory, NEVER claim to have it — instead, recommend the Bounty Board feature where customers can post wanted items for the community to find.

RULES:
1. Never hallucinate store availability. Only confirm items actually in the inventory payload.
2. If asked about an item not in stock, redirect to the Bounty Board with its store credit formula.
3. Provide accurate market value context based on known retro-gaming pricing trends.
4. Use RPG terminology naturally (loot, legendary drops, quests, faction wars, the Nexus).
5. The store has three customer factions: Sega Syndicate (🔵), Nintendo Nomads (🔴), Sony Sentinels (🟣).
6. Legendary items (market value >= $150) should be described with extra enthusiasm — they're "grail drops."
7. Keep responses concise but flavorful (2-4 paragraphs max).
8. Items marked SCRAP have harvestable components — mention "the Scrap Yard" if relevant.
9. Stay in character. Never break the fourth wall or mention being an AI.

EXTERNAL PRICING CONTEXT:
When discussing market values, reference typical PriceCharting data. Key price points you should know:
- EarthBound CIB ~$350-400 (one of the rarest SNES titles, only ~140k copies sold in NA)
- Chrono Trigger Loose ~$185 (22% price spike recently)
- Panzer Dragoon Saga CIB ~$850 (Saturn grail, extremely limited print run)
- Stadium Events NES ~$15,000+ (the holy grail, only ~200 copies known to exist)`;

// Rich mock responses for demo mode
const MOCK_RESPONSES: Record<string, string> = {
  default:
    "Ah, an excellent question, traveler! Based on my encyclopedic knowledge of retro-gaming history and the current inventory matrix, I'd recommend browsing our shelves — both physical and digital. Is there a specific console generation, genre, or grail you're hunting for today? The faction wars are heating up this month, and the Sony Sentinels are currently leading!",

  price:
    "Market values in the retro-gaming world are as volatile as a randomized loot table. I cross-reference PriceCharting data, recent sold eBay listings, and our own transaction history. For true grails like EarthBound or Panzer Dragoon Saga, condition is everything — a CIB (Complete in Box) copy can command 3-5x the value of a loose cartridge. Always check the manual, inserts, and box condition. The difference between 'mint' and 'near-mint' on a Saturn RPG can be hundreds of dollars.",

  recommend:
    "Let me consult the inventory matrix... Based on current market trends and what's in stock, I'd point you toward our JRPG selection. Chrono Trigger for the SNES is a timeless masterpiece with a soundtrack by Yasunori Mitsuda that still gives collectors chills. Our copy is a loose cart at $199.99, but there's been a 22% price spike recently — if you want it, I wouldn't wait. For PlayStation collectors, Suikoden II is on our Bounty Board if you're up for a quest!",

  earthbound:
    "Ah, EarthBound — the crown jewel of any serious SNES collection! This 1995 cult classic from Shigesato Itoi and HAL Laboratory was a commercial flop at launch (only about 140,000 North American copies sold) but has since become one of the most sought-after JRPGs in existence. The oversized box with the scratch-and-sniff strategy guide makes CIB copies especially rare. Our shop currently has a CIB copy at $379.99 — she's a beauty. Fun fact: the game's quirky humor and modern-day setting were so ahead of their time that it took the collector market nearly two decades to fully appreciate it.",

  faction:
    "The Faction Wars are the beating heart of GuildOS! Every customer picks a side when they register: the Sega Syndicate (🔵) values speed, arcade-perfect ports, and the 16-bit wars. The Nintendo Nomads (🔴) champion quality, nostalgia, and iconic first-party IPs. The Sony Sentinels (🟣) represent the 3D revolution, innovation, and deep JRPG libraries. Every dollar you spend fuels your faction's monthly total. The winning faction at month's end gets a permanent 10% discount on their tagged inventory for the following 30 days. Right now, the Sony Sentinels are on top with $5,100 in total spend this month!",

  scrap:
    "The Scrap Yard — where damaged carts and consoles go for one last adventure before being parted out! We assess each item's harvestable components: laser lenses from optical drive consoles, power supplies, shell casings, controller ports, and working PCB boards. A scrap-condition Sega Dreamcast, for instance, might have $22 in salvageable parts that local modders and repair enthusiasts will happily pay for. It's our way of ensuring no retro hardware ever truly dies — components live on in restoration projects. Want to browse our current scrap matrix?",

  konami:
    "↑ ↑ ↓ ↓ ← → ← → B A — ah, a collector of culture, I see! The Konami Code, created by Kazuhisa Hashimoto for the NES port of Gradius in 1986, is perhaps the most famous cheat code in gaming history. It's appeared in countless games, from Contra (30 lives!) to Dance Dance Revolution. Here at GuildOS, we've got our own easter egg tied to that legendary sequence. But I can't reveal what happens — some secrets must be discovered naturally, traveler.",

  bounty:
    "The Bounty Board is our community-sourced supply chain system — think of it as a quest log for retro collectors. Store owners post high-demand items they're hunting for, set a scarcity multiplier based on how badly they want it, and the system calculates a dynamic store credit value. For example, right now we're offering a staggering $37,500 in store credit for a copy of Stadium Events on the NES — the rarest licensed NES game in existence, with a scarcity multiplier of 2.50x. Customers who fulfill bounties earn XP toward their faction ranking. It's a win-win: stores get inventory, players get rewarded!",
};

// --- Intelligent keyword matching ---
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

// --- Main Handler ---
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limit: 10 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`shopkeeper:${ip}`, { windowMs: 60_000, maxRequests: 10 });
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { query, inventory } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Build inventory context for the AI
    const inventoryContext = inventory?.length
      ? inventory
          .map(
            (i: { item_name: string; platform?: string; market_value: number; stock_count: number; condition?: string }) =>
              `- ${i.item_name} (${i.platform ?? 'Unknown'}) | $${i.market_value} | ${i.stock_count} in stock | ${i.condition ?? 'LOOSE'}`
          )
          .join('\n')
      : 'No inventory data available for this store.';

    // --- Attempt NVIDIA NIM (DeepSeek) ---
    const nimApiKey = process.env.NVIDIA_NIM_API_KEY;

    if (nimApiKey) {
      try {
        const response = await fetch(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${nimApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-ai/deepseek-r1',
              messages: [
                {
                  role: 'system',
                  content: SYSTEM_PROMPT,
                },
                {
                  role: 'user',
                  content: `STORE INVENTORY:\n${inventoryContext}\n\nCUSTOMER QUERY: ${query}`,
                },
              ],
              max_tokens: 512,
              temperature: 0.7,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;

          if (reply) {
            const processingTime = Date.now() - startTime;
            return Response.json({
              reply,
              source: 'nvidia-nim-deepseek',
              model: 'deepseek-ai/deepseek-r1',
              processingTimeMs: processingTime,
              inventoryCount: inventory?.length ?? 0,
            });
          }
        }
      } catch (err) {
        console.error('[Shopkeeper] NVIDIA NIM error:', err);
      }
    }

    // --- Mock Fallback ---
    // Simulate "thinking" delay for realism
    const thinkDelay = 300 + Math.random() * 500;
    const reply = matchMockResponse(query, inventoryContext);
    const processingTime = Date.now() - startTime;

    // Simulate async delay
    await new Promise((resolve) => setTimeout(resolve, thinkDelay));

    return Response.json({
      reply,
      source: 'mock',
      model: 'guildos-mock-engine-v1',
      processingTimeMs: processingTime + thinkDelay,
      inventoryCount: inventory?.length ?? 0,
      demo: true,
    });
  } catch (error) {
    console.error('[Shopkeeper] Engine error:', error);
    return Response.json(
      { error: 'Unable to process request' },
      { status: 500 }
    );
  }
}
