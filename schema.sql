-- ============================================================================
-- GUILDOS v1.0.0 — COMPLETE DATABASE SCHEMA
-- Multi-tenant retro-gaming SaaS with RLS enforcement
-- ISOLATED SCHEMA: guildos_core (NOT public — co-hosted Supabase)
-- ============================================================================

-- Supabase schema isolation: guildos_core
-- This project uses a dedicated schema to avoid collision with other apps
-- sharing the same free-tier Supabase database.

-- ============================================================================
-- SCHEMA CREATION & SEARCH PATH
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS guildos_core;
SET search_path TO guildos_core;

-- Enable extensions (in public schema, available to guildos_core)
-- NOTE: uuid-ossp intentionally removed — gen_random_uuid() from pgcrypto
-- is the PG13+ built-in replacement for uuid_generate_v4().
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Extract current user's organization_id from JWT app_metadata
CREATE OR REPLACE FUNCTION guildos_core.current_user_org_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ORGANIZATIONS (Tenant / Storefronts)
CREATE TABLE guildos_core.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                            -- "Time Warp Gaming"
    subdomain TEXT UNIQUE NOT NULL,                -- "timewarp"
    custom_domain TEXT UNIQUE,                     -- "shop.timewarpgaming.com"
    tier TEXT DEFAULT 'merchant' CHECK (tier IN ('merchant', 'wizard', 'time_lord')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    iot_webhook_url TEXT,                           -- Make/Zapier webhook endpoint
    config JSONB DEFAULT '{}'::jsonb,               -- Tenant-specific config
    logo_url TEXT,
    tagline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Gamified User Accounts)
CREATE TABLE guildos_core.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'customer' CHECK (role IN ('owner', 'admin', 'staff', 'customer')),
    faction TEXT CHECK (faction IN ('SEGA_SYNDICATE', 'NINTENDO_NOMADS', 'SONY_SENTINELS')),
    xp_points INTEGER DEFAULT 0,
    level_tier TEXT DEFAULT 'PEASANT' CHECK (level_tier IN ('PEASANT', 'RETRO_MAGE', 'TIME_LORD')),
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    purchase_tags TEXT[] DEFAULT '{}',              -- ['JRPG', 'PLATFORMER', 'SHOOTER']
    geo_lat NUMERIC(10, 7),
    geo_lng NUMERIC(10, 7),
    total_spend NUMERIC(19, 4) DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY (Physical Stock — The Loot Matrix)
CREATE TABLE guildos_core.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    platform TEXT,                                  -- 'SNES', 'NES', 'PS1', 'GENESIS', etc.
    condition TEXT CHECK (condition IN ('NEW', 'CIB', 'LOOSE', 'SCRAP')),
    market_value NUMERIC(19, 4) NOT NULL DEFAULT 0,
    our_price NUMERIC(19, 4),                      -- Store's asking price
    scrap_value NUMERIC(19, 4) DEFAULT 0,          -- Value of harvestable components
    stock_count INTEGER DEFAULT 1,
    is_legendary BOOLEAN DEFAULT FALSE,            -- market_value >= 150
    price_spike_flag BOOLEAN DEFAULT FALSE,        -- Triggered by pricing cron
    tags TEXT[] DEFAULT '{}',                       -- ['JRPG', 'RARE', 'GRAIL']
    image_url TEXT,                                 -- Supabase Storage path
    scanned_image_url TEXT,                         -- Original scan image
    pricecharting_id TEXT,                          -- PriceCharting API item ID
    last_price_sync TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'RESERVED', 'SCRAP', 'ARCHIVED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOUNTIES (Community Supply Chain — The Quest Board)
CREATE TABLE guildos_core.bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    target_item_name TEXT NOT NULL,
    platform TEXT,
    base_market_price NUMERIC(19, 4) DEFAULT 0,
    scarcity_mult NUMERIC(5, 2) DEFAULT 1.00,
    store_credit_value NUMERIC(19, 4) GENERATED ALWAYS AS (base_market_price * scarcity_mult) STORED,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
    fulfilled_by UUID REFERENCES guildos_core.profiles(id),
    fulfilled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEXUS LFG (Looking For Group — Space Monetization)
CREATE TABLE guildos_core.nexus_lfgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    creator_id UUID REFERENCES guildos_core.profiles(id),
    game_title TEXT NOT NULL,
    description TEXT,
    console_type TEXT,                             -- 'N64', 'PS2', 'ARCADE', etc.
    player_slots_total INTEGER NOT NULL DEFAULT 2,
    player_slots_filled INTEGER DEFAULT 1,
    max_spectators INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    lobby_status TEXT DEFAULT 'OPEN' CHECK (lobby_status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEXUS LFG PARTICIPANTS (Who joined which lobby)
CREATE TABLE guildos_core.nexus_lfg_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lfg_id UUID REFERENCES guildos_core.nexus_lfgs(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES guildos_core.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lfg_id, profile_id)
);

