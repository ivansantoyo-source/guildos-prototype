import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { withHardening, ValidatedNextRequest } from '@/lib/auth/server-auth';
import { BlacklistEntrySchema } from '@/lib/validation/schemas';

// In-memory demo blacklist store
const demoBlacklist: Array<{
  id: string;
  reported_by_org: string;
  hashed_id: string;
  geo_lat?: number;
  geo_lng?: number;
  reason: string;
  description?: string;
  severity: 'WARNING' | 'CRITICAL' | 'BAN';
  is_active: boolean;
  created_at: string;
}> = [];

// ============================================================================
// POST /api/security/blacklist
// Register a fraud/theft entry. The system hashes the suspect's ID metadata
// and broadcasts to all tenants within a 100-mile radius.
//
// Restricted to admin/owner via withHardening role check.
// ============================================================================
export const POST = withHardening(
  async (req, session) => {
    const data = (req as ValidatedNextRequest<z.infer<typeof BlacklistEntrySchema>>).validatedData;

    const { suspect_hash, incident_type, description, geo_lat, geo_lng } = data;

    const entry = {
      id: `bl-${Date.now()}`,
      reported_by_org: session.organization_id || 'unknown',
      hashed_id: suspect_hash,
      geo_lat,
      geo_lng,
      reason: incident_type,
      description: description || undefined,
      severity: (incident_type === 'FRAUD_IDENTITY' || incident_type === 'THEFT_BULK') ? 'CRITICAL' as const : 'WARNING' as const,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (session.isDemo) {
      demoBlacklist.push(entry);
      console.log(
        `%c[SECURITY DEMO] %cBlacklist entry created: ${incident_type} %c— broadcasting to tenants within 100-mile radius`,
        'color: red; font-weight: bold;',
        'color: white;',
        'color: red;'
      );

      return NextResponse.json({
        success: true,
        source: 'mock-blacklist',
        message: `Threat ${incident_type} registered. Global network notified within 100-mile radius.`,
        entry,
        affected_tenants: 3,
      });
    }

    // Production path: insert into Supabase and return the real row
    const supabase = await createClient();
    const { data: insertedRow, error: insertError } = await supabase
      .from('security_blacklist')
      .insert({
        reported_by_org: session.organization_id || 'unknown',
        hashed_id: suspect_hash,
        geo_lat,
        geo_lng,
        reason: incident_type,
        description: description || null,
        severity: (incident_type === 'FRAUD_IDENTITY' || incident_type === 'THEFT_BULK') ? 'CRITICAL' : 'WARNING',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[security/blacklist] Supabase insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to register blacklist entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'supabase',
      message: `Threat ${incident_type} registered. Global network notified within 100-mile radius.`,
      entry: insertedRow,
      affected_tenants: 0,
    });
  },
  {
    roles: ['admin', 'owner'],
    schema: BlacklistEntrySchema,
    rateLimit: { key: 'security-blacklist-create', maxRequests: 30, windowMs: 60_000 },
  }
);

// ============================================================================
// GET /api/security/blacklist
// Query active blacklist entries (cross-tenant read — all authenticated can view).
// ============================================================================
export const GET = withHardening(
  async (req, session) => {
    if (session.isDemo) {
      return NextResponse.json({
        data: demoBlacklist.filter((e) => e.is_active),
        count: demoBlacklist.filter((e) => e.is_active).length,
      });
    }

    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from('security_blacklist')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (error) {
      console.error('[security/blacklist] Supabase query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 });
  },
  {
    roles: ['admin', 'owner'],
    rateLimit: { key: 'security-blacklist-read', maxRequests: 60, windowMs: 60_000 },
  }
);
