// ============================================================================
// GUILDOS — Phantom (Demo) Data
// Complete mock dataset for development and investor demos
// ============================================================================

import type {
  InventoryItem,
  Bounty,
  ScoreboardEntry,
  NexusLfg,
  FactionStanding,
  DashboardStats,
  ActivityEvent,
  Profile,
  Notification,
  SaveRoom,
} from '@/lib/types';

const DEMO_ORG_ID = 'demo-time-warp-001';
const NOW = new Date().toISOString();

// --- INVENTORY ---
export const phantomInventory: InventoryItem[] = [
  {
    id: 'inv-001', organization_id: DEMO_ORG_ID, item_name: 'EarthBound',
    platform: 'SNES', condition: 'CIB', market_value: 350.00, our_price: 379.99,
    scrap_value: 0, stock_count: 1, is_legendary: true, price_spike_flag: false,
    tags: ['JRPG', 'RARE', 'GRAIL'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-002', organization_id: DEMO_ORG_ID, item_name: 'Chrono Trigger',
    platform: 'SNES', condition: 'LOOSE', market_value: 185.00, our_price: 199.99,
    scrap_value: 0, stock_count: 1, is_legendary: true, price_spike_flag: true,
    tags: ['JRPG', 'RARE'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-003', organization_id: DEMO_ORG_ID, item_name: 'Super Mario RPG',
    platform: 'SNES', condition: 'LOOSE', market_value: 85.00, our_price: 89.99,
    scrap_value: 0, stock_count: 2, is_legendary: false, price_spike_flag: false,
    tags: ['JRPG', 'PLATFORMER'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-004', organization_id: DEMO_ORG_ID, item_name: 'Sonic the Hedgehog 2',
    platform: 'GENESIS', condition: 'CIB', market_value: 25.00, our_price: 29.99,
    scrap_value: 0, stock_count: 3, is_legendary: false, price_spike_flag: false,
    tags: ['PLATFORMER', 'SEGA'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-005', organization_id: DEMO_ORG_ID, item_name: 'Chrono Cross',
    platform: 'PS1', condition: 'CIB', market_value: 45.00, our_price: 49.99,
    scrap_value: 0, stock_count: 1, is_legendary: false, price_spike_flag: false,
    tags: ['JRPG'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-006', organization_id: DEMO_ORG_ID, item_name: 'Panzer Dragoon Saga',
    platform: 'SATURN', condition: 'CIB', market_value: 850.00, our_price: 899.99,
    scrap_value: 0, stock_count: 1, is_legendary: true, price_spike_flag: true,
    tags: ['JRPG', 'RARE', 'GRAIL', 'SEGA'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-007', organization_id: DEMO_ORG_ID, item_name: 'Nintendo 64 Console',
    platform: 'N64', condition: 'LOOSE', market_value: 75.00, our_price: 84.99,
    scrap_value: 15.00, stock_count: 2, is_legendary: false, price_spike_flag: false,
    tags: ['HARDWARE', 'NINTENDO'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-008', organization_id: DEMO_ORG_ID, item_name: 'Sega Dreamcast Console',
    platform: 'DREAMCAST', condition: 'SCRAP', market_value: 40.00, our_price: 0,
    scrap_value: 22.00, stock_count: 1, is_legendary: false, price_spike_flag: false,
    tags: ['HARDWARE', 'SEGA', 'HARVESTABLE'], status: 'SCRAP', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-009', organization_id: DEMO_ORG_ID, item_name: 'The Legend of Zelda: Ocarina of Time',
    platform: 'N64', condition: 'CIB', market_value: 95.00, our_price: 99.99,
    scrap_value: 0, stock_count: 0, is_legendary: false, price_spike_flag: false,
    tags: ['ACTION', 'ADVENTURE', 'NINTENDO'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'inv-010', organization_id: DEMO_ORG_ID, item_name: 'Metal Gear Solid',
    platform: 'PS1', condition: 'CIB', market_value: 35.00, our_price: 39.99,
    scrap_value: 0, stock_count: 1, is_legendary: false, price_spike_flag: false,
    tags: ['STEALTH', 'ACTION'], status: 'ACTIVE', created_at: NOW, updated_at: NOW,
  },
];

// --- BOUNTIES ---
export const phantomBounties: Bounty[] = [
  {
    id: 'bnt-001', organization_id: DEMO_ORG_ID, target_item_name: 'Stadium Events',
    platform: 'NES', base_market_price: 15000.00, scarcity_mult: 2.50,
    store_credit_value: 37500.00, status: 'ACTIVE', description: 'The holy grail. Any condition.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-002', organization_id: DEMO_ORG_ID, target_item_name: 'Mega Man X3',
    platform: 'SNES', base_market_price: 250.00, scarcity_mult: 1.50,
    store_credit_value: 375.00, status: 'ACTIVE', description: 'CIB preferred. Will accept loose.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-003', organization_id: DEMO_ORG_ID, target_item_name: 'Suikoden II',
    platform: 'PS1', base_market_price: 180.00, scarcity_mult: 1.75,
    store_credit_value: 315.00, status: 'ACTIVE', description: 'Customers keep asking for this one.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-004', organization_id: DEMO_ORG_ID, target_item_name: 'PowerStone 2',
    platform: 'DREAMCAST', base_market_price: 120.00, scarcity_mult: 1.25,
    store_credit_value: 150.00, status: 'FULFILLED', fulfilled_at: NOW,
    description: 'For the arcade cabinet tournament.', created_at: NOW, updated_at: NOW,
  },
];

// --- SCOREBOARDS ---
export const phantomScoreboards: ScoreboardEntry[] = [
  { id: 'scr-001', organization_id: DEMO_ORG_ID, cabinet_name: 'Cabinet A', game_title: 'PAC-MAN', player_tag: 'TRON_99', score: 1245500, rank: 1, status: 'ACTIVE', logged_at: '2026-06-12T14:30:00Z', created_at: NOW },
  { id: 'scr-002', organization_id: DEMO_ORG_ID, cabinet_name: 'Cabinet A', game_title: 'PAC-MAN', player_tag: 'NEO_GEO', score: 1120000, rank: 2, status: 'ACTIVE', logged_at: '2026-06-20T10:15:00Z', created_at: NOW },
  { id: 'scr-003', organization_id: DEMO_ORG_ID, cabinet_name: 'Cabinet A', game_title: 'PAC-MAN', player_tag: 'PIXEL_QUEEN', score: 985000, rank: 3, status: 'ACTIVE', logged_at: '2026-06-18T16:45:00Z', created_at: NOW },
  { id: 'scr-004', organization_id: DEMO_ORG_ID, cabinet_name: 'Cabinet B', game_title: 'GALAGA', player_tag: 'ARCADE_FURY', score: 890200, rank: 1, status: 'ACTIVE', logged_at: '2026-06-15T11:00:00Z', created_at: NOW },
  { id: 'scr-005', organization_id: DEMO_ORG_ID, cabinet_name: 'Cabinet B', game_title: 'GALAGA', player_tag: 'TRON_99', score: 756000, rank: 2, status: 'ACTIVE', logged_at: '2026-06-19T09:30:00Z', created_at: NOW },
];

// --- LFG LOBBIES ---
export const phantomLfgs: NexusLfg[] = [
  {
    id: 'lfg-001', organization_id: DEMO_ORG_ID, creator_id: 'usr-001',
    game_title: 'GoldenEye 007', description: 'License to Kill, Pistols Only. No Oddjob.',
    console_type: 'N64', player_slots_total: 4, player_slots_filled: 2,
    max_spectators: 4, start_time: '2026-06-22T19:00:00Z', lobby_status: 'OPEN', created_at: NOW,
  },
  {
    id: 'lfg-002', organization_id: DEMO_ORG_ID, creator_id: 'usr-002',
    game_title: 'Super Smash Bros. Melee', description: 'Tournament bracket. All skill levels welcome.',
    console_type: 'GAMECUBE', player_slots_total: 8, player_slots_filled: 5,
    max_spectators: 10, start_time: '2026-06-23T14:00:00Z', lobby_status: 'OPEN', created_at: NOW,
  },
  {
    id: 'lfg-003', organization_id: DEMO_ORG_ID, creator_id: 'usr-003',
    game_title: 'Street Fighter III: 3rd Strike', description: 'Casuals. CRT only.',
    console_type: 'DREAMCAST', player_slots_total: 2, player_slots_filled: 2,
    max_spectators: 6, start_time: '2026-06-21T20:00:00Z', lobby_status: 'IN_PROGRESS', created_at: NOW,
  },
];

// --- FACTION STANDINGS ---
export const phantomFactionStandings: FactionStanding[] = [
  { id: 'fs-001', organization_id: DEMO_ORG_ID, month: 6, year: 2026, faction: 'NINTENDO_NOMADS', total_points: 4250.00, is_winner: false, discount_active: false, created_at: NOW },
  { id: 'fs-002', organization_id: DEMO_ORG_ID, month: 6, year: 2026, faction: 'SEGA_SYNDICATE', total_points: 3820.00, is_winner: false, discount_active: false, created_at: NOW },
  { id: 'fs-003', organization_id: DEMO_ORG_ID, month: 6, year: 2026, faction: 'SONY_SENTINELS', total_points: 5100.00, is_winner: true, discount_active: true, created_at: NOW },
];

// --- DASHBOARD STATS ---
export const phantomDashboardStats: DashboardStats = {
  goldFarmed: 12450,
  legendaryDrops: 3,
  lootDepleted: 1,
  activeBounties: 3,
  priceSpikeAlerts: 2,
  activeLobbies: 2,
};

// --- ACTIVITY FEED ---
export const phantomActivity: ActivityEvent[] = [
  { id: 'act-001', type: 'GRAIL', title: 'LEGENDARY DROP', description: 'Panzer Dragoon Saga scanned at $850.00', value: 850.00, timestamp: '2026-06-21T14:22:00Z' },
  { id: 'act-002', type: 'SCAN', title: 'Item Scanned', description: 'Metal Gear Solid (PS1) added to inventory', value: 35.00, timestamp: '2026-06-21T13:45:00Z' },
  { id: 'act-003', type: 'BOUNTY', title: 'Bounty Fulfilled', description: 'PowerStone 2 brought in by NEO_GEO', value: 150.00, timestamp: '2026-06-21T12:10:00Z' },
  { id: 'act-004', type: 'SALE', title: 'Sale Completed', description: 'Sonic 2 (Genesis) sold for $29.99', value: 29.99, timestamp: '2026-06-21T11:30:00Z' },
  { id: 'act-005', type: 'SCORE', title: 'Score Logged', description: 'TRON_99 posted 1,245,500 on PAC-MAN', timestamp: '2026-06-21T10:15:00Z' },
  { id: 'act-006', type: 'TRADE_IN', title: 'Trade-In', description: 'N64 Console (Loose) traded in at $75.00', value: 75.00, timestamp: '2026-06-21T09:00:00Z' },
];

// --- DEMO PROFILES ---
export const phantomProfiles: Profile[] = [
  {
    id: 'usr-001', organization_id: DEMO_ORG_ID, display_name: 'TRON_99',
    role: 'customer', faction: 'SEGA_SYNDICATE', xp_points: 12500,
    level_tier: 'RETRO_MAGE', purchase_tags: ['JRPG', 'SEGA', 'ARCADE'],
    total_spend: 1250.00, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'usr-002', organization_id: DEMO_ORG_ID, display_name: 'PIXEL_QUEEN',
    role: 'customer', faction: 'NINTENDO_NOMADS', xp_points: 28000,
    level_tier: 'TIME_LORD', purchase_tags: ['PLATFORMER', 'NINTENDO', 'ACTION'],
    total_spend: 2800.00, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'usr-003', organization_id: DEMO_ORG_ID, display_name: 'NEO_GEO',
    role: 'customer', faction: 'SONY_SENTINELS', xp_points: 3200,
    level_tier: 'PEASANT', purchase_tags: ['FIGHTING', 'ARCADE'],
    total_spend: 320.00, created_at: NOW, updated_at: NOW,
  },
];

// --- SAVE ROOMS ---
export const phantomSaveRooms: SaveRoom[] = [
  {
    id: 'room-001', organization_id: DEMO_ORG_ID, room_name: 'Save Room Alpha',
    description: 'Cozy 2-player setup with CRT display and premium couch. Perfect for co-op classics.',
    monthly_rate: 15.00, capacity: 2, amenities: ['CRT_DISPLAY', 'COUCH', 'PREMIUM_WIFI'],
    subscriber_id: 'usr-001', stripe_subscription_id: 'sub_demo_001',
    status: 'OCCUPIED', created_at: NOW,
  },
  {
    id: 'room-002', organization_id: DEMO_ORG_ID, room_name: 'Save Room Beta',
    description: '4-player tournament room with dual CRTs, bean bags, and streaming rig.',
    monthly_rate: 35.00, capacity: 4, amenities: ['DUAL_CRTS', 'TOURNAMENT_SETUP', 'STREAMING_RIG', 'PREMIUM_WIFI'],
    status: 'AVAILABLE', created_at: NOW,
  },
  {
    id: 'room-003', organization_id: DEMO_ORG_ID, room_name: 'Save Room Omega',
    description: 'Premium 8-player LAN setup with 4K displays and surround sound.',
    monthly_rate: 50.00, capacity: 8, amenities: ['4K_DISPLAY', 'SURROUND_SOUND', 'LAN_NETWORK', 'PREMIUM_WIFI', 'STREAMING_RIG'],
    subscriber_id: 'usr-002', stripe_subscription_id: 'sub_demo_003',
    qr_code_hash: 'sha256:demo-qr-hash-omega',
    status: 'RESERVED', created_at: NOW,
  },
];

// --- NOTIFICATIONS ---
export const phantomNotifications: Notification[] = [
  { id: 'not-001', organization_id: DEMO_ORG_ID, user_id: 'usr-001', type: 'PRICE_SPIKE', title: 'PRICE SPIKE: Chrono Trigger', message: 'Market value spiked 22% — adjust sticker price.', metadata: { item_id: 'inv-002', spike_pct: 22 }, created_at: NOW },
  { id: 'not-002', organization_id: DEMO_ORG_ID, user_id: 'usr-001', type: 'GRAIL_DROP', title: 'LEGENDARY ACQUIRED', message: 'Panzer Dragoon Saga scanned at $850.00. IoT triggers fired.', metadata: { item_id: 'inv-006' }, created_at: NOW },
  { id: 'not-003', organization_id: DEMO_ORG_ID, user_id: 'usr-001', type: 'BOUNTY_FULFILLED', title: 'Bounty Complete', message: 'PowerStone 2 has been brought to the counter by NEO_GEO.', metadata: { bounty_id: 'bnt-004' }, created_at: NOW },
];
