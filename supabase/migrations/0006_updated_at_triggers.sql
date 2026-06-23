-- GuildOS v2.2.0 -- updated_at triggers for all tables
-- Adds updated_at columns to 22 tables that are missing them, creates a shared
-- trigger function, and attaches BEFORE UPDATE triggers to all tables.

SET search_path TO guildos_core;

-- ============================================================================
-- 1. Shared trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION guildos_core.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Add updated_at to tables missing it (22 tables)
-- ============================================================================

ALTER TABLE guildos_core.audit_log
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.blacklist_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.chain_of_custody
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.csp_violations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.discount_codes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.environment_readings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.faction_standings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.identity_verifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.legal_pages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.nexus_lfg_participants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.nexus_lfgs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.nexus_save_rooms
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.nexus_scoreboards
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.potion_orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.potions_menu
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.price_history
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.vitality_completions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.vitality_quests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.waiver_acceptances
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.wallet_transactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE guildos_core.xp_transactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 3. Attach BEFORE UPDATE triggers to ALL tables that have updated_at
--    (both newly added and pre-existing columns without triggers)
-- ============================================================================

-- Trigger:
--  1. Newly added columns + existing columns that had no trigger
--  2. Tables that already had triggers (skipped -- they already have one)
--  3. Use IF NOT EXISTS to skip tables with existing triggers
--     (DO blocks because CREATE TRIGGER has no IF NOT EXISTS)

-- audit_log
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_log_updated_at' AND tgrelid = 'guildos_core.audit_log'::regclass) THEN
    CREATE TRIGGER trg_audit_log_updated_at BEFORE UPDATE ON guildos_core.audit_log FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- blacklist_entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blacklist_entries_updated_at' AND tgrelid = 'guildos_core.blacklist_entries'::regclass) THEN
    CREATE TRIGGER trg_blacklist_entries_updated_at BEFORE UPDATE ON guildos_core.blacklist_entries FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- chain_of_custody
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_chain_of_custody_updated_at' AND tgrelid = 'guildos_core.chain_of_custody'::regclass) THEN
    CREATE TRIGGER trg_chain_of_custody_updated_at BEFORE UPDATE ON guildos_core.chain_of_custody FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- csp_violations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_csp_violations_updated_at' AND tgrelid = 'guildos_core.csp_violations'::regclass) THEN
    CREATE TRIGGER trg_csp_violations_updated_at BEFORE UPDATE ON guildos_core.csp_violations FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- discount_codes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_discount_codes_updated_at' AND tgrelid = 'guildos_core.discount_codes'::regclass) THEN
    CREATE TRIGGER trg_discount_codes_updated_at BEFORE UPDATE ON guildos_core.discount_codes FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- environment_readings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_environment_readings_updated_at' AND tgrelid = 'guildos_core.environment_readings'::regclass) THEN
    CREATE TRIGGER trg_environment_readings_updated_at BEFORE UPDATE ON guildos_core.environment_readings FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- faction_standings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_faction_standings_updated_at' AND tgrelid = 'guildos_core.faction_standings'::regclass) THEN
    CREATE TRIGGER trg_faction_standings_updated_at BEFORE UPDATE ON guildos_core.faction_standings FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- identity_verifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_identity_verifications_updated_at' AND tgrelid = 'guildos_core.identity_verifications'::regclass) THEN
    CREATE TRIGGER trg_identity_verifications_updated_at BEFORE UPDATE ON guildos_core.identity_verifications FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- legal_pages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_legal_pages_updated_at' AND tgrelid = 'guildos_core.legal_pages'::regclass) THEN
    CREATE TRIGGER trg_legal_pages_updated_at BEFORE UPDATE ON guildos_core.legal_pages FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- nexus_lfg_participants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_nexus_lfg_participants_updated_at' AND tgrelid = 'guildos_core.nexus_lfg_participants'::regclass) THEN
    CREATE TRIGGER trg_nexus_lfg_participants_updated_at BEFORE UPDATE ON guildos_core.nexus_lfg_participants FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- nexus_lfgs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_nexus_lfgs_updated_at' AND tgrelid = 'guildos_core.nexus_lfgs'::regclass) THEN
    CREATE TRIGGER trg_nexus_lfgs_updated_at BEFORE UPDATE ON guildos_core.nexus_lfgs FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- nexus_save_rooms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_nexus_save_rooms_updated_at' AND tgrelid = 'guildos_core.nexus_save_rooms'::regclass) THEN
    CREATE TRIGGER trg_nexus_save_rooms_updated_at BEFORE UPDATE ON guildos_core.nexus_save_rooms FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- nexus_scoreboards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_nexus_scoreboards_updated_at' AND tgrelid = 'guildos_core.nexus_scoreboards'::regclass) THEN
    CREATE TRIGGER trg_nexus_scoreboards_updated_at BEFORE UPDATE ON guildos_core.nexus_scoreboards FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notifications_updated_at' AND tgrelid = 'guildos_core.notifications'::regclass) THEN
    CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON guildos_core.notifications FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- potion_orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_potion_orders_updated_at' AND tgrelid = 'guildos_core.potion_orders'::regclass) THEN
    CREATE TRIGGER trg_potion_orders_updated_at BEFORE UPDATE ON guildos_core.potion_orders FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- potions_menu
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_potions_menu_updated_at' AND tgrelid = 'guildos_core.potions_menu'::regclass) THEN
    CREATE TRIGGER trg_potions_menu_updated_at BEFORE UPDATE ON guildos_core.potions_menu FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- price_history
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_price_history_updated_at' AND tgrelid = 'guildos_core.price_history'::regclass) THEN
    CREATE TRIGGER trg_price_history_updated_at BEFORE UPDATE ON guildos_core.price_history FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- vitality_completions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vitality_completions_updated_at' AND tgrelid = 'guildos_core.vitality_completions'::regclass) THEN
    CREATE TRIGGER trg_vitality_completions_updated_at BEFORE UPDATE ON guildos_core.vitality_completions FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- vitality_quests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vitality_quests_updated_at' AND tgrelid = 'guildos_core.vitality_quests'::regclass) THEN
    CREATE TRIGGER trg_vitality_quests_updated_at BEFORE UPDATE ON guildos_core.vitality_quests FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- waiver_acceptances
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_waiver_acceptances_updated_at' AND tgrelid = 'guildos_core.waiver_acceptances'::regclass) THEN
    CREATE TRIGGER trg_waiver_acceptances_updated_at BEFORE UPDATE ON guildos_core.waiver_acceptances FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- wallet_transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wallet_transactions_updated_at' AND tgrelid = 'guildos_core.wallet_transactions'::regclass) THEN
    CREATE TRIGGER trg_wallet_transactions_updated_at BEFORE UPDATE ON guildos_core.wallet_transactions FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- xp_transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_xp_transactions_updated_at' AND tgrelid = 'guildos_core.xp_transactions'::regclass) THEN
    CREATE TRIGGER trg_xp_transactions_updated_at BEFORE UPDATE ON guildos_core.xp_transactions FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 4. Attach triggers to tables that already had updated_at but NO trigger
