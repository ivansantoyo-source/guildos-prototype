"use client";

// ============================================================================
// GUILDOS — Pawn Shop Compliance
// Chain of custody, holding periods, seller affidavits, law enforcement reporting
// ============================================================================

import { isDemoMode } from '@/lib/toggles';

export type TransactionType = 'TRADE_IN' | 'CASH_SALE' | 'BOUNTY_FULFILLMENT' | 'DONATION' | 'AUCTION_PURCHASE' | 'ESTATE_LOT';
export type PaymentMethod = 'CASH' | 'STORE_CREDIT' | 'CHECK' | 'BANK_TRANSFER' | 'CRYPTO';

export interface ChainOfCustodyEntry {
  id: string;
  organization_id: string;
  inventory_id?: string;
  bounty_id?: string;
  seller_profile_id?: string;
  seller_id_verified: boolean;
  seller_identity_verification_id?: string;
  transaction_type: TransactionType;
  seller_stated_value?: number;
  amount_paid?: number;
  payment_method?: PaymentMethod;
  serial_number?: string;
  condition_notes?: string;
  seller_signed_affidavit: boolean;
  holding_period_days: number;
  holding_period_end?: string;
  law_enforcement_reported: boolean;
  law_enforcement_report_date?: string;
  created_at: string;
}

/**
 * Default holding period in days (varies by jurisdiction; 21 days is common).
 */
export const DEFAULT_HOLDING_PERIOD_DAYS = 21;

/**
 * Calculate holding period end date.
 */
export function calculateHoldingPeriodEnd(days: number = DEFAULT_HOLDING_PERIOD_DAYS): string {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return end.toISOString().split('T')[0];
}

/**
 * Check if an item is still within its mandatory holding period.
 * Returns 0 if holding period has passed, or days remaining.
 */
export function checkHoldingPeriod(entry: ChainOfCustodyEntry): number {
  if (!entry.holding_period_end) return 0;
  const end = new Date(entry.holding_period_end).getTime();
  const now = Date.now();
  if (now >= end) return 0;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

/**
 * Check if ID verification is required for a pawn-style transaction.
 */
export function requiresPawnID(transactionType: TransactionType, amount: number): boolean {
  if (transactionType === 'CASH_SALE' && amount > 25) return true;
  if (transactionType === 'TRADE_IN' && amount > 100) return true;
  if (transactionType === 'BOUNTY_FULFILLMENT' && amount > 50) return true;
  return false;
}

/**
 * Generate a seller's ownership affidavit text.
 */
export function generateSellerAffidavit(
  sellerName: string,
  itemDescription: string,
  serialNumber?: string,
): string {
  return `I, ${sellerName}, hereby affirm under penalty of perjury that I am the lawful owner of the following item and have full right to sell or trade it:

    Item: ${itemDescription}${serialNumber ? `\n    Serial Number: ${serialNumber}` : ''}

  I affirm that this item is not stolen, counterfeit, or subject to any liens or encumbrances. I understand that providing false information may result in legal action and permanent ban from GuildOS platforms.

  Signed: ___________________________    Date: ___________________________`;
}

/**
 * Generate a law enforcement report (returns CSV string of reportable transactions).
 */
export function generateLawEnforcementReport(
  entries: ChainOfCustodyEntry[],
  organizationName: string,
  dateRange: { start: string; end: string },
): string {
  const header = 'Transaction ID,Date,Type,Item,Seller ID Verified,Amount Paid,Payment Method,Serial Number,Holding Period End,Reported to LE';
  const rows = entries
    .filter((e) => {
      const created = new Date(e.created_at);
      return created >= new Date(dateRange.start) && created <= new Date(dateRange.end);
    })
    .map((e) =>
      [
        e.id,
        e.created_at.split('T')[0],
        e.transaction_type,
        e.condition_notes ?? 'N/A',
        e.seller_id_verified ? 'Yes' : 'No',
        e.amount_paid?.toFixed(2) ?? '0.00',
        e.payment_method ?? 'N/A',
        e.serial_number ?? 'N/A',
        e.holding_period_end ?? 'N/A',
        e.law_enforcement_reported ? 'Yes' : 'No',
      ].join(','),
    );

  return `# Law Enforcement Report — ${organizationName}\n# Period: ${dateRange.start} to ${dateRange.end}\n\n${header}\n${rows.join('\n')}`;
}

/**
 * Get demo chain of custody entries.
 */
export function getDemoChainOfCustody(): ChainOfCustodyEntry[] {
  const now = new Date();
  return [
    {
      id: 'coc-001',
      organization_id: 'demo-time-warp-001',
      inventory_id: 'inv-001',
      seller_profile_id: 'usr-002',
      seller_id_verified: true,
      transaction_type: 'TRADE_IN',
      seller_stated_value: 300,
      amount_paid: 150,
      payment_method: 'STORE_CREDIT',
      condition_notes: 'EarthBound — CIB, excellent condition',
      seller_signed_affidavit: true,
      holding_period_days: 21,
      holding_period_end: new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0],
      law_enforcement_reported: false,
      created_at: new Date(now.getTime() - 11 * 86400000).toISOString(),
    },
    {
      id: 'coc-002',
      organization_id: 'demo-time-warp-001',
      inventory_id: 'inv-006',
      seller_profile_id: 'usr-003',
      seller_id_verified: true,
      transaction_type: 'CASH_SALE',
      seller_stated_value: 800,
      amount_paid: 400,
      payment_method: 'CASH',
      serial_number: 'SAT-PDS-001',
      condition_notes: 'Panzer Dragoon Saga — CIB, minor disc scratches',
      seller_signed_affidavit: true,
      holding_period_days: 21,
      holding_period_end: new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0],
      law_enforcement_reported: true,
      law_enforcement_report_date: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0],
      created_at: new Date(now.getTime() - 6 * 86400000).toISOString(),
    },
    {
      id: 'coc-003',
      organization_id: 'demo-time-warp-001',
      bounty_id: 'bnt-004',
      seller_profile_id: 'usr-001',
      seller_id_verified: true,
      transaction_type: 'BOUNTY_FULFILLMENT',
      seller_stated_value: 120,
      amount_paid: 150,
      payment_method: 'STORE_CREDIT',
      condition_notes: 'PowerStone 2 — Fulfilled bounty',
      seller_signed_affidavit: true,
      holding_period_days: 21,
      holding_period_end: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0],
      law_enforcement_reported: false,
      created_at: new Date(now.getTime() - 31 * 86400000).toISOString(),
    },
    {
      id: 'coc-004',
      organization_id: 'demo-time-warp-001',
      inventory_id: 'inv-007',
      seller_profile_id: 'usr-004',
      seller_id_verified: false,
      transaction_type: 'TRADE_IN',
      seller_stated_value: 70,
      amount_paid: 40,
      payment_method: 'CASH',
      condition_notes: 'N64 Console — Loose, no controllers, untested',
      seller_signed_affidavit: true,
      holding_period_days: 21,
      holding_period_end: new Date(now.getTime() + 18 * 86400000).toISOString().split('T')[0],
      law_enforcement_reported: false,
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
  ];
}
