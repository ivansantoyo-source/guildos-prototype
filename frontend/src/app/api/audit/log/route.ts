// ============================================================================
// POST /api/audit/log — Record an auditable action
// GET /api/audit/log — Query audit trail
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { standardError, handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) {
    return standardError(401, 'Authentication required');
  }
  const resourceType = searchParams.get('resource_type');
  const resourceId = searchParams.get('resource_id');
  const limit = parseInt(searchParams.get('limit') || '50');

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('organization_id', session.organization_id)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500));

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ entries: data });
  } catch (err) {
    return handleApiError(err, '[Audit:GET]');
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) {
    return standardError(401, 'Authentication required');
  }

  const demo = await isDemoModeServer(searchParams);
  const body = await request.json().catch(() => ({}));

  if (demo) {
    console.log('[Audit DEMO]', body.action, body.resource_type, body.resource_id);
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('audit_log').insert({
      organization_id: session.organization_id,
      profile_id: session.id,
      action: body.action,
      resource_type: body.resource_type,
      resource_id: body.resource_id || null,
      metadata: body.metadata || null,
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent') || null,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[Audit:POST]');
  }
}
