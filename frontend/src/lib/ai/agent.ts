// ============================================================================
// GUILDOS — Agentic AI Loop
// Core agent loop with tool-use orchestration
// ============================================================================

import type { AgentMessage, AIToolCall } from '@/lib/types';
import { executeToolCall, AI_TOOLS } from './tools';

const TOOL_DEFINITIONS_TEXT = AI_TOOLS.map(
  (t) => {
    const params = Object.entries(t.parameters)
      .map(([name, def]) => `    - ${name}: (${def.type})${def.required ? ' REQUIRED' : ''} — ${def.description}`)
      .join('\n');
    return `**${t.name}** [${t.category}]\n  ${t.description}\n  Parameters:\n${params}`;
  }
).join('\n\n');

const SYSTEM_PROMPT = `You are the GuildOS Agentic AI, an autonomous shopkeeper assistant for a retro gaming store called "Time Warp Gaming."

Your role is to HELP the merchant run their store. You have ACCESS to real store data through TOOLS. You MUST use tools to answer questions about inventory, bounties, orders, pricing, and customers. DO NOT make up data — always call the appropriate tool.

When a user asks a question that requires data, follow this pattern:
1. Identify which tool(s) to call
2. Output the tool call in this exact format on its own line:
   TOOL_CALL: {"tool": "tool_name", "params": {"param1": "value1", ...}}
3. Wait for the tool result (it will be provided)
4. Synthesize a natural, helpful response using the tool results
5. Be proactive — suggest follow-up actions

You can call MULTIPLE tools in sequence. Each TOOL_CALL must be on its own line.

Available tools:
${TOOL_DEFINITIONS_TEXT}

Store context: Time Warp Gaming is a brick-and-mortar retro gaming store. We buy, sell, and trade retro games and consoles. We use an RPG gamification system (XP, factions, bounties).

Be concise but helpful. Use emoji. The merchant's time is valuable.`;

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function detectToolCalls(content: string): AIToolCall[] {
  const calls: AIToolCall[] = [];
  const regex = /TOOL_CALL:\s*(\{[^}]+\})/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool && parsed.params) {
        calls.push({
          id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tool_name: parsed.tool,
          parameters: parsed.params,
          status: 'pending',
          called_at: new Date().toISOString(),
        });
      }
    } catch {
      // Skip malformed tool calls
    }
  }
  return calls;
}

export interface AgentResponse {
  message: AgentMessage;
  toolCalls: AIToolCall[];
}

