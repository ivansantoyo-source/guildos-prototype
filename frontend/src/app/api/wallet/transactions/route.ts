// ============================================================================
// GET /api/wallet/transactions — List transaction history
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { getDemoTransactions } from '@/lib/wallet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    const transactions = getDemoTransactions().slice(0, limit);
    return NextResponse.json({ data: transactions, count: transactions.length, source: 'demo' });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', session.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ data: data || [], count: (data || []).length, source: 'production' });
  } catch (err) {
    console.error('[wallet:transactions:GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
