// ============================================================================
// GUILDOS — Stripe Billing Integration
// Subscription management, checkout sessions, billing portal
// ============================================================================

import { shouldUseMock } from '@/lib/toggles';

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

/**
 * Create a Stripe Checkout Session for subscribing to a GuildOS tier.
 */
export async function createCheckoutSession(
  tier: 'merchant' | 'wizard' | 'time_lord',
  customerId?: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<CheckoutSession> {
  if (shouldUseMock('payments')) {
    return mockCheckoutSession(tier);
  }

  // Production: call Stripe API
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn('Stripe not configured — falling back to mock');
      return mockCheckoutSession(tier);
    }

    // Stripe Price IDs would come from the Stripe Dashboard
    const PRICE_IDS: Record<string, string> = {
      merchant: process.env.STRIPE_PRICE_MERCHANT ?? 'price_merchant',
      wizard: process.env.STRIPE_PRICE_WIZARD ?? 'price_wizard',
      time_lord: process.env.STRIPE_PRICE_TIME_LORD ?? 'price_time_lord',
    };

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': PRICE_IDS[tier],
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
        cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
        ...(customerId ? { customer: customerId } : {}),
      }),
    });

    const data = await response.json();

    return {
      url: data.url ?? '#',
      sessionId: data.id ?? `cs-${Date.now()}`,
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return mockCheckoutSession(tier);
  }
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions.
 */
export async function createBillingPortalSession(
  customerId: string
): Promise<{ url: string }> {
  if (shouldUseMock('payments')) {
    return { url: `https://billing.stripe.com/mock/${customerId}` };
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { url: `https://billing.stripe.com/mock/${customerId}` };
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    });

    const data = await response.json();
    return { url: data.url ?? '#' };
  } catch (error) {
    console.error('Stripe portal error:', error);
    return { url: `https://billing.stripe.com/mock/${customerId}` };
  }
}

/**
 * Get subscription status for a customer.
 */
export async function getSubscriptionStatus(
  customerId: string
): Promise<SubscriptionStatus> {
  if (shouldUseMock('payments')) {
    return {
      tier: 'wizard',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  // Production: query Stripe for real subscription status
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return mockSubscriptionStatus();
    }

    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`,
      {
        headers: { 'Authorization': `Bearer ${secretKey}` },
      }
    );

    const data = await response.json();
    const sub = data.data?.[0];

    if (!sub) {
      return { tier: 'none', status: 'inactive', currentPeriodEnd: '', cancelAtPeriodEnd: false };
    }

    return {
      tier: inferTierFromPriceId(sub.items?.data?.[0]?.price?.id ?? ''),
      status: sub.status ?? 'unknown',
      currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    };
  } catch (error) {
    console.error('Stripe subscription error:', error);
    return mockSubscriptionStatus();
  }
}

// --- Mock Helpers ---

function mockCheckoutSession(tier: string): CheckoutSession {
  console.log(`%c[DEMO STRIPE] %cCreating checkout for ${tier} tier`,
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
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  };
}

function inferTierFromPriceId(priceId: string): string {
  if (priceId.includes('time_lord') || priceId.includes('499')) return 'time_lord';
  if (priceId.includes('wizard') || priceId.includes('249')) return 'wizard';
  if (priceId.includes('merchant') || priceId.includes('99')) return 'merchant';
  return 'unknown';
}