-- NEXUS SCOREBOARDS (Ghost Data Leaderboards)
CREATE TABLE guildos_core.nexus_scoreboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    cabinet_name TEXT NOT NULL,                    -- 'Cabinet A', 'Cabinet B'
    game_title TEXT NOT NULL,                      -- 'PAC-MAN', 'GALAGA'
    player_tag TEXT NOT NULL,                      -- 'TRON_99'
    player_id UUID REFERENCES guildos_core.profiles(id),  -- Optional link to profile
    score BIGINT NOT NULL,
    rank INTEGER,                                  -- Computed rank within game
    status TEXT DEFAULT 'ACTIVE',                  -- 'ACTIVE', 'DETHRONED'
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEXUS SAVE ROOMS (Space Rental Subscriptions)
CREATE TABLE guildos_core.nexus_save_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    room_name TEXT NOT NULL,                       -- 'Save Room Alpha'
    description TEXT,
    monthly_rate NUMERIC(19, 4) DEFAULT 15.00,
    capacity INTEGER DEFAULT 4,
    amenities TEXT[] DEFAULT '{}',                 -- ['CRT_DISPLAY', 'COUCH', 'PREMIUM_WIFI']
    subscriber_id UUID REFERENCES guildos_core.profiles(id),
    stripe_subscription_id TEXT,
    qr_code_hash TEXT,                             -- Encrypted access QR
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACTION STANDINGS (Monthly Faction War Tracking)
CREATE TABLE guildos_core.faction_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    faction TEXT NOT NULL CHECK (faction IN ('SEGA_SYNDICATE', 'NINTENDO_NOMADS', 'SONY_SENTINELS')),
    total_points NUMERIC(19, 4) DEFAULT 0,         -- Total transaction USD from faction members
    is_winner BOOLEAN DEFAULT FALSE,
    discount_active BOOLEAN DEFAULT FALSE,         -- 10% discount flag for winning faction
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, month, year, faction)
);

