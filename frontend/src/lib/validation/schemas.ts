// ============================================================================
// GUILDOS — Validation Schemas (Zod)
// Runtime validation for all API route inputs
// ============================================================================

import { z } from 'zod';

// --- Primitives ---
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{7,15}$/, 'Invalid phone number');
export const urlSchema = z.string().url('Invalid URL');
export const uuidSchema = z.string().uuid('Invalid UUID');
export const safeTextSchema = z.string().min(1).max(500).transform((s) => s.trim());
export const monetaryAmountSchema = z.number().min(0).max(1000000);
export const nonEmptyString = z.string().min(1);

// --- Inventory ---
export const InventorySchema = z.object({
  item_name: safeTextSchema,
  platform: z.string().max(50).optional(),
  condition: z.enum(['CIB', 'LOOSE', 'NEW', 'SCRAP']).optional(),
  market_value: monetaryAmountSchema.optional(),
  our_price: monetaryAmountSchema.optional(),
  scrap_value: z.number().min(0).optional(),
  stock_count: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'SOLD', 'SCRAP']).optional(),
  notes: z.string().max(2000).optional(),
  serial_number: z.string().max(100).optional(),
  condition_notes: z.string().max(1000).optional(),
});

// --- Bounty ---
export const BountySchema = z.object({
  target_item_name: safeTextSchema,
  platform: z.string().max(50).optional(),
  base_market_price: monetaryAmountSchema.optional(),
  scarcity_mult: z.number().min(0.1).max(100).optional(),
  description: z.string().max(2000).optional(),
  expires_at: z.string().datetime().optional(),
  order_type: z.enum(['BOUNTY', 'LIMIT_BUY', 'LIMIT_SELL']).optional(),
  trigger_price: monetaryAmountSchema.optional(),
  fulfillment_status: z.enum(['OPEN', 'CLAIMED', 'IN_TRANSIT', 'RECEIVED', 'VERIFIED', 'PAID', 'DISPUTED']).optional(),
  claimed_by: uuidSchema.optional(),
  condition_notes: z.string().max(1000).optional(),
  serial_number: z.string().max(100).optional(),
});

// --- Bounty Update (for PATCH [id] — all fields optional) ---
export const BountyUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'CANCELLED', 'FULFILLED']).optional(),
  fulfillment_status: z.enum(['OPEN', 'CLAIMED', 'IN_TRANSIT', 'RECEIVED', 'VERIFIED', 'PAID', 'DISPUTED', 'CANCELLED']).optional(),
  claimed_by: uuidSchema.optional(),
  fulfilled_by_profile: z.string().max(100).optional(),
  condition_notes: z.string().max(1000).optional(),
  serial_number: z.string().max(100).optional(),
  base_market_price: monetaryAmountSchema.optional(),
  scarcity_mult: z.number().min(0.1).max(100).optional(),
  store_credit_value: monetaryAmountSchema.optional(),
  trigger_price: monetaryAmountSchema.optional(),
  description: z.string().max(2000).optional(),
  expires_at: z.string().datetime().optional(),
});

// --- LFG Lobby ---
export const LfgSchema = z.object({
  game_title: safeTextSchema,
  description: z.string().max(2000).optional(),
  console_type: z.string().max(50).optional(),
  player_slots_total: z.number().int().min(2).max(64).optional(),
  player_slots_filled: z.number().int().min(0).optional(),
  max_spectators: z.number().int().min(0).max(100).optional(),
  start_time: z.string().datetime().optional(),
  total_cost: monetaryAmountSchema.optional(),
  cost_per_player: monetaryAmountSchema.optional(),
  payment_deadline: z.string().datetime().optional(),
  auto_refund: z.boolean().optional(),
  host_profile_id: uuidSchema.optional(),
});

// --- Save Room ---
export const SaveRoomSchema = z.object({
  room_name: safeTextSchema,
  description: z.string().max(2000).optional(),
  monthly_rate: monetaryAmountSchema,
  capacity: z.number().int().min(1).max(100).optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED']).optional(),
});

// --- Station ---
export const StationSchema = z.object({
  name: safeTextSchema,
  station_type: z.enum(['PC', 'CONSOLE', 'TABLETOP', 'COUCH', 'VR', 'ARCADE']),
  zone: z.string().max(50).optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  mac_address: z.string().max(17).optional(),
  ip_address: z.string().max(45).optional(),
  hourly_rate: monetaryAmountSchema.optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OFFLINE']).optional(),
  current_game: z.string().max(200).optional(),
  rgb_profile: z.record(z.string(), z.unknown()).optional(),
});

