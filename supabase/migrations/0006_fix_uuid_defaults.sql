-- GuildOS v2.2.0 — Fix UUID Defaults
-- Migrate all uuid_generate_v4() defaults to gen_random_uuid()
-- uuid_generate_v4() requires uuid-ossp (deprecated PG13+) — gen_random_uuid()
-- is built into pgcrypto and is the recommended replacement.
--
-- NOTE: All new tables created in migrations 0001-0005 already use gen_random_uuid().
-- This migration only fixes the 12 tables from migration 0000 that used uuid_generate_v4().

-- ============================================================================
-- 1. ALTER column defaults from uuid_generate_v4() to gen_random_uuid()
-- ============================================================================

ALTER TABLE guildos_core.organizations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.inventory
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.bounties
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.nexus_lfgs
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.nexus_lfg_participants
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.nexus_scoreboards
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.nexus_save_rooms
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.faction_standings
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.price_history
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.blacklist_entries
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.notifications
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE guildos_core.discount_codes
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- 2. Drop uuid-ossp extension (deprecated in PG13+; no remaining usage)
--    Verified: all 12 affected tables migrated above; no other uuid_generate_*
--    functions exist in any project SQL files.
-- ============================================================================

DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- 3. Remove the extension CREATE from migration 0000 by noting it's no longer
--    available. If the database is being re-initialized from scratch,
--    migrations 0000 and schema.sql have been updated to omit this line.
-- ============================================================================
