import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * Stripe Webhook Handler
 *
 * Receives subscription lifecycle events and updates tenant subscription status
 * in the `guildos_core.organizations` table.
 *
 * In production:
 *   1. Verifies the Stripe signature via `stripe.webhooks.constructEvent()`
 *   2. Processes checkout.session.completed  → activate subscription
 *   3. Processes customer.subscription.updated → sync status
 *   4. Processes customer.subscription.deleted → downgrade tier
 *
 * In demo / unconfigured mode:
 *   Acknowledges the event with `{ received: true, mode: 'demo' }`
 *
 * NOTE on multi-tenant BYO Stripe accounts:
 *   If merchants bring their own Stripe accounts, each would need a unique
 *   webhook path for per-tenant secret resolution. For the MVP this handler
 *   uses the platform-level Stripe keys (process.env.STRIPE_*).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  try {
    const body = await request.text();

    // ======================================================================
    // Demo / unconfigured mode — acknowledge but do not process
    // ======================================================================
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.log(
        '[webhook:stripe] Received event (demo/unconfigured) — no processing'
      );
      return Response.json({ received: true, mode: 'demo' });
    }

    // ======================================================================
    // Production — verify Stripe signature
    // ======================================================================
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const supabase = await createClient();

    // ======================================================================
    // Event processing
    // ======================================================================
    switch (event.type) {
      // --------------------------------------------------------------------
      // checkout.session.completed — Activate subscription
      // Expects metadata: { organization_id, tier }
      // --------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;

        if (organizationId && customerId && subscriptionId) {
          await supabase
            .from('organizations')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              tier: session.metadata?.tier ?? 'merchant',
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId);

          console.log(
            `[webhook:stripe] Activated subscription ${subscriptionId} for org ${organizationId}`
          );
        } else {
          console.warn(
            '[webhook:stripe] checkout.session.completed missing metadata (organization_id, customer, subscription)'
          );
        }
        break;
      }

      // --------------------------------------------------------------------
      // customer.subscription.updated — Sync subscription status
      // --------------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1);

        if (orgs && orgs.length > 0) {
          const status =
            subscription.status === 'active'
              ? 'active'
              : subscription.status === 'past_due'
                ? 'past_due'
                : subscription.status === 'canceled'
                  ? 'canceled'
                  : 'inactive';

          await supabase
            .from('organizations')
            .update({
              subscription_status: status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgs[0].id);

          console.log(
            `[webhook:stripe] Updated subscription ${subscription.id} status to ${status} for org ${orgs[0].id}`
          );
        }
        break;
      }

      // --------------------------------------------------------------------
      // customer.subscription.deleted — Downgrade to free tier
      // --------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1);

        if (orgs && orgs.length > 0) {
          await supabase
            .from('organizations')
            .update({
              tier: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orgs[0].id);

          console.log(
            `[webhook:stripe] Downgraded org ${orgs[0].id} to free tier after subscription deletion`
          );
        }
        break;
      }

      // --------------------------------------------------------------------
      // invoice.payment_failed — Flag subscription as past_due
      // The `subscription` field is present in the API response but the SDK
      // typing is version-dependent, so we access it from the raw object.
      // --------------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string | undefined;

        if (subscriptionId) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .limit(1);

          if (orgs && orgs.length > 0) {
            await supabase
              .from('organizations')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orgs[0].id);

            console.log(
              `[webhook:stripe] Payment failed for subscription ${subscriptionId} — org ${orgs[0].id} set to past_due`
            );
          }
        }
        break;
      }
    }

    return Response.json({ received: true, type: event.type });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook:stripe] Error:', message);
    return Response.json(
      { error: 'Webhook processing failed', detail: message },
      { status: 400 }
    );
  }
}
