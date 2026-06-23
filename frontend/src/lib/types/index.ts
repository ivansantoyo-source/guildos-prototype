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

export type OrderType = 'BOUNTY' | 'LIMIT_BUY' | 'LIMIT_SELL';

export type FulfillmentStatus = 'OPEN' | 'CLAIMED' | 'IN_TRANSIT' | 'RECEIVED' | 'VERIFIED' | 'PAID' | 'DISPUTED';

export interface Bounty {
  id: string;
  organization_id: string;
  target_item_name: string;
  platform?: string;
  base_market_price: number;
  scarcity_mult: number;
  store_credit_value: number;
  status: BountyStatus;
  order_type?: OrderType;
  trigger_price?: number;
  fulfillment_status?: FulfillmentStatus;
  fulfilled_by?: string;
  fulfilled_by_profile?: string;
  fulfilled_at?: string;
  claimed_by?: string;
  claimed_at?: string;
  condition_notes?: string;
  serial_number?: string;
  expires_at?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type ArbitrageMatchStatus = 'PENDING' | 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';

export interface ArbitrageMatch {
  id: string;
  organization_id: string;
  source_bounty_id: string;
  target_inventory_id?: string;
  item_name: string;
  platform?: string;
  market_price: number;
  buy_price: number;
  sell_price: number;
  spread_pct: number;
  margin: number;
  status: ArbitrageMatchStatus;
  confidence?: number;
  detected_at?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BountyStats {
  id: string;
  organization_id: string;
  profile_id: string;
  hunter_tag: string;
  total_fulfilled: number;
  total_earned: number;
  current_claims: number;
  reputation_score: number;
  avg_fulfillment_time_hours?: number;
  last_claim_at?: string;
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

export type LfgParticipantStatus = 'JOINED' | 'LEFT' | 'KICKED' | 'BANNED';

export interface NexusLfgParticipant {
  id: string;
  lobby_id: string;
  profile_id: string;
  profile_tag: string;
  status: LfgParticipantStatus;
  joined_at: string;
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

// --- Tavern / Spatial ---

export interface Station {
  id: string;
  organization_id: string;
  name: string;
  station_type: 'PC' | 'CONSOLE' | 'TABLETOP' | 'COUCH' | 'VR' | 'ARCADE';
  zone: string;
  position_x: number;
  position_y: number;
  mac_address?: string;
  ip_address?: string;
  rgb_profile?: Record<string, unknown>;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OFFLINE';
  current_game?: string;
  current_player_id?: string;
  occupied_at?: string;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface StationBooking {
  id: string;
  station_id: string;
  organization_id: string;
  profile_id?: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  rgb_color?: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentReading {
  id: string;
  organization_id: string;
  zone: string;
  temperature_c?: number;
  humidity_pct?: number;
  power_draw_watts?: number;
  recorded_at: string;
}

// --- Wallet ---

export interface Wallet {
  id: string;
  profile_id: string;
  organization_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  profile_id: string;
  type: 'CREDIT_BOUNTY' | 'CREDIT_REFERRAL' | 'CREDIT_ACHIEVEMENT' | 'DEBIT_PURCHASE' | 'DEBIT_LFG_BOOKING' | 'DEBIT_SAVE_ROOM' | 'REFUND';
  amount: number;
  description?: string;
  reference_type: string;
  reference_id?: string;
  created_at: string;
}

// --- Vitality Protocol ---

export interface VitalityQuest {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  quest_type: 'STRETCH' | 'HYDRATION' | 'STEPS' | 'POSTURE_CHECK' | 'EYE_REST' | 'SOCIAL' | 'MINDFULNESS';
  xp_reward: number;
  stamina_restore: number;
  cooldown_minutes: number;
  qr_code_hash?: string;
  is_active: boolean;
  created_at: string;
}

export interface VitalityCompletion {
  id: string;
  profile_id: string;
  quest_id: string;
  completed_at: string;
  xp_earned: number;
  stamina_restored: number;
}

export interface PotionMenuItem {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: 'TEA' | 'SMOOTHIE' | 'NOOTROPIC' | 'MEAL' | 'SNACK' | 'HYDRATION';
  price: number;
  image_url?: string;
  vitality_boost?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface PotionOrder {
  id: string;
  organization_id: string;
  profile_id: string;
  items: Record<string, unknown>[];
  total: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  station_id?: string;
  created_at: string;
}

export interface XPTransaction {
  id: string;
  profile_id: string;
  amount: number;
  source: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

// --- Legal & Compliance ---

export interface LegalWaiver {
  id: string;
  organization_id: string;
  title: string;
  waiver_type: 'LIABILITY' | 'ACTIVITY' | 'VR' | 'EVENT' | 'MINOR_GUARDIAN' | 'PHOTO_RELEASE' | 'GENERAL';
  content_markdown: string;
  version: number;
  is_active: boolean;
  requires_signature: boolean;
  requires_guardian_if_minor: boolean;
  minor_age_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface WaiverAcceptance {
  id: string;
  waiver_id: string;
  profile_id: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
  signature_data?: string;
  guardian_profile_id?: string;
  accepted_version: number;
}

export interface IdentityVerification {
  id: string;
  profile_id: string;
  verification_type: 'STRIPE_IDENTITY' | 'MANUAL_ID_CHECK' | 'GUARDIAN_VERIFICATION';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  stripe_verification_session_id?: string;
  verified_at?: string;
  verified_by?: string;
  id_document_type?: string;
  id_issuing_country?: string;
  id_expiry_date?: string;
  notes?: string;
  created_at: string;
}

export interface ChainOfCustodyEntry {
  id: string;
  organization_id: string;
  inventory_id?: string;
  bounty_id?: string;
  seller_profile_id?: string;
  seller_id_verified: boolean;
  seller_identity_verification_id?: string;
  transaction_type: 'TRADE_IN' | 'CASH_SALE' | 'BOUNTY_FULFILLMENT' | 'DONATION' | 'AUCTION_PURCHASE' | 'ESTATE_LOT';
  seller_stated_value?: number;
  amount_paid?: number;
  payment_method?: 'CASH' | 'STORE_CREDIT' | 'CHECK' | 'BANK_TRANSFER' | 'CRYPTO';
  serial_number?: string;
  condition_notes?: string;
  seller_signed_affidavit: boolean;
  holding_period_days: number;
  holding_period_end?: string;
  law_enforcement_reported: boolean;
  law_enforcement_report_date?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  profile_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LegalPage {
  id: string;
  organization_id: string;
  page_type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COOKIE_POLICY' | 'REFUND_POLICY' | 'CODE_OF_CONDUCT' | 'CUSTOM';
  title: string;
  content_markdown: string;
  version: number;
  published_at: string;
  is_active: boolean;
}

// ============================================================================
// CUSTOMER STOREFRONT TYPES
// ============================================================================

export interface CartItem {
  id: string;
  inventory_id: string;
  item_name: string;
  platform?: string;
  condition?: ItemCondition;
  price: number;
  quantity: number;
  image_url?: string;
  tags: string[];
}

export interface Cart {
  id: string;
  organization_id: string;
  profile_id?: string;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  discount_code?: string;
  total: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  order_id: string;
  inventory_id: string;
  item_name: string;
  platform?: string;
  price: number;
  quantity: number;
  tags: string[];
}

export interface Order {
  id: string;
  organization_id: string;
  profile_id: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  status: OrderStatus;
  payment_method: 'STRIPE' | 'STORE_CREDIT' | 'CASH' | 'CARD';
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  stripe_payment_intent_id?: string;
  customer_notes?: string;
  pickup_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StorefrontConfig {
  organization_id: string;
  store_name: string;
  tagline: string;
  hero_image_url?: string;
  logo_url?: string;
  primary_color?: string;
  show_prices: boolean;
  show_out_of_stock: boolean;
  enable_customer_chat: boolean;
  enable_wishlists: boolean;
  enable_reviews: boolean;
  require_account_for_purchase: boolean;
  featured_product_ids: string[];
  announcement_text?: string;
}

// ============================================================================
// POS (POINT OF SALE) TYPES
// ============================================================================

export type POSPaymentMethod = 'CASH' | 'CARD' | 'STORE_CREDIT' | 'SPLIT';

export interface POSCartItem {
  id: string;
  inventory_id: string;
  item_name: string;
  platform?: string;
  price: number;
  quantity: number;
  is_legendary: boolean;
  tags: string[];
}

export interface POSSession {
  id: string;
  organization_id: string;
  staff_profile_id: string;
  opened_at: string;
  closed_at?: string;
  starting_cash: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  store_credit_sales: number;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  notes?: string;
}

export interface POSTransaction {
  id: string;
  session_id: string;
  organization_id: string;
  items: POSCartItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: POSPaymentMethod;
  cash_tendered?: number;
  change_due?: number;
  customer_profile_id?: string;
  receipt_number?: string;
  created_at: string;
}

// ============================================================================
// AGENTIC AI TYPES
// ============================================================================

export interface AITool {
  name: string;
  description: string;
  category: 'inventory' | 'bounties' | 'orders' | 'pricing' | 'customers' | 'system';
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  handler: string; // reference to tool implementation
}

export interface AIToolCall {
  id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  called_at: string;
  completed_at?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: AIToolCall[];
  timestamp: string;
  streaming?: boolean;
}

export interface AgentSession {
  id: string;
  organization_id: string;
  profile_id?: string;
  messages: AgentMessage[];
  context: {
    inventory_count: number;
    active_bounties: number;
    recent_orders: number;
    mode: 'merchant' | 'customer';
  };
  created_at: string;
  updated_at: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  category: 'commerce' | 'support' | 'analytics' | 'operations' | 'gamification';
  enabled: boolean;
  requires_key: boolean;
}
