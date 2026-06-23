// ============================================================================
// GUILDOS — POS Checkout API
// Processes a POS sale: creates transaction, updates inventory, returns receipt
// POST /api/pos/checkout
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoModeServer } from '@/lib/toggles/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { phantomInventory, phantomPOSTransactions } from '@/mocks/phantomData';
import type { POSCartItem, POSTransaction } from '@/lib/types';

const POSCheckoutSchema = z.object({
  session_id: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      inventory_id: z.string().min(1),
      item_name: z.string().min(1),
      platform: z.string().optional(),
      price: z.number().min(0),
      quantity: z.number().int().min(1),
      is_legendary: z.boolean().optional().default(false),
      tags: z.array(z.string()).optional().default([]),
    })
  ).min(1, 'At least one item is required'),
  payment_method: z.enum(['CASH', 'CARD', 'STORE_CREDIT', 'SPLIT']),
  cash_tendered: z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  customer_profile_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demo = await isDemoModeServer(searchParams);
  const session = await getServerSession(request);

  // Require auth in production mode
  if (!demo && !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = POSCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      session_id,
      items,
      payment_method,
      cash_tendered,
      discount_percent = 0,
      customer_profile_id,
    } = parsed.data;

    // Calculate financials
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount =
      discount_percent > 0
        ? Math.round(subtotal * (discount_percent / 100) * 100) / 100
        : 0;
    const taxableAmount = Math.round((subtotal - discountAmount) * 100) / 100;
    const taxAmount = Math.round(taxableAmount * 0.08 * 100) / 100; // 8% tax
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Validate cash payment
    let changeDue: number | undefined;
    if (payment_method === 'CASH') {
      if (cash_tendered === undefined) {
        return NextResponse.json(
          { error: 'Cash tendered amount is required for cash payments' },
          { status: 400 }
        );
      }
      changeDue = Math.round((cash_tendered - total) * 100) / 100;
      if (changeDue < 0) {
        return NextResponse.json(
          { error: `Insufficient cash. Need $${total.toFixed(2)}, received $${cash_tendered.toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const orgId = session?.organization_id || 'demo-time-warp-001';
    const txnCount = phantomPOSTransactions.length + 1;
    const receiptNumber = `RCPT-${String(txnCount).padStart(4, '0')}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

    const transaction: POSTransaction = {
      id: `pos-txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      session_id,
      organization_id: orgId,
      items: items.map((item) => ({
        id: item.id,
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        platform: item.platform,
        price: item.price,
        quantity: item.quantity,
        is_legendary: item.is_legendary ?? false,
        tags: item.tags ?? [],
      })),
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
      payment_method,
      cash_tendered,
      change_due: changeDue,
      customer_profile_id,
      receipt_number: receiptNumber,
      created_at: now,
    };

    // === DEMO MODE ===
    if (demo) {
      // Simulate processing delay for card payments
      if (payment_method === 'CARD') {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Simulate inventory stock deduction
      const updatedInventory = phantomInventory.map((invItem) => {
        const soldItem = items.find((cartItem) => cartItem.inventory_id === invItem.id);
        if (soldItem) {
          const newStock = Math.max(0, invItem.stock_count - soldItem.quantity);
          return {
            ...invItem,
            stock_count: newStock,
            status: newStock <= 0 ? ('SOLD' as const) : invItem.status,
          };
        }
        return invItem;
      });

      return NextResponse.json({
        success: true,
        transaction,
        receipt_number: receiptNumber,
        updated_inventory: updatedInventory,
        source: 'demo',
      });
    }

    // === PRODUCTION MODE ===
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Create transaction record
    const { data: txnData, error: txnError } = await supabase
      .from('pos_transactions')
      .insert({
        id: transaction.id,
        session_id,
        organization_id: orgId,
        items: JSON.stringify(transaction.items),
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        payment_method,
        cash_tendered: cash_tendered || null,
        change_due: changeDue || null,
        customer_profile_id: customer_profile_id || null,
        receipt_number: receiptNumber,
        created_at: now,
      })
      .select()
      .single();

    if (txnError) {
      console.error('[pos:checkout] Supabase insert error:', txnError.message);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Decrement inventory stock for each sold item
    for (const cartItem of items) {
      const { error: invError } = await supabase
        .from('inventory')
        .update({
          stock_count: supabase.rpc('decrement_stock', {
            item_id: cartItem.inventory_id,
            quantity: cartItem.quantity,
          }),
        })
        .eq('id', cartItem.inventory_id);

      if (invError) {
        console.error(`[pos:checkout] Stock update error for ${cartItem.inventory_id}:`, invError.message);
      }
    }

    return NextResponse.json({
      success: true,
      transaction: txnData,
      receipt_number: receiptNumber,
      source: 'production',
    });
  } catch (error) {
    console.error('[pos/checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
