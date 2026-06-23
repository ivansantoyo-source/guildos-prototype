"use client";

// ============================================================================
// GUILDOS — Identity Verification
// Stripe Identity integration + manual ID checks for pawn compliance
// ============================================================================

import { isDemoMode } from '@/lib/toggles';

export type VerificationType = 'STRIPE_IDENTITY' | 'MANUAL_ID_CHECK' | 'GUARDIAN_VERIFICATION';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface IdentityVerification {
  id: string;
  profile_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  stripe_verification_session_id?: string;
  verified_at?: string;
  verified_by?: string;
  id_document_type?: string;
  id_issuing_country?: string;
  id_expiry_date?: string;
  notes?: string;
  created_at: string;
}

/**
 * Start a Stripe Identity verification session.
 * Returns a URL the user must visit to complete verification.
 */
export async function startIdentityVerification(profileId: string): Promise<{ verificationId: string; verificationUrl: string }> {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      verificationId: `iv-demo-${Date.now()}`,
      verificationUrl: `https://verify.stripe.com/demo/${Date.now()}`,
    };
  }

  const res = await fetch('/api/identity/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profileId }),
  });

  if (!res.ok) throw new Error('Failed to start identity verification');
  return res.json();
}

/**
 * Check the status of a verification.
 */
export async function checkVerificationStatus(profileId: string): Promise<IdentityVerification | null> {
  if (isDemoMode()) {
    return {
      id: `iv-demo-${profileId}`,
      profile_id: profileId,
      verification_type: 'STRIPE_IDENTITY',
      status: 'VERIFIED',
      stripe_verification_session_id: `vs_demo_${Date.now()}`,
      verified_at: new Date().toISOString(),
      id_document_type: 'DRIVERS_LICENSE',
      id_issuing_country: 'US',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    };
  }

  const res = await fetch(`/api/identity/status?profile_id=${profileId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.verification ?? null;
}

/**
 * Check if a user is verified for cash bounty payouts.
 * Requires identity verification for: cash payouts > $50, any pawn-style transaction.
 */
export function isVerifiedForCashBounties(verification: IdentityVerification | null): boolean {
  if (!verification) return false;
  return verification.status === 'VERIFIED';
}

/**
 * Check if identity verification is required for a transaction.
 * Thresholds: cash > $25 requires ID, trade-in > $100 requires ID.
 */
export function requiresIDVerification(transactionType: string, amount: number): boolean {
  if (transactionType === 'CASH_SALE' && amount > 25) return true;
  if (transactionType === 'TRADE_IN' && amount > 100) return true;
  if (transactionType === 'BOUNTY_FULFILLMENT' && amount > 50) return true;
  return false;
}

/**
 * Manual ID verification (performed by staff member).
 */
export async function manualIDVerification(
  profileId: string,
  staffProfileId: string,
  idDocumentType: string,
  idCountry: string,
  idExpiry: string,
  notes?: string,
): Promise<IdentityVerification> {
  if (isDemoMode()) {
    return {
      id: `iv-manual-demo-${Date.now()}`,
      profile_id: profileId,
      verification_type: 'MANUAL_ID_CHECK',
      status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: staffProfileId,
      id_document_type: idDocumentType,
      id_issuing_country: idCountry,
      id_expiry_date: idExpiry,
      notes,
      created_at: new Date().toISOString(),
    };
  }

  const res = await fetch('/api/identity/manual-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profileId,
      staff_id: staffProfileId,
      id_document_type: idDocumentType,
      id_country: idCountry,
      id_expiry: idExpiry,
      notes,
    }),
  });

  if (!res.ok) throw new Error('Manual verification failed');
  return res.json();
}
