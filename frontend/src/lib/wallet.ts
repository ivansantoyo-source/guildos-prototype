// ============================================================================
// GUILDOS — Wallet System
// Digital wallet for store credit, bounty payouts, and split-pay
// ============================================================================

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  profile_id: string;
  type: 'CREDIT_BOUNTY' | 'CREDIT_REFERRAL' | 'CREDIT_ACHIEVEMENT' | 'DEBIT_PURCHASE' | 'DEBIT_LFG_BOOKING' | 'DEBIT_SAVE_ROOM' | 'REFUND';
  amount: number;
  description?: string;
  reference_type: string;
  reference_id?: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  profile_id: string;
  organization_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface WalletWithTransactions extends Wallet {
  transactions: WalletTransaction[];
}

/**
 * Create a new wallet for a profile.
 */
export function createWallet(profileId: string, organizationId: string): Wallet {
  return {
    id: `wallet-${Date.now()}`,
    profile_id: profileId,
    organization_id: organizationId,
    balance: 0,
    total_earned: 0,
    total_spent: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Credit a wallet (add funds).
 */
export function creditWallet(
  wallet: Wallet,
  amount: number,
  type: WalletTransaction['type'],
  referenceType: string,
  referenceId?: string,
  description?: string,
): { wallet: Wallet; transaction: WalletTransaction } {
  const updatedWallet: Wallet = {
    ...wallet,
    balance: wallet.balance + amount,
    total_earned: wallet.total_earned + amount,
    updated_at: new Date().toISOString(),
  };

  const transaction: WalletTransaction = {
    id: `wtxn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    wallet_id: wallet.id,
    profile_id: wallet.profile_id,
    type,
    amount,
    description,
    reference_type: referenceType,
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  return { wallet: updatedWallet, transaction };
}

/**
 * Debit a wallet (spend funds). Returns error if insufficient balance.
 */
export function debitWallet(
  wallet: Wallet,
  amount: number,
  type: WalletTransaction['type'],
  referenceType: string,
  referenceId?: string,
  description?: string,
): { wallet: Wallet; transaction: WalletTransaction } | { error: string } {
  if (wallet.balance < amount) {
    return { error: `Insufficient balance. Have $${wallet.balance.toFixed(2)}, need $${amount.toFixed(2)}` };
  }

  const updatedWallet: Wallet = {
    ...wallet,
    balance: wallet.balance - amount,
    total_spent: wallet.total_spent + amount,
    updated_at: new Date().toISOString(),
  };

  const transaction: WalletTransaction = {
    id: `wtxn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    wallet_id: wallet.id,
    profile_id: wallet.profile_id,
    type,
    amount,
    description,
    reference_type: referenceType,
    reference_id: referenceId,
    created_at: new Date().toISOString(),
  };

  return { wallet: updatedWallet, transaction };
}

/**
 * Get demo wallet.
 */
export function getDemoWallet(): Wallet {
  return {
    id: 'wallet-demo-001',
    profile_id: 'usr-001',
    organization_id: 'demo-time-warp-001',
    balance: 275.50,
    total_earned: 850.00,
    total_spent: 574.50,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get demo wallet transactions.
 */
export function getDemoTransactions(): WalletTransaction[] {
  const now = Date.now();
  const walletId = 'wallet-demo-001';
  const profileId = 'usr-001';

  return [
    {
      id: 'wtxn-001',
      wallet_id: walletId,
      profile_id: profileId,
      type: 'CREDIT_BOUNTY',
      amount: 150.00,
      description: 'Bounty fulfilled: PowerStone 2',
      reference_type: 'bounty',
      reference_id: 'bnt-004',
      created_at: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'wtxn-002',
      wallet_id: walletId,
      profile_id: profileId,
      type: 'DEBIT_SAVE_ROOM',
      amount: 50.00,
      description: 'Save Room Omega — Monthly',
      reference_type: 'save_room',
      reference_id: 'room-003',
      created_at: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: 'wtxn-003',
      wallet_id: walletId,
      profile_id: profileId,
      type: 'CREDIT_ACHIEVEMENT',
      amount: 25.00,
      description: 'Achievement bonus: First Scan',
      reference_type: 'achievement',
      reference_id: 'first-scan',
      created_at: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: 'wtxn-004',
      wallet_id: walletId,
      profile_id: profileId,
      type: 'DEBIT_PURCHASE',
      amount: 35.50,
      description: 'Potion order: Brain Fuel Smoothie + Zen Tea',
      reference_type: 'potion_order',
      reference_id: 'po-001',
      created_at: new Date(now - 7 * 86400000).toISOString(),
    },
    {
      id: 'wtxn-005',
      wallet_id: walletId,
      profile_id: profileId,
      type: 'CREDIT_BOUNTY',
      amount: 75.00,
      description: 'Trade-in bonus: Sonic 2',
      reference_type: 'trade_in',
      reference_id: 'inv-004',
      created_at: new Date(now - 10 * 86400000).toISOString(),
    },
  ];
}
