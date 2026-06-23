-- GuildOS v2.2.0 — Live Tavern Interactive Spatial Matrix
-- Stations, bookings, environmental sensors for physical store telemetry

-- ============================================================================
-- STATIONS TABLE
-- ============================================================================
CREATE TABLE guildos_core.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station_type TEXT NOT NULL CHECK (station_type IN ('PC', 'CONSOLE', 'TABLETOP', 'COUCH', 'VR', 'ARCADE')),
  zone TEXT NOT NULL DEFAULT 'MAIN',
  position_x NUMERIC(5,2) NOT NULL DEFAULT 0,
  position_y NUMERIC(5,2) NOT NULL DEFAULT 0,
  mac_address TEXT,
  ip_address TEXT,
  rgb_profile JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OFFLINE')),
  current_game TEXT,
  current_player_id UUID REFERENCES guildos_core.profiles(id),
  occupied_at TIMESTAMPTZ,
  hourly_rate NUMERIC(10,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stations_org ON guildos_core.stations(organization_id, zone);
CREATE INDEX idx_stations_status ON guildos_core.stations(status);

ALTER TABLE guildos_core.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY stations_select_org ON guildos_core.stations FOR SELECT USING (true);
CREATE POLICY stations_insert_org ON guildos_core.stations FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY stations_update_org ON guildos_core.stations FOR UPDATE USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY stations_delete_org ON guildos_core.stations FOR DELETE USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- STATION BOOKINGS TABLE
-- ============================================================================
CREATE TABLE guildos_core.station_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES guildos_core.stations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES guildos_core.profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  rgb_color TEXT DEFAULT '#FFD700',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_station_bookings_station ON guildos_core.station_bookings(station_id, start_time);
CREATE INDEX idx_station_bookings_profile ON guildos_core.station_bookings(profile_id, start_time);

ALTER TABLE guildos_core.station_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_select_org ON guildos_core.station_bookings FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY bookings_insert_org ON guildos_core.station_bookings FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY bookings_update_org ON guildos_core.station_bookings FOR UPDATE USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- ENVIRONMENT READINGS TABLE
-- ============================================================================
CREATE TABLE guildos_core.environment_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES guildos_core.organizations(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  temperature_c NUMERIC(5,2),
  humidity_pct NUMERIC(5,2),
  power_draw_watts INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_environment_zone ON guildos_core.environment_readings(organization_id, zone, recorded_at DESC);

ALTER TABLE guildos_core.environment_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY env_select_org ON guildos_core.environment_readings FOR SELECT USING (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));
CREATE POLICY env_insert_org ON guildos_core.environment_readings FOR INSERT WITH CHECK (organization_id = (SELECT current_setting('app.current_org_id', true)::uuid));

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.stations;
ALTER PUBLICATION supabase_realtime ADD TABLE guildos_core.station_bookings;
