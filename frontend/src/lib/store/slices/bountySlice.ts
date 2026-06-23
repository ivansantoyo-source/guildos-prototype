import type { StateCreator } from 'zustand';
import type { Bounty, ArbitrageMatch, BountyStats, WalletTransaction } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface BountySlice {
  bounties: Bounty[];
  arbitrageMatches: ArbitrageMatch[];
  bountyStats: BountyStats[];
  setBounties: (bounties: Bounty[]) => void;
  addBounty: (bounty: Bounty) => void;
  fulfillBounty: (id: string, fulfilled_by: string) => void;
  removeBounty: (id: string) => void;
  updateBounty: (id: string, updates: Partial<Bounty>) => void;
  claimBounty: (id: string, profileId: string, hunterTag: string) => void;
  updateFulfillmentStatus: (id: string, status: string) => void;
  addLimitOrder: (bounty: Bounty) => void;
  setArbitrageMatches: (matches: ArbitrageMatch[]) => void;
  setBountyStats: (stats: BountyStats[]) => void;
  applyStoreCredit: (amount: number) => { success: boolean; error?: string };
}

export const createBountySlice: StateCreator<GuildState, [], [], BountySlice> = (set, get) => ({
  bounties: [],
  arbitrageMatches: [],
  bountyStats: [],

  setBounties: (bounties) => set({ bounties }),
  addBounty: (bounty) =>
    set((state) => ({ bounties: [bounty, ...state.bounties] })),
  fulfillBounty: (id, fulfilled_by) =>
    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === id
          ? { ...b, status: 'FULFILLED' as const, fulfilled_by, fulfilled_at: new Date().toISOString() }
          : b
      ),
    })),
  removeBounty: (id) =>
    set((state) => ({
      bounties: state.bounties.filter((b) => b.id !== id),
    })),
  updateBounty: (id, updates) =>
    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
  claimBounty: (id, profileId, hunterTag) =>
    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === id
          ? {
              ...b,
              fulfillment_status: 'CLAIMED',
              claimed_by: hunterTag,
              fulfilled_by_profile: profileId,
              claimed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : b
      ),
    })),
  updateFulfillmentStatus: (id, status) =>
    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === id
          ? {
              ...b,
              fulfillment_status: status as any,
              updated_at: new Date().toISOString(),
            }
          : b
      ),
    })),
  addLimitOrder: (bounty) =>
    set((state) => ({
      bounties: [bounty, ...state.bounties],
    })),
  setArbitrageMatches: (matches) => set({ arbitrageMatches: matches }),
  setBountyStats: (stats) => set({ bountyStats: stats }),
  applyStoreCredit: (amount): { success: boolean; error?: string } => {
    const state = get();
    const wallet = state.wallet;

    if (!wallet) {
      return { success: false, error: "No wallet found" };
    }

    if (wallet.balance < amount) {
      return {
        success: false,
        error: `Insufficient balance. Have $${wallet.balance.toFixed(2)}, need $${amount.toFixed(2)}`,
      };
    }

    const now = new Date().toISOString();
    const transaction: WalletTransaction = {
      id: `wtxn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      wallet_id: wallet.id,
      profile_id: wallet.profile_id,
      type: "DEBIT_PURCHASE",
      amount,
      description: "Store credit purchase",
      reference_type: "store_credit",
      created_at: now,
    };

    set({
      wallet: {
        ...wallet,
        balance: Math.round((wallet.balance - amount) * 100) / 100,
        total_spent: Math.round((wallet.total_spent + amount) * 100) / 100,
        updated_at: now,
      },
      walletTransactions: [transaction, ...state.walletTransactions],
    });

    return { success: true };
  },
});
