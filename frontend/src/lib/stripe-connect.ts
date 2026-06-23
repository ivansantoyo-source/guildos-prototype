"use client";

// ============================================================================
// GUILDOS — Stripe Connect Integration
// Multi-party split payments, escrow, auto-refunds
// ============================================================================

import { isDemoMode } from '@/lib/toggles';

interface SplitPaymentConfig {
  totalAmount: number;
  numPlayers: number;
  costPerPlayer: number;
  lobbyId: string;
  lobbyTitle: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}

interface PlayerPaymentConfig {
  lobbyId: string;
  playerId: string;
  playerName: string;
  shareAmount: number;
  lobbyTitle: string;
  successUrl: string;
  cancelUrl: string;
}

interface FundingStatus {
  lobbyId: string;
  totalCost: number;
  costPerPlayer: number;
  playersNeeded: number;
  playersPaid: number;
  amountFunded: number;
  isFullyFunded: boolean;
  paymentDeadline: string | null;
}

interface RefundResult {
  lobbyId: string;
  totalRefunded: number;
  playersRefunded: number;
  success: boolean;
}

const DEMO_MODE = isDemoMode();

/**
 * Create a split payment for a lobby (Stripe PaymentIntent with transfer_group).
 */
export async function createSplitPayment(config: SplitPaymentConfig): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      clientSecret: `pi_demo_${Date.now()}_secret_demo`,
      paymentIntentId: `pi_demo_${Date.now()}`,
    };
  }

  const res = await fetch('/api/stripe/split-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error('Failed to create split payment');
  return res.json();
}

/**
 * Create a Stripe Checkout session for one player's share.
 */
export async function createPlayerPaymentSession(config: PlayerPaymentConfig): Promise<{ url: string; sessionId: string }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      url: `${config.successUrl}?session=cs_demo_${Date.now()}`,
      sessionId: `cs_demo_${Date.now()}`,
    };
  }

  const res = await fetch('/api/nexus/lfg/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error('Failed to create payment session');
  return res.json();
}

/**
 * Check the funding status of a lobby.
 */
export async function checkLobbyFundingStatus(lobbyId: string): Promise<FundingStatus> {
  if (DEMO_MODE) {
    return {
      lobbyId,
      totalCost: 160.00,
      costPerPlayer: 40.00,
      playersNeeded: 4,
      playersPaid: 3,
      amountFunded: 120.00,
      isFullyFunded: false,
      paymentDeadline: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  const res = await fetch(`/api/nexus/lfg/${lobbyId}/funding-status`);
  if (!res.ok) throw new Error('Failed to check funding status');
  return res.json();
}

/**
 * Auto-refund all partial payments for an unfunded lobby.
 */
export async function triggerAutoRefund(lobbyId: string): Promise<RefundResult> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      lobbyId,
      totalRefunded: 120.00,
      playersRefunded: 3,
      success: true,
    };
  }

  const res = await fetch(`/api/nexus/lfg/${lobbyId}/refund`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger auto-refund');
  return res.json();
}

/**
 * Create a Stripe Connect Express account for a merchant.
 */
export async function createConnectAccount(merchantId: string, email: string): Promise<{ accountId: string; onboardingUrl: string }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      accountId: `acct_demo_${Date.now()}`,
      onboardingUrl: `https://connect.stripe.com/setup/demo/${Date.now()}`,
    };
  }

  const res = await fetch('/api/stripe/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId, email }),
  });

  if (!res.ok) throw new Error('Failed to create Connect account');
  return res.json();
}

/**
 * Format currency for display.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/**
 * Calculate cost per player given total cost and number of players.
 */
export function calculateCostPerPlayer(totalCost: number, maxPlayers: number): number {
  return Math.ceil((totalCost / maxPlayers) * 100) / 100;
}