export function generateMockResponse(
  userMessage: string,
  conversationHistory: AgentMessage[],
  mode: 'merchant' | 'customer'
): AgentResponse {
  const lower = userMessage.toLowerCase();
  const toolCalls: AIToolCall[] = [];
  let responseContent = '';

  // Detect intent and simulate tool calls
  if (
    lower.includes('inventory') ||
    lower.includes('stock') ||
    lower.includes('have') ||
    lower.includes('search') ||
    lower.includes('find') ||
    lower.includes('looking for')
  ) {
    // Extract potential search query
    const query = userMessage.replace(/what|do you have|search|find|looking for|inventory|stock|any/gi, '').trim();
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'search_inventory',
      parameters: { query: query || 'retro games', max_results: 5 },
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  if (lower.includes('price') || lower.includes('worth') || lower.includes('value') || lower.includes('market')) {
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'check_market_price',
      parameters: { item_name: userMessage.replace(/price|check|what is|worth|value|market/gi, '').trim() || 'Chrono Trigger' },
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  if (lower.includes('bounty') || lower.includes('wanted') || lower.includes('create bounty')) {
    if (lower.includes('create') || lower.includes('new') || lower.includes('add')) {
      const tc: AIToolCall = {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool_name: 'create_bounty',
        parameters: {
          item_name: 'Stadium Events',
          platform: 'NES',
          base_price: 15000,
          scarcity_mult: 2.5,
        },
        status: 'pending',
        called_at: new Date().toISOString(),
      };
      toolCalls.push(executeToolCall(tc));
    } else {
      const tc: AIToolCall = {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool_name: 'list_bounties',
        parameters: { status: 'ACTIVE' },
        status: 'pending',
        called_at: new Date().toISOString(),
      };
      toolCalls.push(executeToolCall(tc));
    }
  }

  if (lower.includes('order') || lower.includes('orders') || lower.includes('purchases')) {
    if (lower.includes('status') || lower.includes('track')) {
      const tc: AIToolCall = {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool_name: 'get_order_status',
        parameters: { order_id: 'ord-001' },
        status: 'pending',
        called_at: new Date().toISOString(),
      };
      toolCalls.push(executeToolCall(tc));
    } else {
      const tc: AIToolCall = {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool_name: 'list_orders',
        parameters: {},
        status: 'pending',
        called_at: new Date().toISOString(),
      };
      toolCalls.push(executeToolCall(tc));
    }
  }

  if (lower.includes('customer') || lower.includes('who is') || lower.includes('lookup')) {
    const nameMatch = userMessage.match(/(?:customer|who is|lookup)\s+(\w+)/i);
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'lookup_customer',
      parameters: { query: nameMatch ? nameMatch[1] : 'TRON_99' },
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what should')) {
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'get_recommendations',
      parameters: { tags: 'JRPG,RARE', limit: 3 },
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  if (lower.includes('stat') || lower.includes('dashboard') || lower.includes('how is') || lower.includes('performance')) {
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'get_dashboard_stats',
      parameters: {},
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  if (lower.includes('store') || lower.includes('info') || lower.includes('about')) {
    const tc: AIToolCall = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool_name: 'get_store_info',
      parameters: {},
      status: 'pending',
      called_at: new Date().toISOString(),
    };
    toolCalls.push(executeToolCall(tc));
  }

  // Generate natural language response based on tool results
  if (toolCalls.length > 0) {
    const successfulCalls = toolCalls.filter((tc) => tc.status === 'completed');
    const failedCalls = toolCalls.filter((tc) => tc.status === 'failed');

    if (successfulCalls.length > 0) {
      const firstResult = successfulCalls[0];
      const data = JSON.parse(firstResult.result || '{}');

      // Generate contextual response based on tool
      switch (firstResult.tool_name) {
        case 'search_inventory':
          if (data.found === 0) {
            responseContent = `🔍 I searched the inventory but didn't find any items matching your query. Want to try a different search or create a bounty to source what you're looking for?`;
          } else {
            const items = data.items.slice(0, 3).map((i: any) =>
              `- **${i.name}** (${i.platform}) — $${i.price} | ${i.stock} in stock${i.is_legendary ? ' ⭐ LEGENDARY' : ''}${i.price_spike ? ' ⚠️ PRICE SPIKE' : ''}`
            ).join('\n');
            responseContent = `📦 Found **${data.found}** items:\n\n${items}\n\n${data.found > 3 ? `...and ${data.found - 3} more. Want me to narrow the search?` : 'Want details on any of these?'}`;
          }
          break;

        case 'list_bounties':
          if (data.found === 0) {
            responseContent = `📜 No active bounties right now. This is a good time to create some! What items are you looking to stock?`;
          } else {
            const bounties = data.bounties.slice(0, 3).map((b: any) =>
              `- **${b.item}** (${b.platform}) — $${b.bounty_value} store credit | Status: ${b.status}`
            ).join('\n');
            responseContent = `📜 **${data.found} Active Bounties:**\n\n${bounties}\n\nWant to create a new bounty or check fulfillment status?`;
          }
          break;

        case 'create_bounty':
          responseContent = data.message || `✅ Bounty created for ${data.bounty?.target_item_name}. Store credit value: $${data.bounty?.store_credit_value}.`;
          break;

        case 'check_market_price':
          responseContent = `💰 **${data.item_name}** (${data.platform})\n- Market Price: **$${data.market_price}**\n- Trend: ${data.trend_emoji} ${data.trend}\n- Confidence: ${(data.confidence * 100).toFixed(0)}%\n\n${data.note}`;
          break;

        case 'get_dashboard_stats':
          responseContent = `📊 **Store Dashboard**\n- 💰 Revenue: $${data.goldFarmed?.toLocaleString()}\n- ⭐ Legendary Items: ${data.legendaryDrops}\n- 📜 Active Bounties: ${data.activeBounties}\n- 🏟️ Active Lobbies: ${data.activeLobbies}\n- ⚠️ Price Spikes: ${data.priceSpikeAlerts}\n\n${data.status}`;
          break;

        case 'get_store_info':
          responseContent = `🏪 **${data.store_name}**\n_"${data.tagline}"_\n\n📦 ${data.inventory_count} items in inventory\n📜 ${data.active_bounties} active bounties\n⭐ ${data.legendary_items} legendary items\n🎮 Platforms: ${data.platform_coverage?.join(', ')}\n\nFactions:\n- 🔵 SEGA: ${data.factions?.SEGA_SYNDICATE} members\n- 🔴 Nintendo: ${data.factions?.NINTENDO_NOMADS} members\n- 🟢 Sony: ${data.factions?.SONY_SENTINELS} members`;
          break;

        case 'get_recommendations':
          if (data.recommendations?.length > 0) {
            const recs = data.recommendations.slice(0, 3).map((r: any) =>
              `- **${r.name}** (${r.platform}) — $${r.price}${r.is_legendary ? ' ⭐' : ''} | Match: ${r.match_score}`
            ).join('\n');
            responseContent = `🎯 **Recommended for you:**\n\n${recs}\n\nBased on: ${data.based_on?.join(', ')}`;
          } else {
            responseContent = `🤔 I couldn't find specific recommendations. Try browsing our inventory or tell me what genres you're into!`;
          }
          break;

        case 'list_orders':
          if (data.found === 0) {
            responseContent = `📋 No recent orders found. Let's get some sales going!`;
          } else {
            const orders = data.orders.slice(0, 5).map((o: any) =>
              `- **${o.id}** — ${o.items} items, $${o.total} | ${o.status} | ${o.created?.slice(0, 10)}`
            ).join('\n');
            responseContent = `📋 **${data.found} Recent Orders:**\n\n${orders}`;
          }
          break;

        case 'get_order_status':
          if (data.error) {
            responseContent = `❌ ${data.error}`;
          } else {
            responseContent = `📦 **Order ${data.id}**\n- Status: ${data.status}\n- Payment: ${data.payment_method} (${data.payment_status})\n- Items: ${data.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}\n- Total: $${data.total}\n- Created: ${data.created?.slice(0, 10)}`;
          }
          break;

        case 'lookup_customer':
          if (data.error) {
            responseContent = `🔍 ${data.error}. Try searching by gamer tag (e.g., TRON_99, PIXEL_QUEEN).`;
          } else {
            responseContent = `👤 **${data.display_name}**\n- Faction: ${data.faction}\n- Level: ${data.level_tier} (${data.xp_points} XP)\n- Total Spend: $${data.total_spend}\n- Interests: ${data.purchase_tags?.join(', ')}`;
          }
          break;

        default:
          responseContent = `✅ I've gathered the data you requested. ${JSON.stringify(data).slice(0, 200)}...`;
      }
    } else if (failedCalls.length > 0) {
      responseContent = `❌ I ran into an issue: ${failedCalls[0].error}. Let me try a different approach. What would you like to know?`;
    }
  } else {
    // General chat — no tool needed
    responseContent = generateGeneralResponse(userMessage, mode);
  }

  const message: AgentMessage = {
    id: `amsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'assistant',
    content: responseContent,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    timestamp: new Date().toISOString(),
  };

  return { message, toolCalls };
}

function generateGeneralResponse(userMessage: string, mode: 'merchant' | 'customer'): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return mode === 'merchant'
      ? `👋 Welcome back to your command center! I'm your AI shopkeeper assistant. I can help you:\n\n🔍 **Search inventory** — "What RPGs do we have?"\n💰 **Check prices** — "What's EarthBound worth?"\n📜 **Manage bounties** — "Create a bounty for Stadium Events"\n📊 **Check stats** — "How's the store doing?"\n👤 **Look up customers** — "Who is TRON_99?"\n\nWhat would you like to do?`
      : `👋 Welcome to Time Warp Gaming! I'm your AI shopkeeper. Ask me about our inventory, prices, or recommendations. How can I help you find your next retro treasure?`;
  }

  if (lower.includes('help')) {
    return `🤖 **I can help you with:**\n\n🔍 Search inventory — "Search for JRPGs on SNES"\n💰 Market prices — "Check price for Chrono Trigger"\n📜 Bounties — "Show active bounties"\n📊 Store stats — "How's the store performing?"\n🎯 Recommendations — "Recommend some rare items"\n👤 Customer lookup — "Find customer TRON_99"\n\nJust ask naturally — I'll figure out what tools to use!`;
  }

  return `🤔 I'm not sure what you need. Try asking about inventory, prices, bounties, or store stats. Type "help" to see what I can do!`;
}

export async function runAgentLoop(
  userMessage: string,
  history: AgentMessage[],
  mode: 'merchant' | 'customer',
  useAI: boolean = false
): Promise<AgentResponse> {
  // In demo mode (or when no AI key), use mock agent
  if (!useAI) {
    // Simulate processing delay for realism
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));
    return generateMockResponse(userMessage, history, mode);
  }

  // Production: call NVIDIA NIM with tool definitions
  // Build messages array with system prompt + history + new message
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-r1',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`NIM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse tool calls from the response
    const toolCalls = detectToolCalls(content);

    // Execute any tool calls
    const executedCalls = toolCalls.map((tc) => executeToolCall(tc));

    // Clean up tool call syntax from response for display
    const cleanContent = content.replace(/TOOL_CALL:\s*\{[^}]+\}/g, '').trim();

    const message: AgentMessage = {
      id: `amsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content: cleanContent || 'I processed your request using my available tools.',
      tool_calls: executedCalls.length > 0 ? executedCalls : undefined,
      timestamp: new Date().toISOString(),
    };

    return { message, toolCalls: executedCalls };
  } catch (error) {
    console.error('[Agent Loop] AI call failed, falling back to mock:', error);
    return generateMockResponse(userMessage, history, mode);
  }
}
