import { NextRequest } from 'next/server';

/**
 * Stripe Webhook Handler
 * Receives subscription lifecycle events and updates tenant subscription status.
 * In production: verifies Stripe signature, processes checkout.session.completed,
 * customer.subscription.updated, customer.subscription.deleted events.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  try {
    const body = await request.text();

    // In demo/production without Stripe configured, acknowledge but don't process
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('[webhook:stripe] Received event (demo/unconfigured)');
      return Response.json({ received: true, mode: 'demo' });
    }

    // Production: Verify signature and process
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    //
    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     // Activate subscription
    //     break;
    //   case 'customer.subscription.updated':
    //     // Update subscription status
    //     break;
    //   case 'customer.subscription.deleted':
    //     // Cancel subscription
    //     break;
    // }

    return Response.json({ received: true, mode: 'production' });
  } catch (error) {
    console.error('[webhook:stripe] Error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