// --- Station Booking ---
export const BookingSchema = z.object({
  station_id: uuidSchema,
  profile_id: uuidSchema.optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  rgb_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});

// --- Payment ---
export const PaymentSchema = z.object({
  amount: monetaryAmountSchema,
  currency: z.string().length(3).default('usd'),
  payment_method: z.enum(['CASH', 'STORE_CREDIT', 'CARD', 'SPLIT_PAY']).optional(),
  reference_type: z.string(),
  reference_id: uuidSchema.optional(),
  description: z.string().max(500).optional(),
});

// --- Wallet ---
export const WalletSchema = z.object({
  profile_id: uuidSchema,
  type: z.enum(['CREDIT_BOUNTY', 'CREDIT_REFERRAL', 'CREDIT_ACHIEVEMENT', 'DEBIT_PURCHASE', 'DEBIT_LFG_BOOKING', 'DEBIT_SAVE_ROOM', 'REFUND']),
  amount: monetaryAmountSchema,
  description: z.string().max(500).optional(),
  reference_type: z.string(),
  reference_id: uuidSchema.optional(),
});

// --- Profile ---
export const ProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  faction: z.enum(['SEGA_SYNDICATE', 'NINTENDO_NOMADS', 'SONY_SENTINELS']).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// --- Settings ---
export const SettingsSchema = z.object({
  store: z.object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().max(200).optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    timezone: z.string().max(50).optional(),
    currency: z.string().length(3).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
  }).optional(),
  branding: z.object({
    logo_url: urlSchema.optional(),
    tagline: z.string().max(200).optional(),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }).optional(),
  features: z.record(z.string(), z.boolean()).optional(),
}).passthrough();

// --- Score / Leaderboard ---
export const ScoreSchema = z.object({
  game_title: safeTextSchema,
  player_tag: z.string().min(1).max(100),
  score: z.number().min(0),
  cabinet_name: z.string().max(200).optional(),
  player_id: uuidSchema.optional(),
});

// --- Vision Appraise ---
export const VisionAppraiseSchema = z.object({
  item_name: z.string().min(1).max(200).optional(),
  platform: z.string().max(50).optional(),
  image_url: z.string().url().optional(),
});

// --- Identity Verification ---
export const IdentitySchema = z.object({
  profile_id: uuidSchema,
  verification_type: z.enum(['STRIPE_IDENTITY', 'MANUAL_ID_CHECK', 'GUARDIAN_VERIFICATION']).optional(),
  id_document_type: z.string().max(50).optional(),
  id_country: z.string().length(2).optional(),
  id_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

// --- Discount ---
export const DiscountSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  source: z.enum(['KONAMI', 'FACTION_WIN', 'PROMOTION', 'MANUAL']).optional(),
  expires_at: z.string().datetime().optional(),
});

export const DiscountRedeemSchema = z.object({
  code: z.string().min(1, 'code is required'),
  userId: z.string().optional(),
});

// --- IoT Trigger ---
export const IoTTriggerSchema = z.object({
  event: z.string().min(1, 'event is required'),
  tenant_id: z.string().min(1, 'tenant_id is required'),
  item_name: z.string().min(1, 'item_name is required'),
  market_value: monetaryAmountSchema,
  action_payload: z.object({
    light_hex: z.string().optional(),
    light_pulse_ms: z.number().positive().optional(),
    audio_url: z.string().url().optional(),
  }).optional(),
});

// --- Shopkeeper AI Query ---
export const ShopkeeperMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
});

export const ShopkeeperQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  inventory: z.array(z.object({
    item_name: z.string().min(1),
    platform: z.string().optional(),
    market_value: z.number().min(0),
    stock_count: z.number().int().min(0),
    condition: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).optional(),
  messages: z.array(ShopkeeperMessageSchema).optional(),
});

// --- Security Blacklist ---
export const BlacklistEntrySchema = z.object({
  suspect_hash: z.string().min(1, 'suspect_hash is required'),
  incident_type: z.string().min(1, 'incident_type is required'),
  origin_tenant: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  geo_lat: z.number().min(-90).max(90).optional(),
  geo_lng: z.number().min(-180).max(180).optional(),
});

// --- Oracle ---
export const OracleSchema = z.object({
  userIds: z.array(z.string()).optional(),
});

// --- Auth / OTP ---
export const SendOtpSchema = z.object({
  email: emailSchema,
});

export const VerifyOtpSchema = z.object({
  email: emailSchema,
  token: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const OnboardingSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  faction: z.enum(['SEGA_SYNDICATE', 'NINTENDO_NOMADS', 'SONY_SENTINELS']),
});

// --- Helper: validate request body against a schema ---
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}
