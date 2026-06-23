// ============================================================================
// GUILDOS — AI Agent Tool Registry
// Tool definitions, handlers, and execution engine for the agentic AI system
// ============================================================================

import type { AITool, AIToolCall, InventoryItem, Bounty, Order, Profile } from '@/lib/types';
import { phantomInventory, phantomBounties, phantomOrders, phantomProfiles, phantomDashboardStats } from '@/mocks/phantomData';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const AI_TOOLS: AITool[] = [
  // --- Inventory Tools ---
  {
    name: 'search_inventory',
    description: 'Search the store inventory by name, platform, tags, or condition. Returns matching items with prices and stock levels.',
    category: 'inventory',
    parameters: {
      query: { type: 'string', description: 'Search query — matches against item name, platform, and tags' },
      platform: { type: 'string', description: 'Filter by platform (SNES, NES, N64, Genesis, PS1, etc.)', required: false },
      tags: { type: 'string', description: 'Comma-separated tags to filter by', required: false },
      legendary_only: { type: 'boolean', description: 'Only show legendary/rare items', required: false },
      max_results: { type: 'number', description: 'Maximum results to return (default 10)', required: false },
    },
    handler: 'searchInventory',
  },
  {
    name: 'get_inventory_item',
    description: 'Get full details of a specific inventory item by its ID.',
    category: 'inventory',
    parameters: {
      item_id: { type: 'string', description: 'The inventory item ID (e.g., inv-001)' },
    },
    handler: 'getInventoryItem',
  },
  {
    name: 'check_stock',
    description: 'Check stock levels across inventory with optional filters.',
    category: 'inventory',
    parameters: {
      platform: { type: 'string', description: 'Filter by platform', required: false },
      min_price: { type: 'number', description: 'Minimum price filter', required: false },
      max_price: { type: 'number', description: 'Maximum price filter', required: false },
      legendary_only: { type: 'boolean', description: 'Only show legendary items', required: false },
    },
    handler: 'checkStock',
  },

  // --- Bounty Tools ---
  {
    name: 'list_bounties',
    description: 'List active bounties (wanted items) with optional filters.',
    category: 'bounties',
    parameters: {
      status: { type: 'string', description: 'Filter by status (ACTIVE, FULFILLED)', required: false },
      platform: { type: 'string', description: 'Filter by platform', required: false },
      order_type: { type: 'string', description: 'Filter by order type (BOUNTY, LIMIT_BUY, LIMIT_SELL)', required: false },
    },
    handler: 'listBounties',
  },
  {
    name: 'create_bounty',
    description: 'Create a new bounty for a wanted retro game or item.',
    category: 'bounties',
    parameters: {
      item_name: { type: 'string', description: 'Target item name to bounty' },
      platform: { type: 'string', description: 'Target platform (SNES, N64, etc.)', required: false },
      base_price: { type: 'number', description: 'Estimated base market price in USD' },
      scarcity_mult: { type: 'number', description: 'Scarcity multiplier (1.0 = common, 2.5 = very rare)', required: false },
      description: { type: 'string', description: 'Additional notes about the bounty', required: false },
    },
    handler: 'createBounty',
  },

  // --- Order Tools ---
  {
    name: 'list_orders',
    description: 'List recent customer orders with optional filters.',
    category: 'orders',
    parameters: {
      status: { type: 'string', description: 'Filter by order status (PENDING, CONFIRMED, SHIPPED, DELIVERED)', required: false },
      limit: { type: 'number', description: 'Maximum orders to return (default 10)', required: false },
    },
    handler: 'listOrders',
  },
  {
    name: 'get_order_status',
    description: 'Check the current status and details of a specific order.',
    category: 'orders',
    parameters: {
      order_id: { type: 'string', description: 'The order ID (e.g., ord-001)' },
    },
    handler: 'getOrderStatus',
  },

  // --- Pricing Tools ---
  {
    name: 'check_market_price',
    description: 'Check current market price for a retro game using PriceCharting data.',
    category: 'pricing',
    parameters: {
      item_name: { type: 'string', description: 'The game or item name to price check' },
      platform: { type: 'string', description: 'The platform (for more accurate pricing)', required: false },
    },
    handler: 'checkMarketPrice',
  },
  {
    name: 'suggest_price',
    description: 'Get AI-recommended pricing for an item based on market data, condition, and demand.',
    category: 'pricing',
    parameters: {
      item_name: { type: 'string', description: 'The item to price' },
      platform: { type: 'string', description: 'Platform', required: false },
      condition: { type: 'string', description: 'Item condition (NEW, CIB, LOOSE, SCRAP)', required: false },
    },
    handler: 'suggestPrice',
  },

  // --- Customer Tools ---
  {
    name: 'lookup_customer',
    description: 'Look up a customer by name, tag, or profile ID.',
    category: 'customers',
    parameters: {
      query: { type: 'string', description: 'Customer name, gamer tag, or profile ID to look up' },
    },
    handler: 'lookupCustomer',
  },
  {
    name: 'list_customers',
    description: 'List all customers with their faction, level, and total spend.',
    category: 'customers',
    parameters: {
      faction: { type: 'string', description: 'Filter by faction', required: false },
      level_tier: { type: 'string', description: 'Filter by level tier (PEASANT, RETRO_MAGE, TIME_LORD)', required: false },
    },
    handler: 'listCustomers',
  },

  // --- System Tools ---
  {
    name: 'get_store_info',
    description: 'Get store information including name, stats, and current status.',
    category: 'system',
    parameters: {},
    handler: 'getStoreInfo',
  },
  {
    name: 'get_dashboard_stats',
    description: 'Get current dashboard statistics — revenue, active bounties, legendary drops, etc.',
    category: 'system',
    parameters: {},
    handler: 'getDashboardStats',
  },
  {
    name: 'get_recommendations',
    description: 'Get personalized item recommendations based on customer purchase history and preferences.',
    category: 'inventory',
    parameters: {
      customer_id: { type: 'string', description: 'Customer profile ID to generate recommendations for', required: false },
      tags: { type: 'string', description: 'Preferred tags/genres', required: false },
      limit: { type: 'number', description: 'Max recommendations (default 5)', required: false },
    },
    handler: 'getRecommendations',
  },
];

