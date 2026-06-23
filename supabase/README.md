# GuildOS Database Migrations

All database migrations for the `guildos_core` schema are stored in this directory as versioned SQL files managed by the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Prerequisites

- Supabase CLI 2.x (`brew install supabase/tap/supabase` or `npm i -g supabase`)
- Access to the Aegis Supabase project (`tyustwqwvjmzvuazfwkv`)
- `SUPABASE_ACCESS_TOKEN` environment variable set (generate at https://supabase.com/dashboard/account/tokens)

## Quick Start

```bash
# Link to the remote project (one-time setup)
npx supabase link --project-ref tyustwqwvjmzvuazfwkv

# Apply all pending migrations
npx supabase migration up

# List applied migrations
npx supabase migration list
```

Or use the npm scripts from `frontend/`:

```bash
cd frontend
npm run db:link
npm run db:migration:up
npm run db:migration:list
```

## Workflow

### Creating a new migration

```bash
# Generate a new migration file
npx supabase migration new add_wallet_table

# Edit the generated file in supabase/migrations/YYYYMMDDHHMMSS_add_wallet_table.sql
# Add your CREATE/ALTER statements there

# Apply locally (requires local Supabase via `supabase start`)
npx supabase db push

# Apply to production
npx supabase migration up
```

### Diffing schema changes

If you've made direct changes in the Supabase Dashboard SQL Editor and want to capture them as a migration:

```bash
npx supabase db diff --schema guildos_core -f describe_changes
```

This creates a new migration file with the SQL needed to bring local up to remote.

### Regenerating TypeScript types

After applying migrations, regenerate the TypeScript definitions:

```bash
npm run db:types
```

This writes to `src/lib/types/database.ts`.

## Files

| File | Purpose |
|------|---------|
| `migrations/0000_initial_schema.sql` | Initial schema: 13 tables, RLS, indexes, triggers, seed org |
| `migrations/YYYYMMDD*.sql` | Subsequent schema changes (created via `migration new`) |
| `config.toml` | Supabase local dev configuration |
| `email-templates/` | Custom HTML email templates for auth |

## Migration Policy

1. **Never edit existing migrations** after they've been applied to production. Create a new migration file instead.
2. **Always test locally first**: `supabase start` then `supabase db push`.
3. **One logical change per migration**: Keep migrations focused and reversible.
4. **All tables in `guildos_core` schema**: Never create tables in the `public` schema (86 Aegis tables live there).
5. **Foreign keys use `ON DELETE CASCADE`** per ARCHITECTURE.md policy, except for audit-critical references.

## Legacy schema.sql

The root `schema.sql` file is maintained as a convenience copy of the canonical migration. Its header directs readers here. New schema changes should be added as migration files, not by editing `schema.sql`.