-- PRICE HISTORY (Market Value Tracking for Algorithmic Pricing)
CREATE TABLE guildos_core.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES guildos_core.inventory(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    market_value NUMERIC(19, 4) NOT NULL,
    source TEXT DEFAULT 'pricecharting',            -- 'pricecharting', 'manual', 'cron'
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- BLACKLIST ENTRIES (Zero-Knowledge Fraud Ledger)
CREATE TABLE guildos_core.blacklist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by_org UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    hashed_id TEXT NOT NULL,                       -- SHA-256 of ID metadata
    geo_lat NUMERIC(10, 7),
    geo_lng NUMERIC(10, 7),
    reason TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'WARNING' CHECK (severity IN ('WARNING', 'CRITICAL', 'BAN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS (In-App Notification Queue)
CREATE TABLE guildos_core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES guildos_core.profiles(id),
    type TEXT NOT NULL CHECK (type IN (
        'PRICE_SPIKE', 'BOUNTY_FULFILLED', 'SCORE_DETHRONED',
        'ORACLE_MATCH', 'GRAIL_DROP', 'FACTION_WIN',
        'B2B_PROPOSAL', 'BLACKLIST_ALERT', 'SYSTEM', 'KONAMI'
    )),
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISCOUNT CODES (Generated by Konami Code + Promotions)
CREATE TABLE guildos_core.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    source TEXT DEFAULT 'KONAMI' CHECK (source IN ('KONAMI', 'FACTION_WIN', 'PROMOTION', 'MANUAL')),
    used_by UUID REFERENCES guildos_core.profiles(id),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on ALL tables in guildos_core schema
ALTER TABLE guildos_core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.nexus_lfgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.nexus_lfg_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.nexus_scoreboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.nexus_save_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.faction_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.blacklist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guildos_core.discount_codes ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: users can view their own org
CREATE POLICY "Users can view their organization"
ON guildos_core.organizations FOR SELECT TO authenticated
USING (id = guildos_core.current_user_org_id());

-- PROFILES: users can view profiles in their org, update their own
CREATE POLICY "Users can view profiles in their org"
ON guildos_core.profiles FOR SELECT TO authenticated
USING (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Users can update their own profile"
ON guildos_core.profiles FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Staff can insert profiles"
ON guildos_core.profiles FOR INSERT TO authenticated
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- INVENTORY: full tenant isolation
CREATE POLICY "Tenant isolation for inventory"
ON guildos_core.inventory FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- BOUNTIES: tenant isolation + public read for active bounties
CREATE POLICY "Tenant isolation for bounties"
ON guildos_core.bounties FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Public can view active bounties"
ON guildos_core.bounties FOR SELECT TO anon
USING (status = 'ACTIVE');

-- NEXUS LFGs: tenant isolation
CREATE POLICY "Tenant isolation for nexus lfgs"
ON guildos_core.nexus_lfgs FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- NEXUS LFG PARTICIPANTS: linked to LFG ownership
CREATE POLICY "Participants in org lfgs"
ON guildos_core.nexus_lfg_participants FOR ALL TO authenticated
USING (
    lfg_id IN (SELECT id FROM guildos_core.nexus_lfgs WHERE organization_id = guildos_core.current_user_org_id())
);

-- NEXUS SCOREBOARDS: tenant isolation + public read
CREATE POLICY "Tenant isolation for scoreboards"
ON guildos_core.nexus_scoreboards FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Public can view scoreboards"
ON guildos_core.nexus_scoreboards FOR SELECT TO anon
USING (true);

-- NEXUS SAVE ROOMS: tenant isolation
CREATE POLICY "Tenant isolation for save rooms"
ON guildos_core.nexus_save_rooms FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- FACTION STANDINGS: tenant isolation
CREATE POLICY "Tenant isolation for faction standings"
ON guildos_core.faction_standings FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- PRICE HISTORY: tenant isolation
CREATE POLICY "Tenant isolation for price history"
ON guildos_core.price_history FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- BLACKLIST: cross-tenant read (all authenticated can read), own-tenant write
CREATE POLICY "All tenants can read blacklist"
ON guildos_core.blacklist_entries FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Tenants can insert own blacklist entries"
ON guildos_core.blacklist_entries FOR INSERT TO authenticated
WITH CHECK (reported_by_org = guildos_core.current_user_org_id());

-- NOTIFICATIONS: users see their own
CREATE POLICY "Users see their own notifications"
ON guildos_core.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON guildos_core.notifications FOR INSERT TO authenticated
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- DISCOUNT CODES: tenant isolation
CREATE POLICY "Tenant isolation for discount codes"
ON guildos_core.discount_codes FOR ALL TO authenticated
USING (organization_id = guildos_core.current_user_org_id())
WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_inventory_org ON guildos_core.inventory(organization_id);
CREATE INDEX idx_inventory_status ON guildos_core.inventory(status);
CREATE INDEX idx_inventory_legendary ON guildos_core.inventory(is_legendary) WHERE is_legendary = TRUE;
CREATE INDEX idx_inventory_spike ON guildos_core.inventory(price_spike_flag) WHERE price_spike_flag = TRUE;
CREATE INDEX idx_bounties_org_status ON guildos_core.bounties(organization_id, status);
CREATE INDEX idx_profiles_org ON guildos_core.profiles(organization_id);
CREATE INDEX idx_profiles_faction ON guildos_core.profiles(faction);
CREATE INDEX idx_nexus_lfgs_org_status ON guildos_core.nexus_lfgs(organization_id, lobby_status);
CREATE INDEX idx_scoreboards_game ON guildos_core.nexus_scoreboards(organization_id, game_title, score DESC);
CREATE INDEX idx_notifications_user ON guildos_core.notifications(user_id, read_at);
CREATE INDEX idx_price_history_item ON guildos_core.price_history(inventory_id, recorded_at DESC);
CREATE INDEX idx_blacklist_geo ON guildos_core.blacklist_entries(geo_lat, geo_lng) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION guildos_core.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON guildos_core.organizations
  FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON guildos_core.profiles
  FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON guildos_core.inventory
  FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();

CREATE TRIGGER trg_bounties_updated_at
  BEFORE UPDATE ON guildos_core.bounties
  FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();

-- Auto-flag legendary items (market_value >= 150)
CREATE OR REPLACE FUNCTION guildos_core.flag_legendary_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.market_value >= 150.00 THEN
    NEW.is_legendary = TRUE;
  ELSE
    NEW.is_legendary = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_legendary
  BEFORE INSERT OR UPDATE OF market_value ON guildos_core.inventory
  FOR EACH ROW EXECUTE FUNCTION guildos_core.flag_legendary_item();

-- Auto-calculate player level tier from XP
CREATE OR REPLACE FUNCTION guildos_core.update_level_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp_points >= 25000 THEN
    NEW.level_tier = 'TIME_LORD';
  ELSIF NEW.xp_points >= 5000 THEN
    NEW.level_tier = 'RETRO_MAGE';
  ELSE
    NEW.level_tier = 'PEASANT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_level_tier
  BEFORE INSERT OR UPDATE OF xp_points ON guildos_core.profiles
  FOR EACH ROW EXECUTE FUNCTION guildos_core.update_level_tier();

-- ============================================================================
-- SEED DATA: Demo organization for development
-- ============================================================================

-- Only insert if the org doesn't exist yet
INSERT INTO guildos_core.organizations (id, name, subdomain, tier, config, tagline)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Time Warp Gaming',
    'timewarp',
    'wizard',
    '{"demoMode": true, "theme": "terminal"}'::jsonb,
    'Where retro lives forever.'
) ON CONFLICT (id) DO NOTHING;

-- Reset search_path for subsequent connections
ALTER ROLE authenticated SET search_path = guildos_core, public, auth;
ALTER ROLE anon SET search_path = guildos_core, public, auth;
ALTER ROLE service_role SET search_path = guildos_core, public, auth;
