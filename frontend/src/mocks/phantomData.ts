// ============================================================================
// GUILDOS — Phantom (Demo) Data
// Complete mock dataset for development and investor demos
// ============================================================================

import type {
  InventoryItem,
  Bounty,
  ScoreboardEntry,
  NexusLfg,
  NexusLfgParticipant,
  FactionStanding,
  DashboardStats,
  ActivityEvent,
  Profile,
  Notification,
  SaveRoom,
  ArbitrageMatch,
  BountyStats,
  VitalityQuest,
  Station,
  StationBooking,
  Wallet,
  WalletTransaction,
  PotionMenuItem,
  PotionOrder,
  XPTransaction,
  Order,
  Cart,
  POSSession,
  POSTransaction,
  AgentMessage,
  AgentSession,
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
    store_credit_value: 37500.00, status: 'ACTIVE', order_type: 'BOUNTY',
    fulfillment_status: 'OPEN', trigger_price: undefined,
    description: 'The holy grail. Any condition.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-002', organization_id: DEMO_ORG_ID, target_item_name: 'Mega Man X3',
    platform: 'SNES', base_market_price: 250.00, scarcity_mult: 1.50,
    store_credit_value: 375.00, status: 'ACTIVE', order_type: 'BOUNTY',
    fulfillment_status: 'OPEN', trigger_price: undefined,
    description: 'CIB preferred. Will accept loose.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-003', organization_id: DEMO_ORG_ID, target_item_name: 'Suikoden II',
    platform: 'PS1', base_market_price: 180.00, scarcity_mult: 1.75,
    store_credit_value: 315.00, status: 'ACTIVE', order_type: 'BOUNTY',
    fulfillment_status: 'OPEN', trigger_price: undefined,
    description: 'Customers keep asking for this one.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-004', organization_id: DEMO_ORG_ID, target_item_name: 'PowerStone 2',
    platform: 'DREAMCAST', base_market_price: 120.00, scarcity_mult: 1.25,
    store_credit_value: 150.00, status: 'FULFILLED', order_type: 'BOUNTY',
    fulfillment_status: 'PAID', trigger_price: undefined, fulfilled_at: NOW,
    description: 'For the arcade cabinet tournament.', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-005', organization_id: DEMO_ORG_ID, target_item_name: 'The Legend of Zelda: Ocarina of Time',
    platform: 'N64', base_market_price: 95.00, scarcity_mult: 1.0,
    store_credit_value: 70.00, status: 'ACTIVE', order_type: 'LIMIT_BUY',
    trigger_price: 70.00, fulfillment_status: 'OPEN',
    description: 'Will buy at $70 or less.',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bnt-006', organization_id: DEMO_ORG_ID, target_item_name: 'GoldenEye 007',
    platform: 'N64', base_market_price: 30.00, scarcity_mult: 1.0,
    store_credit_value: 22.00, status: 'ACTIVE', order_type: 'LIMIT_BUY',
    trigger_price: 22.00, fulfillment_status: 'OPEN',
    description: 'Looking for a copy under $22.',
    created_at: NOW, updated_at: NOW,
  },
];

