-- GuildOS v2.2.0 — LFG Split-Pay Escrow System
-- Extends nexus_lfgs for fractional payments, wallets, Stripe Connect support

-- ============================================================================
-- EXTEND nexus_lfgs FOR SPLIT-PAY
-- ============================================================================
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS total_cost NUMERIC(19,4);
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS cost_per_player NUMERIC(19,4);
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'NOT_REQUIRED' CHECK (payment_status IN ('NOT_REQUIRED', 'PENDING', 'PARTIALLY_FUNDED', 'FULLY_FUNDED', 'REFUNDING', 'REFUNDED'));
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS stripe_transfer_group TEXT;
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS host_profile_id UUID REFERENCES guildos_core.profiles(id);
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS auto_refund_at TIMESTAMPTZ;
ALTER TABLE guildos_core.nexus_lfgs ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- ============================================================================
-- EXTEND nexus_lfg_participants FOR PAYMENT TRACKING
-- ============================================================================
ALTER TABLE guildos_core.nexus_lfg_participants ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false;
ALTER TABLE guildos_core.nexus_lfg_participants ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(19,4);
ALTER TABLE guildos_core.nexus_lfg_participants ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED'));
ALTER TABLE guildos_core.nexus_lfg_participants ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE guildos_core.nexus_lfg_participants ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  balance NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_spent NUMERIC(19,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_select_org ON guildos_core.wallets FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY wallets_insert_org ON guildos_core.wallets FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY wallets_update_org ON guildos_core.wallets FOR UPDATE USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- WALLET TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES guildos_core.wallets(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CREDIT_BOUNTY', 'CREDIT_REFERRAL', 'CREDIT_ACHIEVEMENT', 'DEBIT_PURCHASE', 'DEBIT_LFG_BOOKING', 'DEBIT_SAVE_ROOM', 'REFUND')),
  amount NUMERIC(19,4) NOT NULL,
  description TEXT,
  reference_type TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wallet_tx_profile ON guildos_core.wallet_transactions(profile_id, created_at DESC);

ALTER TABLE guildos_core.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wtx_select_org ON guildos_core.wallet_transactions FOR SELECT USING (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));
CREATE POLICY wtx_insert_org ON guildos_core.wallet_transactions FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.nexus_lfgs;
ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.wallets;