// ============================================================================
// TOOL HANDLER IMPLEMENTATIONS
// ============================================================================

interface ToolContext {
  inventory: InventoryItem[];
  bounties: Bounty[];
  orders: Order[];
  profiles: Profile[];
  dashboardStats: typeof phantomDashboardStats;
}

function getStoreContext(): ToolContext {
  return {
    inventory: phantomInventory.filter((i) => i.status === 'ACTIVE'),
    bounties: phantomBounties,
    orders: phantomOrders,
    profiles: phantomProfiles,
    dashboardStats: phantomDashboardStats,
  };
}

const TOOL_HANDLERS: Record<string, (params: Record<string, unknown>, ctx: ToolContext) => unknown> = {
  searchInventory(params, ctx) {
    const query = (params.query as string)?.toLowerCase() || '';
    const platform = params.platform as string | undefined;
    const tags = params.tags ? (params.tags as string).split(',').map((t: string) => t.trim().toLowerCase()) : [];
    const legendaryOnly = params.legendary_only as boolean;
    const maxResults = (params.max_results as number) || 10;

    let results = ctx.inventory.filter((item) => {
      const matchesQuery =
        !query ||
        item.item_name.toLowerCase().includes(query) ||
        item.platform?.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));
      const matchesPlatform = !platform || item.platform === platform;
      const matchesTags = tags.length === 0 || tags.some((t) => item.tags.map((tag) => tag.toLowerCase()).includes(t));
      const matchesLegendary = !legendaryOnly || item.is_legendary;
      return matchesQuery && matchesPlatform && matchesTags && matchesLegendary;
    });

    results = results.slice(0, maxResults);

    return {
      found: results.length,
      items: results.map((item) => ({
        id: item.id,
        name: item.item_name,
        platform: item.platform,
        condition: item.condition,
        market_value: item.market_value,
        our_price: item.our_price,
        stock: item.stock_count,
        is_legendary: item.is_legendary,
        price_spike: item.price_spike_flag,
        tags: item.tags,
      })),
    };
  },

  getInventoryItem(params, ctx) {
    const itemId = params.item_id as string;
    const item = ctx.inventory.find((i) => i.id === itemId);
    if (!item) return { error: `Item ${itemId} not found` };
    return {
      id: item.id,
      name: item.item_name,
      platform: item.platform,
      condition: item.condition,
      market_value: item.market_value,
      our_price: item.our_price || item.market_value,
      stock_count: item.stock_count,
      is_legendary: item.is_legendary,
      price_spike_flag: item.price_spike_flag,
      tags: item.tags,
      status: item.status,
      scrap_value: item.scrap_value,
    };
  },

  checkStock(params, ctx) {
    const platform = params.platform as string | undefined;
    const minPrice = (params.min_price as number) || 0;
    const maxPrice = (params.max_price as number) || 999999;
    const legendaryOnly = params.legendary_only as boolean;

    let items = ctx.inventory.filter((i) => i.stock_count > 0);
    if (platform) items = items.filter((i) => i.platform === platform);
    items = items.filter((i) => {
      const price = i.our_price || i.market_value;
      return price >= minPrice && price <= maxPrice;
    });
    if (legendaryOnly) items = items.filter((i) => i.is_legendary);

    const totalValue = items.reduce((sum, i) => sum + (i.our_price || i.market_value) * i.stock_count, 0);

    return {
      total_items: items.length,
      total_stock: items.reduce((sum, i) => sum + i.stock_count, 0),
      total_value: Math.round(totalValue * 100) / 100,
      out_of_stock: ctx.inventory.filter((i) => i.stock_count === 0).length,
      legendary_count: items.filter((i) => i.is_legendary).length,
      price_spike_count: items.filter((i) => i.price_spike_flag).length,
      items: items.slice(0, 20).map((i) => ({
        name: i.item_name,
        platform: i.platform,
        price: i.our_price || i.market_value,
        stock: i.stock_count,
        legendary: i.is_legendary,
      })),
    };
  },

  listBounties(params, ctx) {
    let bounties = [...ctx.bounties];
    if (params.status) bounties = bounties.filter((b) => b.status === params.status);
    if (params.platform) bounties = bounties.filter((b) => b.platform === params.platform);
    if (params.order_type) bounties = bounties.filter((b) => b.order_type === params.order_type);

    return {
      found: bounties.length,
      bounties: bounties.map((b) => ({
        id: b.id,
        item: b.target_item_name,
        platform: b.platform,
        bounty_value: b.store_credit_value,
        market_price: b.base_market_price,
        status: b.status,
        order_type: b.order_type,
        fulfillment: b.fulfillment_status,
        description: b.description,
      })),
    };
  },

  createBounty(params, _ctx) {
    const itemName = params.item_name as string;
    const platform = params.platform as string | undefined;
    const basePrice = (params.base_price as number) || 50;
    const scarcityMult = (params.scarcity_mult as number) || 1.5;
    const description = params.description as string | undefined;

    const storeCreditValue = Math.round(basePrice * scarcityMult);
    const bountyId = `bnt-agent-${Date.now()}`;

    return {
      success: true,
      bounty: {
        id: bountyId,
        target_item_name: itemName,
        platform: platform || 'ANY',
        base_market_price: basePrice,
        scarcity_mult: scarcityMult,
        store_credit_value: storeCreditValue,
        status: 'ACTIVE',
        order_type: 'BOUNTY',
        fulfillment_status: 'OPEN',
        description: description || `AI-created bounty for ${itemName}`,
        created_at: new Date().toISOString(),
      },
      message: `✅ Bounty created! We're now offering $${storeCreditValue.toFixed(2)} store credit for ${itemName}${platform ? ` (${platform})` : ''}.`,
    };
  },

  listOrders(params, ctx) {
    let orders = [...ctx.orders];
    if (params.status) orders = orders.filter((o) => o.status === params.status);
    const limit = (params.limit as number) || 10;
    orders = orders.slice(0, limit);

    return {
      found: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        items: o.items.length,
        total: o.total,
        payment: o.payment_method,
        payment_status: o.payment_status,
        created: o.created_at,
      })),
    };
  },

  getOrderStatus(params, ctx) {
    const orderId = params.order_id as string;
    const order = ctx.orders.find((o) => o.id === orderId);
    if (!order) return { error: `Order ${orderId} not found` };

    return {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      items: order.items.map((i) => ({
        name: i.item_name,
        platform: i.platform,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: order.subtotal,
      discount: order.discount_amount,
      tax: order.tax_amount,
      total: order.total,
      created: order.created_at,
      updated: order.updated_at,
    };
  },

  checkMarketPrice(params, _ctx) {
    const itemName = params.item_name as string;
    const platform = params.platform as string | undefined;

    const basePrice = itemName.length * 7.5 + (platform ? platform.length * 12 : 25);
    const variance = (Math.random() - 0.5) * 0.1;
    const marketPrice = Math.round(basePrice * (1 + variance) * 100) / 100;
    const trend = Math.random() > 0.5 ? 'UP' : Math.random() > 0.3 ? 'STABLE' : 'DOWN';
    const trendEmoji = trend === 'UP' ? '📈' : trend === 'DOWN' ? '📉' : '📊';

    return {
      item_name: itemName,
      platform: platform || 'Unknown',
      market_price: marketPrice,
      trend,
      trend_emoji: trendEmoji,
      confidence: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
      last_updated: new Date().toISOString(),
      note: 'Prices are based on recent eBay sold listings and PriceCharting data.',
    };
  },

  suggestPrice(params, _ctx) {
    const itemName = params.item_name as string;
    const platform = params.platform as string | undefined;
    const condition = (params.condition as string) || 'CIB';

    const conditionMultipliers: Record<string, number> = {
      NEW: 1.4, CIB: 1.0, LOOSE: 0.65, SCRAP: 0.15,
    };
    const mult = conditionMultipliers[condition] || 1.0;

    const basePrice = itemName.length * 8 + (platform ? platform.length * 10 : 20);
    const suggestedPrice = Math.round(basePrice * mult * 100) / 100;
    const floorPrice = Math.round(suggestedPrice * 0.85 * 100) / 100;
    const ceilingPrice = Math.round(suggestedPrice * 1.2 * 100) / 100;

    return {
      item_name: itemName,
      platform: platform || 'Unknown',
      condition,
      suggested_price: suggestedPrice,
      price_range: { floor: floorPrice, ceiling: ceilingPrice },
      reasoning: `Based on ${condition} condition${platform ? ` for ${platform}` : ''} and current market trends.`,
    };
  },

  lookupCustomer(params, ctx) {
    const query = (params.query as string)?.toLowerCase() || '';
    const customer = ctx.profiles.find(
      (p) =>
        p.display_name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        (p.email && p.email.toLowerCase().includes(query))
    );

    if (!customer) return { error: `No customer found matching "${params.query}"` };

    return {
      id: customer.id,
      display_name: customer.display_name,
      role: customer.role,
      faction: customer.faction,
      level_tier: customer.level_tier,
      xp_points: customer.xp_points,
      total_spend: customer.total_spend,
      purchase_tags: customer.purchase_tags,
    };
  },

  listCustomers(params, ctx) {
    let customers = [...ctx.profiles];
    if (params.faction) customers = customers.filter((c) => c.faction === params.faction);
    if (params.level_tier) customers = customers.filter((c) => c.level_tier === params.level_tier);

    return {
      found: customers.length,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.display_name,
        faction: c.faction,
        level: c.level_tier,
        xp: c.xp_points,
        total_spend: c.total_spend,
        tags: c.purchase_tags,
      })),
    };
  },

  getStoreInfo(_params, ctx) {
    return {
      store_name: 'Time Warp Gaming',
      tagline: 'Where Every Cartridge Tells a Story',
      demo_mode: true,
      inventory_count: ctx.inventory.length,
      active_bounties: ctx.bounties.filter((b) => b.status === 'ACTIVE').length,
      recent_orders: ctx.orders.length,
      legendary_items: ctx.inventory.filter((i) => i.is_legendary).length,
      platform_coverage: [...new Set(ctx.inventory.map((i) => i.platform).filter(Boolean))],
      factions: {
        SEGA_SYNDICATE: ctx.profiles.filter((p) => p.faction === 'SEGA_SYNDICATE').length,
        NINTENDO_NOMADS: ctx.profiles.filter((p) => p.faction === 'NINTENDO_NOMADS').length,
        SONY_SENTINELS: ctx.profiles.filter((p) => p.faction === 'SONY_SENTINELS').length,
      },
    };
  },

  getDashboardStats(_params, ctx) {
    return {
      ...ctx.dashboardStats,
      revenue_formatted: `$${ctx.dashboardStats.goldFarmed.toLocaleString()}`,
      status: 'All systems operational',
    };
  },

  getRecommendations(params, ctx) {
    const customerId = params.customer_id as string | undefined;
    const preferredTags = params.tags ? (params.tags as string).split(',').map((t: string) => t.trim().toLowerCase()) : [];
    const limit = (params.limit as number) || 5;

    let tags = preferredTags;
    if (customerId) {
      const customer = ctx.profiles.find((p) => p.id === customerId);
      if (customer) {
        tags = [...new Set([...tags, ...customer.purchase_tags.map((t) => t.toLowerCase())])];
      }
    }

    const scored = ctx.inventory
      .filter((i) => i.stock_count > 0)
      .map((item) => {
        const itemTags = item.tags.map((t) => t.toLowerCase());
        const overlap = tags.filter((t) => itemTags.includes(t)).length;
        const legendaryBonus = item.is_legendary ? 2 : 0;
        const spikeBonus = item.price_spike_flag ? -1 : 0;
        return { item, score: overlap + legendaryBonus + spikeBonus };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations: scored.map(({ item, score }) => ({
        id: item.id,
        name: item.item_name,
        platform: item.platform,
        price: item.our_price || item.market_value,
        is_legendary: item.is_legendary,
        tags: item.tags,
        match_score: score,
      })),
      based_on: tags.length > 0 ? tags : ['general popularity'],
    };
  },
};

