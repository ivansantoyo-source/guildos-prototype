import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

// Cache Stripe instance — avoid creating a new client on every webhook request
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia' as any,
    });
  }
  return stripeInstance!;
}

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
 *
 * Rate limited by Stripe signature (60/min) — no auth required since Stripe
 * calls this webhook directly and verifies via webhook secret.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 60/min per Stripe signature + IP
  const stripeIp = request.headers.get('x-forwarded-for') || 'stripe-webhook';
  const signature = request.headers.get('stripe-signature') || '';
  const rlKey = `stripe-webhook-${signature.slice(0, 16)}-${stripeIp}`;
  if (await rateLimit(rlKey, { maxRequests: 60, windowMs: 60_000 })) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

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
    const stripe = getStripe();

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
      // checkout.session.completed — Activate subscription or lobby payment
      // Subscription: expects metadata { organization_id, tier }
      // Lobby split-pay: expects metadata { lobby_id, participant_id }
      // --------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Lobby split-pay checkout — update participant payment status
        if (session.metadata?.lobby_id) {
          const lobbyId = session.metadata.lobby_id;
          const participantId = session.metadata.participant_id;

          if (participantId && lobbyId) {
            const paymentIntent = session.payment_intent as string | undefined;

            await supabase
              .from('nexus_lfg_participants')
              .update({
                payment_status: 'PAID',
                payment_intent_id: paymentIntent || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', participantId);

            console.log(
              `[webhook:stripe] Lobby payment completed — participant ${participantId} in lobby ${lobbyId}`
            );
          } else {
            console.warn(
              '[webhook:stripe] checkout.session.completed missing lobby participant metadata'
            );
          }
          break;
        }

        // Subscription activation (existing behavior)
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
      // payment_intent.succeeded — Update participant payment status to PAID
      // Expects metadata { lobby_id, participant_id }
      // --------------------------------------------------------------------
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const lobbyId = pi.metadata?.lobby_id;
        const participantId = pi.metadata?.participant_id;

        if (participantId && lobbyId) {
          await supabase
            .from('nexus_lfg_participants')
            .update({
              payment_status: 'PAID',
              payment_intent_id: pi.id,
              amount_paid: (pi.amount_received || 0) / 100,
              updated_at: new Date().toISOString(),
            })
            .eq('id', participantId);

          console.log(
            `[webhook:stripe] Payment succeeded — participant ${participantId} in lobby ${lobbyId}`
          );
        }
        break;
      }

      // --------------------------------------------------------------------
      // payment_intent.payment_failed — Mark participant payment as FAILED
      // --------------------------------------------------------------------
      case 'payment_intent.payment_failed': {
        const piFailed = event.data.object as Stripe.PaymentIntent;
        const piLobbyId = piFailed.metadata?.lobby_id;
        const piParticipantId = piFailed.metadata?.participant_id;

        if (piParticipantId && piLobbyId) {
          await supabase
            .from('nexus_lfg_participants')
            .update({
              payment_status: 'FAILED',
              updated_at: new Date().toISOString(),
            })
            .eq('id', piParticipantId);

          console.log(
            `[webhook:stripe] Payment failed — participant ${piParticipantId} in lobby ${piLobbyId}`
          );
        }
        break;
      }

      // --------------------------------------------------------------------
      // charge.refunded — Mark participant as REFUNDED
      // --------------------------------------------------------------------
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string | undefined;

        if (paymentIntentId) {
          const { data: participants } = await supabase
            .from('nexus_lfg_participants')
            .select('id')
            .eq('payment_intent_id', paymentIntentId)
            .limit(1);

          if (participants && participants.length > 0) {
            await supabase
              .from('nexus_lfg_participants')
              .update({
                payment_status: 'REFUNDED',
                updated_at: new Date().toISOString(),
              })
              .eq('id', participants[0].id);

            console.log(
              `[webhook:stripe] Charge refunded for payment intent ${paymentIntentId} — participant ${participants[0].id}`
            );
          }
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
