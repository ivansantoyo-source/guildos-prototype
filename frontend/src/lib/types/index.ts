// ============================================================================
// GUILDOS — TypeScript Domain Types
// All entity interfaces matching the database schema
// ============================================================================

// --- Core Entities ---

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  custom_domain?: string;
  tier: 'merchant' | 'wizard' | 'time_lord';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  iot_webhook_url?: string;
  config: Record<string, unknown>;
  logo_url?: string;
  tagline?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'owner' | 'admin' | 'staff' | 'customer';
export type Faction = 'SEGA_SYNDICATE' | 'NINTENDO_NOMADS' | 'SONY_SENTINELS';
export type LevelTier = 'PEASANT' | 'RETRO_MAGE' | 'TIME_LORD';

export interface Profile {
  id: string;
  organization_id: string;
  display_name: string;
  role: UserRole;
  faction?: Faction;
  xp_points: number;
  level_tier: LevelTier;
  phone?: string;
  email?: string;
  avatar_url?: string;
  purchase_tags: string[];
  geo_lat?: number;
  geo_lng?: number;
  total_spend: number;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Inventory Module ---

export type ItemCondition = 'NEW' | 'CIB' | 'LOOSE' | 'SCRAP';
export type InventoryStatus = 'ACTIVE' | 'SOLD' | 'RESERVED' | 'SCRAP' | 'ARCHIVED';

export interface InventoryItem {
  id: string;
  organization_id: string;
  item_name: string;
  platform?: string;
  condition?: ItemCondition;
  market_value: number;
  our_price?: number;
  scrap_value: number;
  stock_count: number;
  is_legendary: boolean;
  price_spike_flag: boolean;
  tags: string[];
  image_url?: string;
  scanned_image_url?: string;
  pricecharting_id?: string;
  last_price_sync?: string;
  status: InventoryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Bounty Board Module ---

export type BountyStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';

export interface Bounty {
  id: string;
  organization_id: string;
  target_item_name: string;
  platform?: string;
  base_market_price: number;
  scarcity_mult: number;
  store_credit_value: number; // computed column
  status: BountyStatus;
  fulfilled_by?: string;
  fulfilled_at?: string;
  expires_at?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// --- Nexus Module ---

export type LobbyStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface NexusLfg {
  id: string;
  organization_id: string;
  creator_id: string;
  game_title: string;
  description?: string;
  console_type?: string;
  player_slots_total: number;
  player_slots_filled: number;
  max_spectators: number;
  start_time?: string;
  end_time?: string;
  lobby_status: LobbyStatus;
  created_at: string;
  // Populated via join
  creator?: Profile;
}

export interface ScoreboardEntry {
  id: string;
  organization_id: string;
  cabinet_name: string;
  game_title: string;
  player_tag: string;
  player_id?: string;
  score: number;
  rank?: number;
  status: string;
  logged_at: string;
  created_at: string;
}

export interface SaveRoom {
  id: string;
  organization_id: string;
  room_name: string;
  description?: string;
  monthly_rate: number;
  capacity: number;
  amenities: string[];
  subscriber_id?: string;
  stripe_subscription_id?: string;
  qr_code_hash?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  created_at: string;
}

// --- Faction & Gamification ---

export interface FactionStanding {
  id: string;
  organization_id: string;
  month: number;
  year: number;
  faction: Faction;
  total_points: number;
  is_winner: boolean;
  discount_active: boolean;
  created_at: string;
}

// --- Security ---

export interface BlacklistEntry {
  id: string;
  reported_by_org: string;
  hashed_id: string;
  geo_lat?: number;
  geo_lng?: number;
  reason: string;
  description?: string;
  severity: 'WARNING' | 'CRITICAL' | 'BAN';
  is_active: boolean;
  created_at: string;
}

// --- Notifications ---

export type NotificationType =
  | 'PRICE_SPIKE'
  | 'BOUNTY_FULFILLED'
  | 'SCORE_DETHRONED'
  | 'ORACLE_MATCH'
  | 'GRAIL_DROP'
  | 'FACTION_WIN'
  | 'B2B_PROPOSAL'
  | 'BLACKLIST_ALERT'
  | 'SYSTEM'
  | 'KONAMI';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// --- Discount Codes ---

export interface DiscountCode {
  id: string;
  organization_id: string;
  code: string;
  discount_percent: number;
  source: 'KONAMI' | 'FACTION_WIN' | 'PROMOTION' | 'MANUAL';
  used_by?: string;
  used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// --- API Types ---

export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}

export interface ApiError {
  error: string;
  status: number;
  details?: string;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  goldFarmed: number;         // Total revenue
  legendaryDrops: number;     // Items with market_value >= 150
  lootDepleted: number;       // Items with stock_count = 0
  activeBounties: number;     // Open bounty count
  priceSpikeAlerts: number;   // Items with price_spike_flag
  activeLobbies: number;      // Open LFG lobbies
}

export interface ActivityEvent {
  id: string;
  type: 'SCAN' | 'SALE' | 'BOUNTY' | 'SCORE' | 'TRADE_IN' | 'GRAIL';
  title: string;
  description: string;
  value?: number;
  timestamp: string;
}

// --- Shopkeeper AI ---

export interface ShopkeeperMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface OracleMatch {
  userId: string;
  userDisplayName: string;
  matchedItem: string;
  matchedTag: string;
  confidence: number;
  timestamp: string;
}