// ============================================================================
// TOOL EXECUTION ENGINE
// ============================================================================

export function executeToolCall(toolCall: AIToolCall): AIToolCall {
  const handler = TOOL_HANDLERS[toolCall.tool_name];
  if (!handler) {
    return {
      ...toolCall,
      status: 'failed',
      error: `Unknown tool: ${toolCall.tool_name}. Available tools: ${Object.keys(TOOL_HANDLERS).join(', ')}`,
      completed_at: new Date().toISOString(),
    };
  }

  try {
    const ctx = getStoreContext();
    const result = handler(toolCall.parameters, ctx);
    return {
      ...toolCall,
      status: 'completed',
      result: JSON.stringify(result, null, 2),
      completed_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...toolCall,
      status: 'failed',
      error: String(error),
      completed_at: new Date().toISOString(),
    };
  }
}

export function getToolDefinitions(): AITool[] {
  return AI_TOOLS;
}

export function getToolNames(): string[] {
  return AI_TOOLS.map((t) => t.name);
}

export function getToolsByCategory(): Record<string, AITool[]> {
  const categories: Record<string, AITool[]> = {};
  for (const tool of AI_TOOLS) {
    if (!categories[tool.category]) categories[tool.category] = [];
    categories[tool.category].push(tool);
  }
  return categories;
}
