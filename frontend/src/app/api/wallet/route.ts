// ============================================================================
// GET /api/wallet — Get wallet balance + recent transactions
// POST /api/wallet — Credit or debit wallet
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { isDemoModeServer } from '@/lib/toggles/server';
import { createClient } from '@/lib/supabase/server';
import { getDemoWallet, getDemoTransactions, creditWallet, debitWallet } from '@/lib/wallet';
import { standardError, handleApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const demo = await isDemoModeServer(searchParams);
  if (demo) {
    return NextResponse.json({ wallet: getDemoWallet(), transactions: getDemoTransactions() });
  }

  try {
    const supabase = await createClient();
    const { data: wallet } = await supabase.from('wallets').select('*').eq('profile_id', session.id).maybeSingle();
    const { data: transactions } = await supabase.from('wallet_transactions').select('*').eq('profile_id', session.id).order('created_at', { ascending: false }).limit(50);

    return NextResponse.json({ wallet: wallet || null, transactions: transactions || [] });
  } catch (err) {
    return handleApiError(err, '[Wallet:GET]');
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const session = await getServerSession(request);
  if (!session) return standardError(401, 'Auth required');

  const body = await request.json().catch(() => ({}));
  const demo = await isDemoModeServer(searchParams);

  if (demo) {
    const wallet = getDemoWallet();
    if (body.type?.startsWith('CREDIT')) {
      const result = creditWallet(wallet, body.amount || 0, body.type || 'CREDIT_BOUNTY', body.reference_type || 'demo', body.reference_id);
      return NextResponse.json(result);
    } else if (body.type?.startsWith('DEBIT') || body.type === 'REFUND') {
      const result = debitWallet(wallet, body.amount || 0, body.type || 'DEBIT_PURCHASE', body.reference_type || 'demo', body.reference_id);
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }
    return standardError(400, 'Invalid transaction type');
  }

  try {
    const supabase = await createClient();
    const isCredit = body.type?.startsWith('CREDIT');
    const isDebit = body.type?.startsWith('DEBIT') || body.type === 'REFUND';
    const delta = isCredit ? body.amount : isDebit ? -body.amount : 0;

    if (delta === 0) {
      return standardError(400, 'Invalid transaction type');
    }

    // Atomic wallet update: read existing wallet, then update balance with delta
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('profile_id', session.id)
      .maybeSingle();

    let wallet;
    if (existingWallet) {
      // Wallet exists — update balance, total_earned, total_spent
      if (isDebit && existingWallet.balance < body.amount) {
        return standardError(400, 'Insufficient balance');
      }
      const updateData: Record<string, unknown> = {
        balance: existingWallet.balance + delta,
      };
      if (isCredit) updateData.total_earned = existingWallet.total_earned + body.amount;
      if (isDebit) updateData.total_spent = existingWallet.total_spent + Math.abs(delta);

      const { data: updated, error: updateErr } = await supabase
        .from('wallets')
        .update(updateData)
        .eq('profile_id', session.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      wallet = updated;
    } else {
      // No wallet yet — create one with initial balance
      const insertData: Record<string, unknown> = {
        profile_id: session.id,
        organization_id: session.organization_id,
        balance: delta,
      };
      if (isCredit) insertData.total_earned = body.amount;
      if (isDebit) insertData.total_spent = Math.abs(delta);

      const { data: created, error: insertErr } = await supabase
        .from('wallets')
        .insert(insertData)
        .select()
        .single();

      if (insertErr) throw insertErr;
      wallet = created;
    }

    // Record the transaction
    const { error: txnErr } = await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      profile_id: session.id,
      type: body.type,
      amount: body.amount,
      description: body.description || null,
      reference_type: body.reference_type || 'api',
      reference_id: body.reference_id || null,
    });

    if (txnErr) throw txnErr;

    return NextResponse.json({ wallet, transaction: { type: body.type, amount: body.amount } });
  } catch (err) {
    return handleApiError(err, '[Wallet:POST]');
  }
}
