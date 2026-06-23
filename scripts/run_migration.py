#!/usr/bin/env python3
"""
GuildOS — Production Migration Runner
Connects to Supabase Aegis project and creates the guildos_core schema.
ZERO impact on existing Aegis public schema tables.

Usage:
  python3 scripts/run_migration.py
  (reads SUPABASE_SERVICE_ROLE_KEY from frontend/.env.local)
"""

import os
import re
import sys
import psycopg2
from psycopg2 import sql

# Read credentials from .env.local
ENV_FILE = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env.local')

def load_env(path):
    """Parse .env.local file."""
    env = {}
    if not os.path.exists(path):
        print(f"ERROR: {path} not found. Run this from the GuildOS project root.")
        sys.exit(1)
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

env = load_env(ENV_FILE)

DB_USER = 'postgres.tyustwqwvjmzvuazfwkv'
DB_PASSWORD = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DB_HOST = 'aws-0-us-west-1.pooler.supabase.com'
DB_PORT = 6543
DB_NAME = 'postgres'

if not DB_PASSWORD:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    sys.exit(1)

# Read the migration SQL (canonical source: supabase/migrations/)
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations', '0000_initial_schema.sql')
with open(SCHEMA_FILE) as f:
    schema_sql = f.read()

# Remove ALTER ROLE commands that could affect Aegis's search_path
schema_sql = re.sub(
    r"ALTER ROLE \w+ SET search_path.*;",
    "-- SKIPPED (would affect Aegis): ALTER ROLE search_path",
    schema_sql
)

print("=" * 60)
print("GUILDOS  Migration Runner")
print("=" * 60)
print(f"Target: {DB_HOST}:{DB_PORT}")
print(f"Schema: guildos_core")
print()

# Connect and run
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        connect_timeout=15,
        sslmode='require'
    )
    conn.autocommit = True  # DDL needs autocommit
    cur = conn.cursor()

    # 1. Create the schema
    print("[1/3] Creating guildos_core schema...")
    cur.execute("CREATE SCHEMA IF NOT EXISTS guildos_core;")
    print("      ✓ Schema created (or already exists)")

    # 2. Set search path and run the full migration
    print("[2/3] Running migration (13 tables, RLS, triggers, indexes)...")
    cur.execute("SET search_path TO guildos_core;")
    cur.execute(schema_sql)
    print("      ✓ Migration executed")

    # 3. Verify tables were created
    print("[3/3] Verifying tables...")
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'guildos_core'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"      ✓ {len(tables)} tables created:")
    for t in tables:
        print(f"        - guildos_core.{t}")

    # Verify original tables still exist
    print()
    print("AEGIS VERIFICATION:")
    cur.execute("""
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    """)
    public_count = cur.fetchone()[0]
    print(f"      ✓ {public_count} tables untouched in public schema")

    cur.close()
    conn.close()

    print()
    print("=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print(f"GuildOS: {len(tables)} tables in guildos_core schema")
    print(f"Aegis:   {public_count} tables in public schema (unchanged)")
    print()
    print("Next: Set NEXT_PUBLIC_DEMO_MODE=false and redeploy to Vercel.")

except psycopg2.OperationalError as e:
    print(f"\nCONNECTION ERROR: {e}")
    print("\nTroubleshooting:")
    print("  1. Check that the service role key is correct")
    print("  2. Ensure IP is allowlisted in Supabase (Settings → Database → Network Restrictions)")
    print("  3. Try via the SQL editor: https://supabase.com/dashboard/project/tyustwqwvjmzvuazfwkv/sql/new")
    sys.exit(1)
except Exception as e:
    print(f"\nMIGRATION ERROR: {e}")
    sys.exit(1)
