#!/usr/bin/env bash
# GuildOS Final Migration — uses jq for clean JSON encoding
set -e

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN environment variable is required."
  echo "Usage: SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/migrate_final.sh"
  exit 1
fi
API="https://api.supabase.com/v1/projects/tyustwqwvjmzvuazfwkv/database/query"

run_sql() {
  local query="$1"
  local label="$2"
  local body
  body=$(jq -nc --arg q "$query" '{"query": $q}')
  local resp
  resp=$(curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$body")
  if [ "$resp" = "[]" ] || echo "$resp" | jq -e 'type == "array"' > /dev/null 2>&1; then
    echo "  ✓ $label"
  else
    echo "  ✗ $label: $resp"
    return 1
  fi
}

echo "============================================================"
echo "GUILDOS Migration — Aegis (tyustwqwvjmzvuazfwkv)"
echo "============================================================"

# ---- TABLES ----
echo "[Core Tables]"
run_sql "CREATE TABLE IF NOT EXISTS guildos_core.inventory (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), item_name TEXT NOT NULL, platform TEXT, condition TEXT, market_value NUMERIC(19,4) NOT NULL DEFAULT 0, our_price NUMERIC(19,4), scrap_value NUMERIC(19,4) DEFAULT 0, stock_count INTEGER DEFAULT 1, is_legendary BOOLEAN DEFAULT FALSE, price_spike_flag BOOLEAN DEFAULT FALSE, tags TEXT[] DEFAULT '{}', image_url TEXT, status TEXT DEFAULT 'ACTIVE', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());" "inventory"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.bounties (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), target_item_name TEXT NOT NULL, platform TEXT, base_market_price NUMERIC(19,4) DEFAULT 0, scarcity_mult NUMERIC(5,2) DEFAULT 1.00, store_credit_value NUMERIC(19,4) GENERATED ALWAYS AS (base_market_price * scarcity_mult) STORED, status TEXT DEFAULT 'ACTIVE', description TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());" "bounties"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.nexus_lfgs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), creator_id UUID REFERENCES guildos_core.profiles(id), game_title TEXT NOT NULL, description TEXT, console_type TEXT, player_slots_total INTEGER NOT NULL DEFAULT 2, player_slots_filled INTEGER DEFAULT 1, max_spectators INTEGER DEFAULT 0, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ, lobby_status TEXT DEFAULT 'OPEN', created_at TIMESTAMPTZ DEFAULT NOW());" "nexus_lfgs"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.nexus_lfg_participants (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), lfg_id UUID REFERENCES guildos_core.nexus_lfgs(id) ON DELETE CASCADE, profile_id UUID REFERENCES guildos_core.profiles(id), joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(lfg_id, profile_id));" "nexus_lfg_participants"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.nexus_scoreboards (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), cabinet_name TEXT NOT NULL, game_title TEXT NOT NULL, player_tag TEXT NOT NULL, player_id UUID REFERENCES guildos_core.profiles(id), score BIGINT NOT NULL, rank INTEGER, status TEXT DEFAULT 'ACTIVE', logged_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW());" "nexus_scoreboards"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.nexus_save_rooms (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), room_name TEXT NOT NULL, description TEXT, monthly_rate NUMERIC(19,4) DEFAULT 15.00, capacity INTEGER DEFAULT 4, amenities TEXT[] DEFAULT '{}', subscriber_id UUID REFERENCES guildos_core.profiles(id), stripe_subscription_id TEXT, qr_code_hash TEXT, status TEXT DEFAULT 'AVAILABLE', created_at TIMESTAMPTZ DEFAULT NOW());" "nexus_save_rooms"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.faction_standings (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), month INTEGER NOT NULL, year INTEGER NOT NULL, faction TEXT NOT NULL, total_points NUMERIC(19,4) DEFAULT 0, is_winner BOOLEAN DEFAULT FALSE, discount_active BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(organization_id, month, year, faction));" "faction_standings"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.price_history (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), inventory_id UUID REFERENCES guildos_core.inventory(id) ON DELETE CASCADE, organization_id UUID REFERENCES guildos_core.organizations(id), market_value NUMERIC(19,4) NOT NULL, source TEXT DEFAULT 'pricecharting', recorded_at TIMESTAMPTZ DEFAULT NOW());" "price_history"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.blacklist_entries (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), reported_by_org UUID REFERENCES guildos_core.organizations(id), hashed_id TEXT NOT NULL, geo_lat NUMERIC(10,7), geo_lng NUMERIC(10,7), reason TEXT NOT NULL, description TEXT, severity TEXT DEFAULT 'WARNING', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW());" "blacklist_entries"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.notifications (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), user_id UUID REFERENCES guildos_core.profiles(id), type TEXT NOT NULL, title TEXT NOT NULL, message TEXT, metadata JSONB DEFAULT '{}', read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());" "notifications"

run_sql "CREATE TABLE IF NOT EXISTS guildos_core.discount_codes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID REFERENCES guildos_core.organizations(id), code TEXT NOT NULL, discount_percent NUMERIC(5,2) DEFAULT 10.00, source TEXT DEFAULT 'KONAMI', used_by UUID REFERENCES guildos_core.profiles(id), used_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW());" "discount_codes"

# ---- RLS ----
echo ""
echo "[RLS Policies]"
for table in organizations profiles inventory bounties nexus_lfgs nexus_lfg_participants nexus_scoreboards nexus_save_rooms faction_standings price_history blacklist_entries notifications discount_codes; do
  run_sql "ALTER TABLE guildos_core.${table} ENABLE ROW LEVEL SECURITY;" "RLS: $table"
done

