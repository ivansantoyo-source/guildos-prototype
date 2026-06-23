-- GuildOS v2.2.0 — Legal Armor & Exploit Mitigation
-- Waivers, identity verification, chain of custody, audit logging, CSP

-- ============================================================================
-- LEGAL WAIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.legal_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('LIABILITY', 'ACTIVITY', 'VR', 'EVENT', 'MINOR_GUARDIAN', 'PHOTO_RELEASE', 'GENERAL')),
  content_markdown TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  requires_guardian_if_minor BOOLEAN DEFAULT true,
  minor_age_threshold INTEGER DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.legal_waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY lw_select_org ON guildos_core.legal_waivers FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- WAIVER ACCEPTANCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.waiver_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id UUID REFERENCES guildos_core.legal_waivers(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signature_data TEXT,
  guardian_profile_id UUID REFERENCES guildos_core.profiles(id),
  accepted_version INTEGER NOT NULL,
  UNIQUE(waiver_id, profile_id)
);

ALTER TABLE guildos_core.waiver_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_select_org ON guildos_core.waiver_acceptances FOR SELECT USING (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));
CREATE POLICY wa_insert_org ON guildos_core.waiver_acceptances FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- IDENTITY VERIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('STRIPE_IDENTITY', 'MANUAL_ID_CHECK', 'GUARDIAN_VERIFICATION')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
  stripe_verification_session_id TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES guildos_core.profiles(id),
  id_document_type TEXT,
  id_issuing_country TEXT,
  id_expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.identity_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY iv_select_org ON guildos_core.identity_verifications FOR SELECT USING (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- CHAIN OF CUSTODY TABLE (pawn shop compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.chain_of_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES guildos_core.inventory(id) ON DELETE SET NULL,
  bounty_id UUID REFERENCES guildos_core.bounties(id) ON DELETE SET NULL,
  seller_profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE SET NULL,
  seller_id_verified BOOLEAN DEFAULT false,
  seller_identity_verification_id UUID REFERENCES guildos_core.identity_verifications(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('TRADE_IN', 'CASH_SALE', 'BOUNTY_FULFILLMENT', 'DONATION', 'AUCTION_PURCHASE', 'ESTATE_LOT')),
  seller_stated_value NUMERIC(19,4),
  amount_paid NUMERIC(19,4),
  payment_method TEXT CHECK (payment_method IN ('CASH', 'STORE_CREDIT', 'CHECK', 'BANK_TRANSFER', 'CRYPTO')),
  serial_number TEXT,
  condition_notes TEXT,
  seller_signed_affidavit BOOLEAN DEFAULT false,
  holding_period_days INTEGER DEFAULT 21,
  holding_period_end DATE,
  law_enforcement_reported BOOLEAN DEFAULT false,
  law_enforcement_report_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chain_inventory ON guildos_core.chain_of_custody(inventory_id);
CREATE INDEX idx_chain_seller ON guildos_core.chain_of_custody(seller_profile_id);
CREATE INDEX idx_chain_holding ON guildos_core.chain_of_custody(holding_period_end) WHERE holding_period_end IS NOT NULL;

ALTER TABLE guildos_core.chain_of_custody ENABLE ROW LEVEL SECURITY;
CREATE POLICY coc_select_org ON guildos_core.chain_of_custody FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY coc_insert_org ON guildos_core.chain_of_custody FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_resource ON guildos_core.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_profile ON guildos_core.audit_log(profile_id, created_at DESC);
CREATE INDEX idx_audit_org ON guildos_core.audit_log(organization_id, created_at DESC);

ALTER TABLE guildos_core.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY al_select_org ON guildos_core.audit_log FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY al_insert_org ON guildos_core.audit_log FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- CSP VIOLATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.csp_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  blocked_uri TEXT,
  violated_directive TEXT,
  document_uri TEXT,
  source_file TEXT,
  line_number INTEGER,
  reported_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.csp_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY csp_insert_anon ON guildos_core.csp_violations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY csp_select_authenticated ON guildos_core.csp_violations FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- LEGAL PAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COOKIE_POLICY', 'REFUND_POLICY', 'CODE_OF_CONDUCT', 'CUSTOM')),
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE guildos_core.legal_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lp_select_org ON guildos_core.legal_pages FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
