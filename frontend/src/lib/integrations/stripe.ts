// ============================================================================
// GUILDOS — Stripe Billing Integration
// Subscription management, checkout sessions, billing portal
// Uses Stripe SDK v22+ with optional tenant BYO key support.
// ============================================================================

import Stripe from 'stripe';
import { isDemoMode } from '@/lib/toggles';
import { getEffectiveKey } from '@/lib/types/tenant-keys';
import type { TenantConfig } from '@/lib/types/tenant-keys';

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cache Stripe clients by secret key to avoid re-initialization
 * within the same request/process lifetime.
 */
const stripeClients = new Map<string, Stripe>();

export function getStripeClient(secretKey: string): Stripe {
  let client = stripeClients.get(secretKey);
  if (!client) {
    client = new Stripe(secretKey);
    stripeClients.set(secretKey, client);
  }
  return client;
}

/**
 * Resolve the effective Stripe secret key.
 * Priority: tenant BYO key > platform env var.
 */
function getSecretKey(tenantConfig?: TenantConfig | null): string | null {
  return getEffectiveKey(tenantConfig ?? null, 'stripe');
}

/**
 * Price IDs from the Stripe Dashboard.
 * Merchants with their own Stripe accounts can override these per-tenant.
 */
function getPriceIds(): Record<string, string> {
  return {
    merchant: process.env.STRIPE_PRICE_MERCHANT ?? 'price_merchant',
    wizard: process.env.STRIPE_PRICE_WIZARD ?? 'price_wizard',
    time_lord: process.env.STRIPE_PRICE_TIME_LORD ?? 'price_time_lord',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Checkout Session for a one-time payment (e.g. save room booking).
 *
 * @param amount       Amount in dollars (converted to cents by this function)
 * @param description  Human-readable description shown in Stripe Checkout
 * @param successUrl   Redirect URL on successful payment
 * @param cancelUrl    Redirect URL on cancellation
 * @param tenantConfig Optional tenant BYO key config
 */
export async function createPaymentCheckoutSession(
  amount: number,
  description: string,
  successUrl?: string,
  cancelUrl?: string,
  tenantConfig?: TenantConfig | null
): Promise<CheckoutSession> {
  if (isDemoMode()) {
    return mockCheckoutSession('payment');
  }

  try {
    const secretKey = getSecretKey(tenantConfig);
    if (!secretKey) {
      return mockCheckoutSession('payment');
    }

    const stripe = getStripeClient(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: description },
            unit_amount: Math.round(amount * 100), // dollars → cents
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL}/nexus?checkout=success`,
      cancel_url:
        cancelUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL}/nexus?checkout=cancelled`,
    });

    return {
      url: session.url ?? '#',
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[Stripe] Payment checkout error:', error);
    return mockCheckoutSession('payment');
  }
}

/**
 * Create a Stripe Checkout Session for subscribing to a GuildOS tier.
 *
 * @param tier          Subscription tier
 * @param customerId    Optional existing Stripe customer ID
 * @param successUrl    Redirect URL on successful payment
 * @param cancelUrl     Redirect URL on cancellation
 * @param tenantConfig  Optional tenant BYO key config (if omitted, falls back to platform env vars)
 */
export async function createCheckoutSession(
  tier: 'merchant' | 'wizard' | 'time_lord',
  customerId?: string,
  successUrl?: string,
  cancelUrl?: string,
  tenantConfig?: TenantConfig | null
): Promise<CheckoutSession> {
  // 1. Mock in demo mode
  if (isDemoMode()) {
    return mockCheckoutSession(tier);
  }

  try {
    // 2. Resolve the effective key (tenant BYO > platform env var)
    const secretKey = getSecretKey(tenantConfig);

    if (!secretKey) {
      console.warn('[Stripe] No secret key configured (tenant or platform) — falling back to mock');
      return mockCheckoutSession(tier);
    }

    // 3. Use Stripe SDK
    const stripe = getStripeClient(secretKey);
    const PRICE_IDS = getPriceIds();

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      mode: 'subscription',
      success_url:
        successUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url:
        cancelUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
      ...(customerId ? { customer: customerId } : {}),
    });

    return {
      url: session.url ?? '#',
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[Stripe] Checkout session error:', error);
    return mockCheckoutSession(tier);
  }
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions.
 *
 * @param customerId    Stripe customer ID
 * @param tenantConfig  Optional tenant BYO key config
 */
export async function createBillingPortalSession(
  customerId: string,
  tenantConfig?: TenantConfig | null
): Promise<{ url: string }> {
  // 1. Mock in demo mode
  if (isDemoMode()) {
    return { url: `https://billing.stripe.com/mock/${customerId}` };
  }

  try {
    // 2. Resolve effective key
    const secretKey = getSecretKey(tenantConfig);

    if (!secretKey) {
      return { url: `https://billing.stripe.com/mock/${customerId}` };
    }

    // 3. Use Stripe SDK
    const stripe = getStripeClient(secretKey);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('[Stripe] Billing portal error:', error);
    return { url: `https://billing.stripe.com/mock/${customerId}` };
  }
}

/**
 * Get subscription status for a customer.
 *
 * @param customerId    Stripe customer ID
 * @param tenantConfig  Optional tenant BYO key config
 */
export async function getSubscriptionStatus(
  customerId: string,
  tenantConfig?: TenantConfig | null
): Promise<SubscriptionStatus> {
  // 1. Mock in demo mode
  if (isDemoMode()) {
    return mockSubscriptionStatus();
  }

  try {
    // 2. Resolve effective key
    const secretKey = getSecretKey(tenantConfig);

    if (!secretKey) {
      return mockSubscriptionStatus();
    }

    // 3. Use Stripe SDK
    const stripe = getStripeClient(secretKey);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const sub = subscriptions.data[0];

    if (!sub) {
      return {
        tier: 'none',
        status: 'inactive',
        currentPeriodEnd: '',
        cancelAtPeriodEnd: false,
      };
    }

    return {
      tier: inferTierFromPriceId(sub.items?.data?.[0]?.price?.id ?? ''),
      status: sub.status,
      currentPeriodEnd: new Date(
        ((sub as unknown as Record<string, unknown>).current_period_end as number ?? 0) * 1000
      ).toISOString(),
      cancelAtPeriodEnd: (sub as unknown as Record<string, unknown>).cancel_at_period_end as boolean ?? false,
    };
  } catch (error) {
    console.error('[Stripe] Subscription status error:', error);
    return mockSubscriptionStatus();
  }
}

// ---------------------------------------------------------------------------
// Mock Helpers — used when running in demo mode or without Stripe configured
// ---------------------------------------------------------------------------

function mockCheckoutSession(tier: string): CheckoutSession {
  console.log(
    '%c[DEMO STRIPE] %cCreating checkout for ' + tier + ' tier',
    'color: blue; font-weight: bold;',
    'color: white;'
  );

  return {
    url: `https://checkout.stripe.com/mock/${tier}?session=cs_demo_${Date.now()}`,
    sessionId: `cs_demo_${Date.now()}`,
  };
}

function mockSubscriptionStatus(): SubscriptionStatus {
  return {
    tier: 'wizard',
    status: 'active',
    currentPeriodEnd: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    cancelAtPeriodEnd: false,
  };
}

function inferTierFromPriceId(priceId: string): string {
  if (priceId.includes('time_lord') || priceId.includes('499'))
    return 'time_lord';
  if (priceId.includes('wizard') || priceId.includes('249')) return 'wizard';
  if (priceId.includes('merchant') || priceId.includes('99'))
    return 'merchant';
  return 'unknown';
}