# ---- INDEXES ----
echo ""
echo "[Indexes]"
run_sql "CREATE INDEX IF NOT EXISTS idx_inventory_org ON guildos_core.inventory(organization_id);" "idx_inventory_org"
run_sql "CREATE INDEX IF NOT EXISTS idx_inventory_status ON guildos_core.inventory(status);" "idx_inventory_status"
run_sql "CREATE INDEX IF NOT EXISTS idx_inventory_legendary ON guildos_core.inventory(is_legendary) WHERE is_legendary = TRUE;" "idx_inventory_legendary"
run_sql "CREATE INDEX IF NOT EXISTS idx_inventory_spike ON guildos_core.inventory(price_spike_flag) WHERE price_spike_flag = TRUE;" "idx_inventory_spike"
run_sql "CREATE INDEX IF NOT EXISTS idx_bounties_org_status ON guildos_core.bounties(organization_id, status);" "idx_bounties_org_status"
run_sql "CREATE INDEX IF NOT EXISTS idx_profiles_org ON guildos_core.profiles(organization_id);" "idx_profiles_org"
run_sql "CREATE INDEX IF NOT EXISTS idx_profiles_faction ON guildos_core.profiles(faction);" "idx_profiles_faction"
run_sql "CREATE INDEX IF NOT EXISTS idx_nexus_lfgs_org_status ON guildos_core.nexus_lfgs(organization_id, lobby_status);" "idx_nexus_lfgs_org_status"
run_sql "CREATE INDEX IF NOT EXISTS idx_scoreboards_game ON guildos_core.nexus_scoreboards(organization_id, game_title, score DESC);" "idx_scoreboards_game"
run_sql "CREATE INDEX IF NOT EXISTS idx_notifications_user ON guildos_core.notifications(user_id, read_at);" "idx_notifications_user"
run_sql "CREATE INDEX IF NOT EXISTS idx_price_history_item ON guildos_core.price_history(inventory_id, recorded_at DESC);" "idx_price_history_item"
run_sql "CREATE INDEX IF NOT EXISTS idx_blacklist_geo ON guildos_core.blacklist_entries(geo_lat, geo_lng) WHERE is_active = TRUE;" "idx_blacklist_geo"

# ---- FUNCTIONS + TRIGGERS ----
echo ""
echo "[Functions & Triggers]"
run_sql "CREATE OR REPLACE FUNCTION guildos_core.current_user_org_id() RETURNS UUID AS \$\$ SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid; \$\$ LANGUAGE SQL STABLE;" "current_user_org_id()"
run_sql "CREATE OR REPLACE FUNCTION guildos_core.update_updated_at() RETURNS TRIGGER AS \$\$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; \$\$ LANGUAGE plpgsql;" "update_updated_at()"
run_sql "CREATE OR REPLACE FUNCTION guildos_core.flag_legendary_item() RETURNS TRIGGER AS \$\$ BEGIN IF NEW.market_value >= 150.00 THEN NEW.is_legendary = TRUE; ELSE NEW.is_legendary = FALSE; END IF; RETURN NEW; END; \$\$ LANGUAGE plpgsql;" "flag_legendary_item()"
run_sql "CREATE OR REPLACE FUNCTION guildos_core.update_level_tier() RETURNS TRIGGER AS \$\$ BEGIN IF NEW.xp_points >= 25000 THEN NEW.level_tier = 'TIME_LORD'; ELSIF NEW.xp_points >= 5000 THEN NEW.level_tier = 'RETRO_MAGE'; ELSE NEW.level_tier = 'PEASANT'; END IF; RETURN NEW; END; \$\$ LANGUAGE plpgsql;" "update_level_tier()"

run_sql "CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON guildos_core.organizations FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();" "trg_organizations_updated_at"
run_sql "CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON guildos_core.profiles FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();" "trg_profiles_updated_at"
run_sql "CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON guildos_core.inventory FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();" "trg_inventory_updated_at"
run_sql "CREATE TRIGGER trg_bounties_updated_at BEFORE UPDATE ON guildos_core.bounties FOR EACH ROW EXECUTE FUNCTION guildos_core.update_updated_at();" "trg_bounties_updated_at"
run_sql "CREATE TRIGGER trg_inventory_legendary BEFORE INSERT OR UPDATE OF market_value ON guildos_core.inventory FOR EACH ROW EXECUTE FUNCTION guildos_core.flag_legendary_item();" "trg_inventory_legendary"
run_sql "CREATE TRIGGER trg_profiles_level_tier BEFORE INSERT OR UPDATE OF xp_points ON guildos_core.profiles FOR EACH ROW EXECUTE FUNCTION guildos_core.update_level_tier();" "trg_profiles_level_tier"

# ---- SEED ----
echo ""
echo "[Seed Data]"
run_sql "INSERT INTO guildos_core.organizations (id, name, subdomain, tier, config, tagline) VALUES ('00000000-0000-0000-0000-000000000001', 'Time Warp Gaming', 'timewarp', 'wizard', '{\"demoMode\":true,\"theme\":\"terminal\"}'::jsonb, 'Where retro lives forever.') ON CONFLICT (id) DO NOTHING;" "Demo organization"

# ---- VERIFY ----
echo ""
echo "============================================================"
echo "VERIFICATION"
echo "============================================================"
TABLES=$(curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '"'"'guildos_core'"'"' ORDER BY table_name;"}')
echo "$TABLES" | jq -r '.[].table_name' | while read t; do echo "  - $t"; done
COUNT=$(echo "$TABLES" | jq 'length')
echo "  Total: $COUNT tables in guildos_core"

AEGIS=$(curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query": "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_type = '"'"'BASE TABLE'"'"';"}')
echo "  Aegis public: $(echo "$AEGIS" | jq -r '.[0].cnt') tables (untouched)"
echo ""
echo "============================================================"
echo "MIGRATION COMPLETE"
echo "============================================================"
