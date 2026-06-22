-- GuildOS Platform Database Schema — guildos_core (isolated schema)
-- This migration replaces the old "tenants"-based schema with the full
-- guildos_core.organizations schema as defined in schema.sql

-- Schema & Extensions
CREATE SCHEMA IF NOT EXISTS guildos_core;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

SET search_path TO guildos_core;

-- Helper: extract org_id from JWT
CREATE OR REPLACE FUNCTION guildos_core.current_user_org_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- Core Tables

CREATE TABLE guildos_core.organizations (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    tier TEXT DEFAULT 'merchant' CHECK (tier IN ('merchant', 'wizard', 'time_lord')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    iot_webhook_url TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    tagline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    purchase_tags TEXT[] DEFAULT '{}',
    geo_lat NUMERIC(10, 7),
    geo_lng NUMERIC(10, 7),
    total_spend NUMERIC(19, 4) DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.inventory (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    platform TEXT,
    condition TEXT CHECK (condition IN ('NEW', 'CIB', 'LOOSE', 'SCRAP')),
    market_value NUMERIC(19, 4) NOT NULL DEFAULT 0,
    our_price NUMERIC(19, 4),
    scrap_value NUMERIC(19, 4) DEFAULT 0,
    stock_count INTEGER DEFAULT 1,
    is_legendary BOOLEAN DEFAULT FALSE,
    price_spike_flag BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    scanned_image_url TEXT,
    pricecharting_id TEXT,
    last_price_sync TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'RESERVED', 'SCRAP', 'ARCHIVED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.bounties (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

CREATE TABLE guildos_core.nexus_lfgs (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    creator_id UUID REFERENCES guildos_core.profiles(id),
    game_title TEXT NOT NULL,
    description TEXT,
    console_type TEXT,
    player_slots_total INTEGER NOT NULL DEFAULT 2,
    player_slots_filled INTEGER DEFAULT 1,
    max_spectators INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    lobby_status TEXT DEFAULT 'OPEN' CHECK (lobby_status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.nexus_lfg_participants (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    lfg_id UUID REFERENCES guildos_core.nexus_lfgs(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES guildos_core.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lfg_id, profile_id)
);

CREATE TABLE guildos_core.nexus_scoreboards (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    cabinet_name TEXT NOT NULL,
    game_title TEXT NOT NULL,
    player_tag TEXT NOT NULL,
    player_id UUID REFERENCES guildos_core.profiles(id),
    score BIGINT NOT NULL,
    rank INTEGER,
    status TEXT DEFAULT 'ACTIVE',
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.nexus_save_rooms (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    room_name TEXT NOT NULL,
    description TEXT,
    monthly_rate NUMERIC(19, 4) DEFAULT 15.00,
    capacity INTEGER DEFAULT 4,
    amenities TEXT[] DEFAULT '{}',
    subscriber_id UUID REFERENCES guildos_core.profiles(id),
    stripe_subscription_id TEXT,
    qr_code_hash TEXT,
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.faction_standings (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    faction TEXT NOT NULL CHECK (faction IN ('SEGA_SYNDICATE', 'NINTENDO_NOMADS', 'SONY_SENTINELS')),
    total_points NUMERIC(19, 4) DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    discount_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, month, year, faction)
);

CREATE TABLE guildos_core.price_history (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    inventory_id UUID REFERENCES guildos_core.inventory(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    market_value NUMERIC(19, 4) NOT NULL,
    source TEXT DEFAULT 'pricecharting',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.blacklist_entries (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    reported_by_org UUID REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
    hashed_id TEXT NOT NULL,
    geo_lat NUMERIC(10, 7),
    geo_lng NUMERIC(10, 7),
    reason TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'WARNING' CHECK (severity IN ('WARNING', 'CRITICAL', 'BAN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guildos_core.notifications (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

CREATE TABLE guildos_core.discount_codes (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- Enable RLS on ALL tables
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

-- RLS Policies (same as schema.sql)
CREATE POLICY "Users can view their organization" ON guildos_core.organizations FOR SELECT TO authenticated USING (id = guildos_core.current_user_org_id());

CREATE POLICY "Users can view profiles in their org" ON guildos_core.profiles FOR SELECT TO authenticated USING (organization_id = guildos_core.current_user_org_id());
CREATE POLICY "Users can update their own profile" ON guildos_core.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Staff can insert profiles" ON guildos_core.profiles FOR INSERT TO authenticated WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Tenant isolation for inventory" ON guildos_core.inventory FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Tenant isolation for bounties" ON guildos_core.bounties FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());
CREATE POLICY "Public can view active bounties" ON guildos_core.bounties FOR SELECT TO anon USING (status = 'ACTIVE');

CREATE POLICY "Tenant isolation for nexus lfgs" ON guildos_core.nexus_lfgs FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());
CREATE POLICY "Participants in org lfgs" ON guildos_core.nexus_lfg_participants FOR ALL TO authenticated USING (lfg_id IN (SELECT id FROM guildos_core.nexus_lfgs WHERE organization_id = guildos_core.current_user_org_id()));

CREATE POLICY "Tenant isolation for scoreboards" ON guildos_core.nexus_scoreboards FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());
CREATE POLICY "Public can view scoreboards" ON guildos_core.nexus_scoreboards FOR SELECT TO anon USING (true);

CREATE POLICY "Tenant isolation for save rooms" ON guildos_core.nexus_save_rooms FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Tenant isolation for faction standings" ON guildos_core.faction_standings FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Tenant isolation for price history" ON guildos_core.price_history FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "All tenants can read blacklist" ON guildos_core.blacklist_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tenants can insert own blacklist entries" ON guildos_core.blacklist_entries FOR INSERT TO authenticated WITH CHECK (reported_by_org = guildos_core.current_user_org_id());

CREATE POLICY "Users see their own notifications" ON guildos_core.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON guildos_core.notifications FOR INSERT TO authenticated WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Tenant isolation for discount codes" ON guildos_core.discount_codes FOR ALL TO authenticated USING (organization_id = guildos_core.current_user_org_id()) WITH CHECK (organization_id = guildos_core.current_user_org_id());

-- Indexes
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

-- Triggers
CREATE OR REPLACE FUNCTION guildos_core.update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON guildos_core.organizations FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON guildos_core.profiles FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON guildos_core.inventory FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();
CREATE TRIGGER trg_bounties_updated_at BEFORE UPDATE ON guildos_core.bounties FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();

CREATE OR REPLACE FUNCTION guildos_core.flag_legendary_item()
RETURNS TRIGGER AS $$ BEGIN IF NEW.market_value >= 150.00 THEN NEW.is_legendary = TRUE; ELSE NEW.is_legendary = FALSE; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_legendary BEFORE INSERT OR UPDATE OF market_value ON guildos_core.inventory FOR EACH ROW EXECUTE FUNCTION guildos_core.flag_legendary_item();

CREATE OR REPLACE FUNCTION guildos_core.update_level_tier()
RETURNS TRIGGER AS $$ BEGIN IF NEW.xp_points >= 25000 THEN NEW.level_tier = 'TIME_LORD'; ELSIF NEW.xp_points >= 5000 THEN NEW.level_tier = 'RETRO_MAGE'; ELSE NEW.level_tier = 'PEASANT'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_level_tier BEFORE INSERT OR UPDATE OF xp_points ON guildos_core.profiles FOR EACH ROW EXECUTE FUNCTION guildos_core.update_level_tier();

-- Seed demo org
INSERT INTO guildos_core.organizations (id, name, subdomain, tier, config, tagline)
VALUES ('00000000-0000-0000-0000-000000000001', 'Time Warp Gaming', 'timewarp', 'wizard', '{"demoMode": true, "theme": "terminal"}'::jsonb, 'Where retro lives forever.')
ON CONFLICT (id) DO NOTHING;

-- Search path for all roles
ALTER ROLE authenticated SET search_path = guildos_core, public, auth;
ALTER ROLE anon SET search_path = guildos_core, public, auth;
ALTER ROLE service_role SET search_path = guildos_core, public, auth;
