-- GuildOS Bounty Board Arbitrage Engine
-- Extends guildos_core.bounties with order types, fulfillment pipeline, and arbitrage matching
-- Schema: guildos_core

SET search_path TO guildos_core;

-- ============================================================================
-- 1. EXTEND guildos_core.bounties
-- ============================================================================

ALTER TABLE guildos_core.bounties
  ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'BOUNTY'
    CHECK (order_type IN ('BOUNTY', 'LIMIT_BUY', 'LIMIT_SELL')),
  ADD COLUMN IF NOT EXISTS trigger_price NUMERIC(19, 4),
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'OPEN'
    CHECK (fulfillment_status IN ('OPEN', 'CLAIMED', 'IN_TRANSIT', 'RECEIVED', 'VERIFIED', 'PAID', 'DISPUTED')),
  ADD COLUMN IF NOT EXISTS fulfilled_by_profile UUID REFERENCES guildos_core.profiles(id),
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS condition_notes TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Convert store_credit_value from GENERATED column to regular column.
-- This allows LIMIT_BUY/LIMIT_SELL to set their own value instead of being forced
-- to base_market_price * scarcity_mult. The application layer handles the computation.
-- PG 12+ syntax to drop the generated expression.
ALTER TABLE guildos_core.bounties
  ALTER COLUMN store_credit_value DROP EXPRESSION;

-- Index for order type queries
CREATE INDEX IF NOT EXISTS idx_bounties_order_type ON guildos_core.bounties(order_type);
CREATE INDEX IF NOT EXISTS idx_bounties_fulfillment_status ON guildos_core.bounties(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_bounties_trigger_price ON guildos_core.bounties(trigger_price) WHERE trigger_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_claimed_by ON guildos_core.bounties(claimed_by) WHERE claimed_by IS NOT NULL;

-- ============================================================================
-- 2. ARBITRAGE MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guildos_core.arbitrage_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
  source_bounty_id UUID NOT NULL REFERENCES guildos_core.bounties(id) ON DELETE CASCADE,
  target_inventory_id UUID REFERENCES guildos_core.inventory(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  platform TEXT,
  market_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
  buy_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
  sell_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
  spread_pct NUMERIC(8, 4) DEFAULT 0,
  margin NUMERIC(19, 4) DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'EXECUTED', 'EXPIRED', 'CANCELLED')),
  confidence NUMERIC(5, 2) DEFAULT 0.00,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for arbitrage matching
CREATE INDEX IF NOT EXISTS idx_arbitrage_org_status ON guildos_core.arbitrage_matches(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_bounty ON guildos_core.arbitrage_matches(source_bounty_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_spread ON guildos_core.arbitrage_matches(spread_pct DESC) WHERE status = 'ACTIVE';

-- ============================================================================
-- 3. BOUNTY STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guildos_core.bounty_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES guildos_core.organizations(id) ON DELETE RESTRICT,
  profile_id UUID NOT NULL REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  hunter_tag TEXT NOT NULL,
  total_fulfilled INTEGER DEFAULT 0,
  total_earned NUMERIC(19, 4) DEFAULT 0,
  current_claims INTEGER DEFAULT 0,
  reputation_score NUMERIC(8, 2) DEFAULT 0.00,
  avg_fulfillment_time_hours NUMERIC(10, 2),
  last_claim_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_bounty_stats_org ON guildos_core.bounty_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_bounty_stats_reputation ON guildos_core.bounty_stats(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_bounty_stats_earned ON guildos_core.bounty_stats(total_earned DESC);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Arbitrage matches: tenant isolation
ALTER TABLE guildos_core.arbitrage_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for arbitrage_matches"
  ON guildos_core.arbitrage_matches
  FOR ALL
  TO authenticated
  USING (organization_id = guildos_core.current_user_org_id())
  WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Public can view active arbitrage matches"
  ON guildos_core.arbitrage_matches
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE');

-- Bounty stats: tenant isolation
ALTER TABLE guildos_core.bounty_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for bounty_stats"
  ON guildos_core.bounty_stats
  FOR ALL
  TO authenticated
  USING (organization_id = guildos_core.current_user_org_id())
  WITH CHECK (organization_id = guildos_core.current_user_org_id());

CREATE POLICY "Public can view bounty_stats"
  ON guildos_core.bounty_stats
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- 5. TRIGGERS (skipped — update_updated_at() function not yet in guildos_core)
-- ============================================================================

-- Trigger for bounty fulfillment stats (deferred)
-- Note: increment_bounty_stats trigger function and trg_bounties_fulfillment_stats
-- are deferred until guildos_core.update_updated_at() helper is created.
-- Stats will be managed by application logic in the API routes for now.

-- ============================================================================
-- 5. ADD TO SUPABASE REALTIME
-- ============================================================================

-- Enable realtime for the new tables (skip if already in publication)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'guildos_core' AND tablename = 'arbitrage_matches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.arbitrage_matches;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'guildos_core' AND tablename = 'bounty_stats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.bounty_stats;
  END IF;
END $$;

-- ============================================================================
-- 5b. FIX FK CASCADES — ensure child rows are cleaned up when parent is deleted
-- These constraints were originally created with ON DELETE RESTRICT / NO ACTION
-- in 0000_initial_schema.sql. Changing to CASCADE prevents orphaned rows.
-- ============================================================================

-- inventory.organization_id -> organizations
ALTER TABLE guildos_core.inventory
  DROP CONSTRAINT IF EXISTS inventory_organization_id_fkey,
  ADD CONSTRAINT inventory_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- bounties.organization_id -> organizations
ALTER TABLE guildos_core.bounties
  DROP CONSTRAINT IF EXISTS bounties_organization_id_fkey,
  ADD CONSTRAINT bounties_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- nexus_scoreboards.organization_id -> organizations
ALTER TABLE guildos_core.nexus_scoreboards
  DROP CONSTRAINT IF EXISTS nexus_scoreboards_organization_id_fkey,
  ADD CONSTRAINT nexus_scoreboards_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- faction_standings.organization_id -> organizations
ALTER TABLE guildos_core.faction_standings
  DROP CONSTRAINT IF EXISTS faction_standings_organization_id_fkey,
  ADD CONSTRAINT faction_standings_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- price_history.organization_id -> organizations
ALTER TABLE guildos_core.price_history
  DROP CONSTRAINT IF EXISTS price_history_organization_id_fkey,
  ADD CONSTRAINT price_history_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- notifications.organization_id -> organizations
ALTER TABLE guildos_core.notifications
  DROP CONSTRAINT IF EXISTS notifications_organization_id_fkey,
  ADD CONSTRAINT notifications_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;

-- notifications.user_id -> profiles
ALTER TABLE guildos_core.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES guildos_core.profiles(id) ON DELETE CASCADE;

-- discount_codes.organization_id -> organizations
ALTER TABLE guildos_core.discount_codes
  DROP CONSTRAINT IF EXISTS discount_codes_organization_id_fkey,
  ADD CONSTRAINT discount_codes_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES guildos_core.organizations(id) ON DELETE CASCADE;
