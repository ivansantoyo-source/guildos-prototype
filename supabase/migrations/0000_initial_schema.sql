-- GuildOS Platform Database Schema

-- TENANTS (Stores)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY (Physical Stock)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    item_name VARCHAR(255) NOT NULL,
    market_value NUMERIC(10,2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    stock_count INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE' -- ACTIVE, SCRAP, etc.
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON inventory
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- PROFILES (Gamified User Accounts)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    display_name VARCHAR(100) NOT NULL,
    faction VARCHAR(50) CHECK (faction IN ('Sega Syndicate', 'Nintendo Nomads', 'Sony Sentinels')),
    xp_points INTEGER DEFAULT 0
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_tenant_isolation ON profiles
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- BOUNTIES (Community Supply Chain)
CREATE TABLE bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    target_item_name VARCHAR(255) NOT NULL,
    scarcity_mult NUMERIC(3,2) DEFAULT 1.00
);

ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY bounties_tenant_isolation ON bounties
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- NEXUS LFG (Space Monetization)
CREATE TABLE nexus_lfgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    creator_id UUID REFERENCES profiles(id),
    lobby_status VARCHAR(50) DEFAULT 'open',
    game_title VARCHAR(255),
    player_slots_total INTEGER,
    player_slots_filled INTEGER DEFAULT 1,
    start_time TIMESTAMPTZ
);

ALTER TABLE nexus_lfgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY nexus_lfgs_tenant_isolation ON nexus_lfgs
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
