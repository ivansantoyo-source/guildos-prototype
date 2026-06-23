// ============================================================================
// GUILDOS — POS Session API
// Register open/close management
// GET    /api/pos/session — Get current session
// POST   /api/pos/session — Open a new session (starting_cash)
// PUT    /api/pos/session — Close a session (ending_cash, notes)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoModeServer } from '@/lib/toggles/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { phantomPOSSession } from '@/mocks/phantomData';
import type { POSSession } from '@/lib/types';

const OpenSessionSchema = z.object({
  starting_cash: z.number().min(0, 'Starting cash must be 0 or more'),
  staff_name: z.string().optional(),
});

const CloseSessionSchema = z.object({
  ending_cash: z.number().min(0, 'Ending cash must be 0 or more'),
  notes: z.string().optional(),
});

// ============================================================================
// GET /api/pos/session — Get current active session
// ============================================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);
  const session = await getServerSession(request);

  try {
    if (demo) {
      if (phantomPOSSession.status === 'CLOSED') {
        return NextResponse.json({
          data: null,
          message: 'No active session. Open a register to begin.',
          source: 'demo',
        });
      }

      // Return latest from store if updated, otherwise phantom default
      return NextResponse.json({
        data: phantomPOSSession,
        source: 'demo',
      });
    }

    // Production: query the active session from Supabase for this organization
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const orgId = session.organization_id;

    const { data, error } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (no active session)
      console.error('[pos/session:GET] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || null,
      message: data ? undefined : 'No active session',
      source: 'production',
    });
  } catch (error) {
    console.error('[pos/session] GET Error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/pos/session — Open a new register session
// ============================================================================
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);
  const session = await getServerSession(request);

  if (!demo && !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = OpenSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const orgId = session?.organization_id || 'demo-time-warp-001';
    const staffId = session?.dbUser?.id || 'usr-001';
    const sessionId = `pos-session-${Date.now()}`;

    const newSession: POSSession = {
      id: sessionId,
      organization_id: orgId,
      staff_profile_id: staffId,
      opened_at: now,
      starting_cash: parsed.data.starting_cash,
      total_sales: 0,
      total_transactions: 0,
      cash_sales: 0,
      card_sales: 0,
      store_credit_sales: 0,
      status: 'OPEN',
    };

    if (demo) {
      return NextResponse.json({
        success: true,
        data: newSession,
        source: 'demo',
      });
    }

    // Production: insert into Supabase
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('pos_sessions')
      .insert({
        id: sessionId,
        organization_id: orgId,
        staff_profile_id: staffId,
        opened_at: now,
        starting_cash: parsed.data.starting_cash,
        total_sales: 0,
        total_transactions: 0,
        cash_sales: 0,
        card_sales: 0,
        store_credit_sales: 0,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) {
      console.error('[pos/session:POST] Supabase insert error:', error.message);
      return NextResponse.json({ error: 'Failed to open session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'production',
    });
  } catch (error) {
    console.error('[pos/session] POST Error:', error);
    return NextResponse.json({ error: 'Failed to open session' }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/pos/session — Close the current register session
// ============================================================================
export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);
  const session = await getServerSession(request);

  if (!demo && !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CloseSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { ending_cash, notes } = parsed.data;

    if (demo) {
      // Validate that a session exists and is open
      if (!phantomPOSSession || phantomPOSSession.status === 'CLOSED') {
        return NextResponse.json({ error: 'No active session to close' }, { status: 400 });
      }

      // Calculate expected cash drawer
      const expectedCash = phantomPOSSession.starting_cash + phantomPOSSession.cash_sales;
      const overShort = Math.round((ending_cash - expectedCash) * 100) / 100;

      const closedSession: POSSession = {
        ...phantomPOSSession,
        closed_at: now,
        ending_cash,
        status: 'CLOSED',
        notes: notes || undefined,
      };

      return NextResponse.json({
        success: true,
        data: closedSession,
        over_short: overShort,
        expected_cash: expectedCash,
        source: 'demo',
      });
    }

    // Production: update the active session in Supabase
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const orgId = session!.organization_id;

    // Get the current active session
    const { data: currentSession, error: fetchError } = await supabase
      .from('pos_sessions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !currentSession) {
      return NextResponse.json({ error: 'No active session to close' }, { status: 400 });
    }

    const expectedCash = currentSession.starting_cash + currentSession.cash_sales;
    const overShort = Math.round((ending_cash - expectedCash) * 100) / 100;

    const { data, error } = await supabase
      .from('pos_sessions')
      .update({
        closed_at: now,
        ending_cash,
        status: 'CLOSED',
        notes: notes || null,
      })
      .eq('id', currentSession.id)
      .select()
      .single();

    if (error) {
      console.error('[pos/session:PUT] Supabase update error:', error.message);
      return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      over_short: overShort,
      expected_cash: expectedCash,
      source: 'production',
    });
  } catch (error) {
    console.error('[pos/session] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
  }
}