// --- ARBITRAGE MATCHES ---
export const phantomArbitrageMatches: ArbitrageMatch[] = [
  {
    id: 'arb-001', organization_id: DEMO_ORG_ID, source_bounty_id: 'bnt-005',
    target_inventory_id: 'inv-009', item_name: 'The Legend of Zelda: Ocarina of Time',
    platform: 'N64', market_price: 95.00, buy_price: 70.00, sell_price: 89.99,
    spread_pct: 21.05, margin: 19.99, status: 'ACTIVE', confidence: 0.85,
    detected_at: NOW, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'arb-002', organization_id: DEMO_ORG_ID, source_bounty_id: 'bnt-003',
    target_inventory_id: undefined, item_name: 'Suikoden II',
    platform: 'PS1', market_price: 180.00, buy_price: 108.00, sell_price: 169.99,
    spread_pct: 40.00, margin: 72.00, status: 'PENDING', confidence: 0.75,
    detected_at: NOW, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'arb-003', organization_id: DEMO_ORG_ID, source_bounty_id: 'bnt-006',
    target_inventory_id: undefined, item_name: 'GoldenEye 007',
    platform: 'N64', market_price: 30.00, buy_price: 22.00, sell_price: 29.99,
    spread_pct: 26.67, margin: 7.99, status: 'ACTIVE', confidence: 0.90,
    detected_at: NOW, created_at: NOW, updated_at: NOW,
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

// --- BOUNTY STATS ---
export const phantomBountyStats: BountyStats[] = [
  { id: 'bst-001', organization_id: DEMO_ORG_ID, profile_id: 'usr-001', hunter_tag: 'TRON_99', total_fulfilled: 12, total_earned: 4850.00, current_claims: 2, reputation_score: 88.50, avg_fulfillment_time_hours: 48.5, last_claim_at: '2026-06-20T14:30:00Z', created_at: NOW, updated_at: NOW },
  { id: 'bst-002', organization_id: DEMO_ORG_ID, profile_id: 'usr-002', hunter_tag: 'PIXEL_QUEEN', total_fulfilled: 8, total_earned: 3200.00, current_claims: 1, reputation_score: 72.00, avg_fulfillment_time_hours: 62.0, last_claim_at: '2026-06-19T10:15:00Z', created_at: NOW, updated_at: NOW },
  { id: 'bst-003', organization_id: DEMO_ORG_ID, profile_id: 'usr-003', hunter_tag: 'NEO_GEO', total_fulfilled: 5, total_earned: 1850.00, current_claims: 0, reputation_score: 55.00, avg_fulfillment_time_hours: 96.0, last_claim_at: '2026-06-18T16:45:00Z', created_at: NOW, updated_at: NOW },
  { id: 'bst-004', organization_id: DEMO_ORG_ID, profile_id: 'usr-001', hunter_tag: 'ARCADE_FURY', total_fulfilled: 15, total_earned: 6200.00, current_claims: 3, reputation_score: 95.00, avg_fulfillment_time_hours: 36.0, last_claim_at: '2026-06-21T09:00:00Z', created_at: NOW, updated_at: NOW },
  { id: 'bst-005', organization_id: DEMO_ORG_ID, profile_id: 'usr-002', hunter_tag: 'LOOT_GOBLIN', total_fulfilled: 3, total_earned: 420.00, current_claims: 0, reputation_score: 25.00, avg_fulfillment_time_hours: 120.0, last_claim_at: '2026-06-15T11:00:00Z', created_at: NOW, updated_at: NOW },
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

// --- LFG PARTICIPANTS ---
export const phantomLfgParticipants: NexusLfgParticipant[] = [
  { id: 'lfgp-001', lobby_id: 'lfg-001', profile_id: 'usr-001', profile_tag: 'TRON_99', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-002', lobby_id: 'lfg-001', profile_id: 'usr-002', profile_tag: 'PIXEL_QUEEN', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-003', lobby_id: 'lfg-002', profile_id: 'usr-003', profile_tag: 'NEO_GEO', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-004', lobby_id: 'lfg-002', profile_id: 'usr-001', profile_tag: 'TRON_99', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-005', lobby_id: 'lfg-002', profile_id: 'usr-002', profile_tag: 'PIXEL_QUEEN', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-006', lobby_id: 'lfg-003', profile_id: 'usr-001', profile_tag: 'TRON_99', status: 'JOINED', joined_at: NOW },
  { id: 'lfgp-007', lobby_id: 'lfg-003', profile_id: 'usr-003', profile_tag: 'NEO_GEO', status: 'JOINED', joined_at: NOW },
];

// --- VITALITY QUESTS ---
export const phantomVitalityQuests: VitalityQuest[] = [
  {
    id: 'vq-001', organization_id: DEMO_ORG_ID, name: 'Stretch Break',
    description: 'Stand up and stretch for 60 seconds. Your body will thank you.',
    quest_type: 'STRETCH', xp_reward: 50, stamina_restore: 15,
    cooldown_minutes: 60, is_active: true, created_at: NOW,
  },
  {
    id: 'vq-002', organization_id: DEMO_ORG_ID, name: 'Hydration Station',
    description: 'Refill your water bottle. Staying hydrated keeps the mind sharp.',
    quest_type: 'HYDRATION', xp_reward: 30, stamina_restore: 10,
    cooldown_minutes: 30, is_active: true, created_at: NOW,
  },
  {
    id: 'vq-003', organization_id: DEMO_ORG_ID, name: 'Eye Rest',
    description: 'Look away from the screen at something 20 feet away for 20 seconds.',
    quest_type: 'EYE_REST', xp_reward: 25, stamina_restore: 8,
    cooldown_minutes: 120, is_active: true, created_at: NOW,
  },
  {
    id: 'vq-004', organization_id: DEMO_ORG_ID, name: 'Posture Check',
    description: 'Sit up straight with your shoulders back. Good posture improves focus.',
    quest_type: 'POSTURE_CHECK', xp_reward: 20, stamina_restore: 5,
    cooldown_minutes: 45, is_active: true, created_at: NOW,
  },
  {
    id: 'vq-005', organization_id: DEMO_ORG_ID, name: 'Power Walk',
    description: 'Take a 5-minute walk around the venue. Get those steps in.',
    quest_type: 'STEPS', xp_reward: 80, stamina_restore: 25,
    cooldown_minutes: 180, is_active: true, created_at: NOW,
  },
  {
    id: 'vq-006', organization_id: DEMO_ORG_ID, name: 'Mindful Moment',
    description: 'Take 3 deep breaths and recenter. Breathe in calm, breathe out stress.',
    quest_type: 'MINDFULNESS', xp_reward: 40, stamina_restore: 12,
    cooldown_minutes: 90, is_active: false, created_at: NOW,
  },
];

// --- TAVERN STATIONS ---
export const phantomStations: Station[] = [
  {
    id: 'stn-001', organization_id: DEMO_ORG_ID, name: 'Station Alpha',
    station_type: 'PC', zone: 'MAIN', position_x: 120, position_y: 100,
    status: 'AVAILABLE', hourly_rate: 5.00, current_game: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'stn-002', organization_id: DEMO_ORG_ID, name: 'Station Beta',
    station_type: 'CONSOLE', zone: 'MAIN', position_x: 240, position_y: 100,
    status: 'OCCUPIED', hourly_rate: 4.00, current_game: 'Street Fighter III',
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'stn-003', organization_id: DEMO_ORG_ID, name: 'Couch Co-op',
    station_type: 'COUCH', zone: 'VIP', position_x: 400, position_y: 80,
    status: 'AVAILABLE', hourly_rate: 8.00, current_game: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'stn-004', organization_id: DEMO_ORG_ID, name: 'Tabletop Corner',
    station_type: 'TABLETOP', zone: 'TABLETOP_CORNER', position_x: 160, position_y: 220,
    status: 'AVAILABLE', hourly_rate: 3.00, current_game: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'stn-005', organization_id: DEMO_ORG_ID, name: 'VR Station',
    station_type: 'VR', zone: 'VR_ZONE', position_x: 350, position_y: 200,
    status: 'MAINTENANCE', hourly_rate: 12.00, current_game: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'stn-006', organization_id: DEMO_ORG_ID, name: 'Arcade Row East',
    station_type: 'ARCADE', zone: 'ARCADE_ROW', position_x: 120, position_y: 340,
    status: 'OCCUPIED', hourly_rate: 2.00, current_game: 'Galaga',
    created_at: NOW, updated_at: NOW,
  },
];

// --- STATION BOOKINGS ---
export const phantomStationBookings: StationBooking[] = [
  {
    id: 'bk-001', station_id: 'stn-002', organization_id: DEMO_ORG_ID,
    profile_id: 'usr-001', start_time: new Date(Date.now() - 7200000).toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    status: 'CONFIRMED', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bk-002', station_id: 'stn-006', organization_id: DEMO_ORG_ID,
    profile_id: 'usr-002', start_time: new Date(Date.now() - 3600000).toISOString(),
    end_time: new Date(Date.now() + 5400000).toISOString(),
    status: 'CHECKED_IN', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'bk-003', station_id: 'stn-001', organization_id: DEMO_ORG_ID,
    profile_id: 'usr-003', start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 172800000).toISOString(),
    status: 'PENDING', created_at: NOW, updated_at: NOW,
  },
];

// --- WALLETS ---
export const phantomWallets: Wallet[] = [
  {
    id: 'wal-001', profile_id: 'usr-001', organization_id: DEMO_ORG_ID,
    balance: 275.50, total_earned: 1250.75, total_spent: 975.25,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: 'wal-002', profile_id: 'usr-002', organization_id: DEMO_ORG_ID,
    balance: 42.00, total_earned: 520.00, total_spent: 478.00,
    created_at: NOW, updated_at: NOW,
  },
];

// --- WALLET TRANSACTIONS ---
export const phantomWalletTransactions: WalletTransaction[] = [
  { id: 'wtx-001', wallet_id: 'wal-001', profile_id: 'usr-001', type: 'CREDIT_BOUNTY', amount: 150.00, description: 'Bounty fulfilled: PowerStone 2', reference_type: 'bounty', reference_id: 'bnt-004', created_at: NOW },
  { id: 'wtx-002', wallet_id: 'wal-001', profile_id: 'usr-001', type: 'DEBIT_PURCHASE', amount: 29.99, description: 'Sonic 2 (Genesis) purchase', reference_type: 'sale', reference_id: 'sale-001', created_at: NOW },
  { id: 'wtx-003', wallet_id: 'wal-001', profile_id: 'usr-001', type: 'CREDIT_REFERRAL', amount: 25.00, description: 'Referral bonus: PIXEL_QUEEN', reference_type: 'referral', reference_id: 'ref-001', created_at: NOW },
  { id: 'wtx-004', wallet_id: 'wal-002', profile_id: 'usr-002', type: 'CREDIT_ACHIEVEMENT', amount: 50.00, description: 'Monthly faction win bonus', reference_type: 'faction_war', reference_id: 'fs-003', created_at: NOW },
  { id: 'wtx-005', wallet_id: 'wal-002', profile_id: 'usr-002', type: 'DEBIT_LFG_BOOKING', amount: 15.00, description: 'Lobby fee: Smash Bros. tournament', reference_type: 'lfg', reference_id: 'lfg-002', created_at: NOW },
  { id: 'wtx-006', wallet_id: 'wal-001', profile_id: 'usr-001', type: 'DEBIT_SAVE_ROOM', amount: 15.00, description: 'Save Room Alpha monthly fee', reference_type: 'save_room', reference_id: 'room-001', created_at: NOW },
];

// --- POTIONS MENU (shared constant, 12 items) ---
export const phantomPotionsMenu: PotionMenuItem[] = [
  { id: 'pm-001', organization_id: DEMO_ORG_ID, name: 'Brain Fuel Smoothie', description: 'Blueberry, banana, and lion\'s mane blend for peak cognitive performance.', category: 'SMOOTHIE', price: 8.99, vitality_boost: { energy: 25, focus: 30 }, is_active: true, created_at: NOW },
  { id: 'pm-002', organization_id: DEMO_ORG_ID, name: 'Zen Tea', description: 'Calming chamomile and lavender — reduces cortisol during intense gaming sessions.', category: 'TEA', price: 4.99, vitality_boost: { calm: 20, relaxation: 15 }, is_active: true, created_at: NOW },
  { id: 'pm-003', organization_id: DEMO_ORG_ID, name: 'Focus Nootropic', description: 'Our signature nootropic blend with L-theanine, alpha-GPC, and caffeine.', category: 'NOOTROPIC', price: 6.99, vitality_boost: { focus: 40, energy: 20 }, is_active: true, created_at: NOW },
  { id: 'pm-004', organization_id: DEMO_ORG_ID, name: 'Retro Gamer Meal', description: 'Classic comfort: grass-fed burger with sweet potato fries.', category: 'MEAL', price: 14.99, vitality_boost: { stamina: 35, satiety: 40 }, is_active: true, created_at: NOW },
  { id: 'pm-005', organization_id: DEMO_ORG_ID, name: 'Electrolyte Splash', description: 'Hydration formula with electrolytes and B vitamins.', category: 'HYDRATION', price: 3.99, vitality_boost: { hydration: 50 }, is_active: true, created_at: NOW },
  { id: 'pm-006', organization_id: DEMO_ORG_ID, name: 'Dragon\'s Breath Chili', description: 'Spicy loaded chili with jalapenos, cheese, and sour cream. Not for the faint of heart.', category: 'MEAL', price: 12.99, vitality_boost: { stamina: 30, satiety: 45 }, is_active: true, created_at: NOW },
  { id: 'pm-007', organization_id: DEMO_ORG_ID, name: 'Mana Potion', description: 'Blue raspberry electrolyte drink with a caffeine kick.', category: 'HYDRATION', price: 5.99, vitality_boost: { energy: 35, hydration: 30 }, is_active: true, created_at: NOW },
  { id: 'pm-008', organization_id: DEMO_ORG_ID, name: 'Health Potion', description: 'Green superfood smoothie with spirulina, kale, and ginger.', category: 'SMOOTHIE', price: 9.99, vitality_boost: { stamina: 40, immunity: 25 }, is_active: true, created_at: NOW },
  { id: 'pm-009', organization_id: DEMO_ORG_ID, name: 'Matcha Latte', description: 'Ceremonial grade matcha with oat milk. Sustained energy without the jitters.', category: 'TEA', price: 5.49, vitality_boost: { focus: 25, calm: 20 }, is_active: true, created_at: NOW },
  { id: 'pm-010', organization_id: DEMO_ORG_ID, name: 'Gamer Protein Bites', description: 'High-protein energy balls — peanut butter, oats, and dark chocolate chips.', category: 'SNACK', price: 4.49, vitality_boost: { stamina: 20, satiety: 25 }, is_active: true, created_at: NOW },
  { id: 'pm-011', organization_id: DEMO_ORG_ID, name: 'Cosmic Coffee', description: 'Cold brew with a shot of espresso and cinnamon. For the late-night raid crew.', category: 'NOOTROPIC', price: 7.49, vitality_boost: { energy: 50, focus: 15 }, is_active: true, created_at: NOW },
  { id: 'pm-012', organization_id: DEMO_ORG_ID, name: 'Pixel Popcorn', description: 'Classic butter popcorn with a secret umami seasoning blend.', category: 'SNACK', price: 3.99, vitality_boost: { satiety: 15 }, is_active: true, created_at: NOW },
];

// --- POTION ORDERS ---
export const phantomPotionOrders: PotionOrder[] = [
  {
    id: 'po-001', organization_id: DEMO_ORG_ID, profile_id: 'usr-001',
    items: [{ item_id: 'pm-001', name: 'Brain Fuel Smoothie', quantity: 1, price: 8.99 }],
    total: 8.99, status: 'DELIVERED', station_id: 'stn-002', created_at: NOW,
  },
  {
    id: 'po-002', organization_id: DEMO_ORG_ID, profile_id: 'usr-002',
    items: [
      { item_id: 'pm-005', name: 'Electrolyte Splash', quantity: 2, price: 3.99 },
      { item_id: 'pm-010', name: 'Gamer Protein Bites', quantity: 1, price: 4.49 },
    ],
    total: 12.47, status: 'PREPARING', station_id: 'stn-006', created_at: NOW,
  },
  {
    id: 'po-003', organization_id: DEMO_ORG_ID, profile_id: 'usr-003',
    items: [{ item_id: 'pm-007', name: 'Mana Potion', quantity: 1, price: 5.99 }],
    total: 5.99, status: 'PENDING', created_at: NOW,
  },
];

// --- XP TRANSACTIONS ---
export const phantomXPTransactions: XPTransaction[] = [
  { id: 'xp-001', profile_id: 'usr-001', amount: 250, source: 'BOUNTY_FULFILLMENT', reference_type: 'bounty', reference_id: 'bnt-004', created_at: NOW },
  { id: 'xp-002', profile_id: 'usr-001', amount: 50, source: 'VITALITY_QUEST', reference_type: 'vitality_quest', reference_id: 'vq-001', created_at: NOW },
  { id: 'xp-003', profile_id: 'usr-002', amount: 150, source: 'FACTION_WAR', reference_type: 'faction_war', reference_id: 'fs-003', created_at: NOW },
  { id: 'xp-004', profile_id: 'usr-002', amount: 80, source: 'SCORE_SUBMISSION', reference_type: 'score', reference_id: 'scr-001', created_at: NOW },
  { id: 'xp-005', profile_id: 'usr-003', amount: 30, source: 'POTION_PURCHASE', reference_type: 'potion_order', reference_id: 'po-003', created_at: NOW },
];

// ============================================================================
// CUSTOMER STOREFRONT — Phantom Orders
// ============================================================================
export const phantomOrders: Order[] = [
  {
    id: 'ord-001', organization_id: DEMO_ORG_ID, profile_id: 'usr-001',
    items: [
      { id: 'oi-001', order_id: 'ord-001', inventory_id: 'inv-003', item_name: 'Super Mario RPG', platform: 'SNES', price: 89.99, quantity: 1, tags: ['JRPG', 'PLATFORMER'] },
      { id: 'oi-002', order_id: 'ord-001', inventory_id: 'inv-010', item_name: 'Metal Gear Solid', platform: 'PS1', price: 39.99, quantity: 1, tags: ['STEALTH', 'ACTION'] },
    ],
    subtotal: 129.98, discount_amount: 0, tax_amount: 10.40, total: 140.38,
    status: 'DELIVERED', payment_method: 'STRIPE', payment_status: 'PAID',
    stripe_payment_intent_id: 'pi_demo_001',
    customer_notes: 'Please bubble wrap the cartridges!',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ord-002', organization_id: DEMO_ORG_ID, profile_id: 'usr-002',
    items: [
      { id: 'oi-003', order_id: 'ord-002', inventory_id: 'inv-001', item_name: 'EarthBound', platform: 'SNES', price: 379.99, quantity: 1, tags: ['JRPG', 'RARE', 'GRAIL'] },
    ],
    subtotal: 379.99, discount_amount: 38.00, tax_amount: 27.36, total: 369.35,
    status: 'SHIPPED', payment_method: 'STORE_CREDIT', payment_status: 'PAID',
    customer_notes: undefined,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'ord-003', organization_id: DEMO_ORG_ID, profile_id: 'usr-003',
    items: [
      { id: 'oi-004', order_id: 'ord-003', inventory_id: 'inv-004', item_name: 'Sonic the Hedgehog 2', platform: 'GENESIS', price: 29.99, quantity: 2, tags: ['PLATFORMER', 'SEGA'] },
    ],
    subtotal: 59.98, discount_amount: 0, tax_amount: 4.80, total: 64.78,
    status: 'CONFIRMED', payment_method: 'CARD', payment_status: 'PAID',
    stripe_payment_intent_id: 'pi_demo_003',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'ord-004', organization_id: DEMO_ORG_ID, profile_id: 'usr-001',
    items: [
      { id: 'oi-005', order_id: 'ord-004', inventory_id: 'inv-005', item_name: 'Chrono Cross', platform: 'PS1', price: 49.99, quantity: 1, tags: ['JRPG'] },
    ],
    subtotal: 49.99, discount_amount: 0, tax_amount: 4.00, total: 53.99,
    status: 'PENDING', payment_method: 'STRIPE', payment_status: 'UNPAID',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ============================================================================
// POS — Phantom Session & Transactions
// ============================================================================
export const phantomPOSSession: POSSession = {
  id: 'pos-session-001',
  organization_id: DEMO_ORG_ID,
  staff_profile_id: 'usr-001',
  opened_at: new Date(Date.now() - 14400000).toISOString(),
  starting_cash: 200.00,
  total_sales: 845.50,
  total_transactions: 7,
  cash_sales: 320.00,
  card_sales: 425.50,
  store_credit_sales: 100.00,
  status: 'OPEN',
};

export const phantomPOSTransactions: POSTransaction[] = [
  {
    id: 'pos-txn-001', session_id: 'pos-session-001', organization_id: DEMO_ORG_ID,
    items: [
      { id: 'posci-001', inventory_id: 'inv-004', item_name: 'Sonic the Hedgehog 2', platform: 'GENESIS', price: 29.99, quantity: 1, is_legendary: false, tags: ['PLATFORMER', 'SEGA'] },
    ],
    subtotal: 29.99, discount_amount: 0, tax_amount: 2.40, total: 32.39,
    payment_method: 'CASH', cash_tendered: 40.00, change_due: 7.61,
    receipt_number: 'RCPT-001',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'pos-txn-002', session_id: 'pos-session-001', organization_id: DEMO_ORG_ID,
    items: [
      { id: 'posci-002', inventory_id: 'inv-003', item_name: 'Super Mario RPG', platform: 'SNES', price: 89.99, quantity: 1, is_legendary: false, tags: ['JRPG', 'PLATFORMER'] },
      { id: 'posci-003', inventory_id: 'inv-010', item_name: 'Metal Gear Solid', platform: 'PS1', price: 39.99, quantity: 1, is_legendary: false, tags: ['STEALTH', 'ACTION'] },
    ],
    subtotal: 129.98, discount_amount: 0, tax_amount: 10.40, total: 140.38,
    payment_method: 'CARD',
    receipt_number: 'RCPT-002',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'pos-txn-003', session_id: 'pos-session-001', organization_id: DEMO_ORG_ID,
    items: [
      { id: 'posci-004', inventory_id: 'inv-001', item_name: 'EarthBound', platform: 'SNES', price: 379.99, quantity: 1, is_legendary: true, tags: ['JRPG', 'RARE', 'GRAIL'] },
    ],
    subtotal: 379.99, discount_amount: 19.00, tax_amount: 28.88, total: 389.87,
    payment_method: 'STORE_CREDIT', customer_profile_id: 'usr-002',
    receipt_number: 'RCPT-003',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

// ============================================================================
// AGENTIC AI — Phantom Agent Session
// ============================================================================
export const phantomAgentSession: AgentSession = {
  id: 'agent-session-001',
  organization_id: DEMO_ORG_ID,
  profile_id: 'usr-001',
  messages: [],
  context: {
    inventory_count: 10,
    active_bounties: 4,
    recent_orders: 3,
    mode: 'merchant',
  },
  created_at: NOW,
  updated_at: NOW,
};

export const phantomAgentMessages: AgentMessage[] = [
  {
    id: 'amsg-001',
    role: 'system',
    content: 'You are the GuildOS Agentic AI, an autonomous shopkeeper assistant for Time Warp Gaming. You have access to inventory, bounties, orders, pricing, and customer data. Use tools to take action, not just chat.',
    timestamp: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'amsg-002',
    role: 'user',
    content: 'Check if we have any copies of Chrono Trigger in stock and what the current market price is.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'amsg-003',
    role: 'assistant',
    content: 'Let me look that up for you. I\'ll search the inventory and check current market prices.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    tool_calls: [
      {
        id: 'tc-001',
        tool_name: 'search_inventory',
        parameters: { query: 'Chrono Trigger', platform: 'SNES' },
        status: 'completed',
        result: JSON.stringify({ found: true, item: { id: 'inv-002', name: 'Chrono Trigger', platform: 'SNES', condition: 'LOOSE', market_value: 185.00, our_price: 199.99, stock_count: 1, is_legendary: true, price_spike_flag: true, tags: ['JRPG', 'RARE'] } }),
        called_at: new Date(Date.now() - 290000).toISOString(),
        completed_at: new Date(Date.now() - 289000).toISOString(),
      },
      {
        id: 'tc-002',
        tool_name: 'check_market_price',
        parameters: { item_name: 'Chrono Trigger', platform: 'SNES' },
        status: 'completed',
        result: JSON.stringify({ market_price: 188.50, trend: 'UP', change_pct: 1.9, last_updated: new Date().toISOString() }),
        called_at: new Date(Date.now() - 288000).toISOString(),
        completed_at: new Date(Date.now() - 287000).toISOString(),
      },
    ],
  },
  {
    id: 'amsg-004',
    role: 'assistant',
    content: 'Here\'s what I found:\n\n**Chrono Trigger (SNES)** — LOOSE\n- **Market Value:** $188.50 (↑1.9% this week)\n- **Our Price:** $199.99\n- **Stock:** 1 copy available\n- **Status:** ⚠️ PRICE SPIKE ACTIVE — market is trending up\n- **Tags:** JRPG, RARE, LEGENDARY\n\nThis is a legendary-tier item with a price spike flag. I\'d recommend holding at $199.99 or even increasing to $209.99 given the upward trend. Want me to adjust the price or create a bounty to source another copy?',
    timestamp: new Date(Date.now() - 280000).toISOString(),
  },
];

// ============================================================================
// STOREFRONT CONFIG
// ============================================================================
export const phantomStorefrontConfig = {
  store_name: 'Time Warp Gaming',
  tagline: 'Where Every Cartridge Tells a Story',
  enable_customer_chat: true,
  show_prices: true,
};