--    (stations, station_bookings, arbitrage_matches, bounty_stats, wallets, legal_waivers)
-- ============================================================================

-- stations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_stations_updated_at' AND tgrelid = 'guildos_core.stations'::regclass) THEN
    CREATE TRIGGER trg_stations_updated_at BEFORE UPDATE ON guildos_core.stations FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- station_bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_station_bookings_updated_at' AND tgrelid = 'guildos_core.station_bookings'::regclass) THEN
    CREATE TRIGGER trg_station_bookings_updated_at BEFORE UPDATE ON guildos_core.station_bookings FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- arbitrage_matches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_arbitrage_matches_updated_at' AND tgrelid = 'guildos_core.arbitrage_matches'::regclass) THEN
    CREATE TRIGGER trg_arbitrage_matches_updated_at BEFORE UPDATE ON guildos_core.arbitrage_matches FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- bounty_stats
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bounty_stats_updated_at' AND tgrelid = 'guildos_core.bounty_stats'::regclass) THEN
    CREATE TRIGGER trg_bounty_stats_updated_at BEFORE UPDATE ON guildos_core.bounty_stats FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- wallets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wallets_updated_at' AND tgrelid = 'guildos_core.wallets'::regclass) THEN
    CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON guildos_core.wallets FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;

-- legal_waivers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_legal_waivers_updated_at' AND tgrelid = 'guildos_core.legal_waivers'::regclass) THEN
    CREATE TRIGGER trg_legal_waivers_updated_at BEFORE UPDATE ON guildos_core.legal_waivers FOR EACH ROW EXECUTE FUNCTION guildos_core.set_updated_at();
  END IF;
END $$;
