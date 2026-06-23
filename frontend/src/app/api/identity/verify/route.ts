// ============================================================================
// POST /api/identity/verify — Start identity verification (Stripe Identity or manual)
// GET /api/identity/verify — Check verification status
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const profileId = session.id;
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    return NextResponse.json({
      verification: {
        id: `iv-demo-${profileId}`,
        profile_id: profileId,
        verification_type: 'STRIPE_IDENTITY',
        status: 'VERIFIED',
        verified_at: new Date().toISOString(),
        id_document_type: 'DRIVERS_LICENSE',
        id_issuing_country: 'US',
        created_at: new Date().toISOString(),
      },
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('profile_id', profileId)
      .eq('organization_id', session.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ verification: data });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to check verification status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const demo = await isDemoModeServer(searchParams);
  const body = await request.json().catch(() => ({}));
  const verificationType = body.verification_type || 'STRIPE_IDENTITY';

  if (demo) {
    return NextResponse.json({
      verificationId: `iv-demo-${Date.now()}`,
      verificationUrl: `https://verify.stripe.com/demo/${Date.now()}`,
      status: 'PENDING',
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('identity_verifications')
      .insert({
        profile_id: session.id,
        verification_type: verificationType,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    // In production, this would create a Stripe Identity verification session
    // For now, return the DB record for manual verification flow
    return NextResponse.json({ verificationId: data.id, status: 'PENDING' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start verification' }, { status: 500 });
  }
}
