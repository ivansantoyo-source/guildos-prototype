// ============================================================================
// GUILDOS — Create Stripe Checkout Session for Customer Orders
// POST /api/payments/create-checkout-session
//
// Accepts cart items and customer info, creates a Stripe Checkout Session,
// and returns the redirect URL. The webhook handler at /api/webhooks/stripe
// processes checkout.session.completed to finalize the order and deduct
// inventory stock_count.
//
// In demo mode (or when Stripe is not configured), returns a mock redirect
// URL that simulates the success flow.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isDemoModeServer } from '@/lib/toggles/server';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const demoMode = await isDemoModeServer(searchParams);

  try {
    const body = await request.json();
    const {
      organization_id,
      items,
      customer_name,
      customer_email,
      customer_phone,
      order_notes,
      tenant,
    } = body;

    // Validate required fields
    if (!organization_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: organization_id and items (non-empty array)' },
        { status: 400 }
      );
    }

    if (!customer_name || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_email' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const tenantSlug = tenant || 'store';
    const baseSuccessUrl = `${appUrl}/${tenantSlug}/checkout?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const baseCancelUrl = `${appUrl}/${tenantSlug}/checkout?checkout=cancelled`;

    // ======================================================================
    // Demo mode — return a mock session URL that simulates the redirect flow
    // ======================================================================
    if (demoMode || !process.env.STRIPE_SECRET_KEY) {
      console.log(
        '%c[DEMO STRIPE] %cCreating checkout session for customer order',
        'color: blue; font-weight: bold;',
        'color: white;'
      );

      const mockSessionId = `cs_demo_${Date.now()}`;

      return NextResponse.json({
        url: baseSuccessUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId),
        sessionId: mockSessionId,
        mode: demoMode ? 'demo' : 'unconfigured',
      });
    }

    // ======================================================================
    // Production — create real Stripe Checkout Session
    // ======================================================================
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-26' as any,
    });

    // Build Stripe line_items from cart items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: {
        item_name: string;
        price: number;
        quantity: number;
        platform?: string;
      }) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.item_name,
            ...(item.platform
              ? { description: `Platform: ${item.platform}` }
              : {}),
          },
          unit_amount: Math.round(item.price * 100), // dollars to cents
        },
        quantity: item.quantity,
      })
    );

    // Build metadata for Stripe session and webhook processing
    const metadata: Record<string, string> = {
      type: 'customer_order',
      organization_id,
      customer_name,
      customer_email,
      ...(customer_phone ? { customer_phone: String(customer_phone) } : {}),
      ...(order_notes ? { order_notes: String(order_notes) } : {}),
    };

    // Add items_json within the 500-char Stripe metadata limit.
    // Store items as JSON array of {i: inventory_id, q: quantity} so the
    // webhook can deduct the correct stock quantities. For very large carts,
    // truncate at the last complete item boundary to preserve valid JSON.
    let itemsJsonRaw = JSON.stringify(
      items.map((item: { inventory_id: string; quantity: number }) => ({
        i: item.inventory_id,
        q: item.quantity,
      }))
    );

    if (itemsJsonRaw.length > 480) {
      // Truncate at the last complete item — find the last `},` within limit
      const safe = itemsJsonRaw.slice(0, 480);
      const lastClose = safe.lastIndexOf('},') + 1; // include the closing `}`
      if (lastClose > 2) {
        itemsJsonRaw = safe.slice(0, lastClose) + ']';
      }
    }
    metadata.items_json = itemsJsonRaw;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customer_email,
      metadata,
      success_url: baseSuccessUrl,
      cancel_url: baseCancelUrl,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[payments:create-checkout-session] Error:', message);
    return NextResponse.json(
      { error: 'Failed to create checkout session', detail: message },
      { status: 500 }
    );
  }
}
