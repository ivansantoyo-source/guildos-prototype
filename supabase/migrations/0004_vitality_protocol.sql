-- GuildOS v2.2.0 — Vitality Protocol
-- Stamina, debuffs, vitality quests, potions menu, XP engine, character stats

-- ============================================================================
-- EXTEND PROFILES FOR VITALITY
-- ============================================================================
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 100 CHECK (stamina BETWEEN 0 AND 100);
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS max_stamina INTEGER DEFAULT 100;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS vitality_xp INTEGER DEFAULT 0;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS mind_stat INTEGER DEFAULT 5 CHECK (mind_stat BETWEEN 1 AND 20);
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS body_stat INTEGER DEFAULT 5 CHECK (body_stat BETWEEN 1 AND 20);
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS soul_stat INTEGER DEFAULT 5 CHECK (soul_stat BETWEEN 1 AND 20);
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS debuff_type TEXT CHECK (debuff_type IN (NULL, 'SEDENTARY', 'DEHYDRATION', 'FATIGUE', 'SCREEN_FATIGUE'));
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS debuff_until TIMESTAMPTZ;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS consecutive_hours INTEGER DEFAULT 0;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS hydration_count INTEGER DEFAULT 0;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS stretch_count INTEGER DEFAULT 0;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS parental_controls_enabled BOOLEAN DEFAULT false;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS parental_daily_limit_minutes INTEGER;
ALTER TABLE guildos_core.profiles ADD COLUMN IF NOT EXISTS parental_spend_limit NUMERIC(10,2);

-- ============================================================================
-- FIX XP THRESHOLD: update trigger to match frontend (10,000 not 5,000)
-- ============================================================================
CREATE OR REPLACE FUNCTION guildos_core.trg_profiles_level_tier_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp_points >= 25000 THEN
    NEW.level_tier = 'TIME_LORD';
  ELSIF NEW.xp_points >= 10000 THEN
    NEW.level_tier = 'RETRO_MAGE';
  ELSE
    NEW.level_tier = 'PEASANT';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VITALITY QUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.vitality_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('STRETCH', 'HYDRATION', 'STEPS', 'POSTURE_CHECK', 'EYE_REST', 'SOCIAL', 'MINDFULNESS')),
  xp_reward INTEGER DEFAULT 50,
  stamina_restore INTEGER DEFAULT 20,
  cooldown_minutes INTEGER DEFAULT 60,
  qr_code_hash TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.vitality_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY vq_select_org ON guildos_core.vitality_quests FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- VITALITY COMPLETIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.vitality_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES guildos_core.vitality_quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  xp_earned INTEGER NOT NULL,
  stamina_restored INTEGER NOT NULL
);

CREATE INDEX idx_vc_profile ON guildos_core.vitality_completions(profile_id, completed_at DESC);

ALTER TABLE guildos_core.vitality_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY vc_select_org ON guildos_core.vitality_completions FOR SELECT USING (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));
CREATE POLICY vc_insert_org ON guildos_core.vitality_completions FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- POTIONS MENU TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.potions_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('TEA', 'SMOOTHIE', 'NOOTROPIC', 'MEAL', 'SNACK', 'HYDRATION')),
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  vitality_boost JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.potions_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY pm_select_org ON guildos_core.potions_menu FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- POTION ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.potion_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')),
  station_id UUID REFERENCES guildos_core.stations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guildos_core.potion_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_select_org ON guildos_core.potion_orders FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY po_insert_org ON guildos_core.potion_orders FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid) AND profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- XP TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS guildos_core.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES guildos_core.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_xp_tx_profile ON guildos_core.xp_transactions(profile_id, created_at DESC);

ALTER TABLE guildos_core.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY xpt_select_org ON guildos_core.xp_transactions FOR SELECT USING (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));
CREATE POLICY xpt_insert_org ON guildos_core.xp_transactions FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM guildos_core.profiles WHERE organization_id = (SELECT current_setting('app.current_org_id', true)::uuid)));

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.potion_orders;
