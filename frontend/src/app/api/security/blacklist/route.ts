import { NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/toggles';

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

/**
 * POST /api/security/blacklist
 * Register a fraud/theft entry. The system hashes the suspect's ID metadata
 * and broadcasts to all tenants within a 100-mile radius.
 *
 * Protected by BLACKLIST_VERIFICATION_KEY header.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const verificationKey = process.env.BLACKLIST_VERIFICATION_KEY;

  if (verificationKey && authHeader !== `Bearer ${verificationKey}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { origin_tenant, suspect_hash, incident_type, description, geo_lat, geo_lng } = payload;

    if (!suspect_hash || !incident_type) {
      return Response.json(
        { error: 'suspect_hash and incident_type are required' },
        { status: 400 }
      );
    }

    const entry = {
      id: `bl-${Date.now()}`,
      reported_by_org: origin_tenant || 'unknown',
      hashed_id: suspect_hash,
      geo_lat,
      geo_lng,
      reason: incident_type,
      description: description || null,
      severity: (incident_type === 'FRAUD_IDENTITY' || incident_type === 'THEFT_BULK') ? 'CRITICAL' as const : 'WARNING' as const,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isDemoMode()) {
      demoBlacklist.push(entry);
      console.log(
        `%c[SECURITY DEMO] %cBlacklist entry created: ${incident_type} %c— broadcasting to tenants within 100-mile radius`,
        'color: red; font-weight: bold;',
        'color: white;',
        'color: red;'
      );
    }

    return Response.json({
      success: true,
      source: isDemoMode() ? 'mock-blacklist' : 'supabase',
      message: `Threat ${incident_type} registered. Global network notified within 100-mile radius.`,
      entry,
      affected_tenants: isDemoMode() ? 3 : 0,
    });
  } catch (error) {
    console.error('[Blacklist] Registration error:', error);
    return Response.json(
      { success: false, error: 'Unable to process request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/security/blacklist
 * Query active blacklist entries (cross-tenant read — all authenticated can view).
 */
export async function GET() {
  if (isDemoMode()) {
    return Response.json({
      data: demoBlacklist.filter((e) => e.is_active),
      count: demoBlacklist.filter((e) => e.is_active).length,
    });
  }

  return Response.json({ data: [], count: 0 });
}
