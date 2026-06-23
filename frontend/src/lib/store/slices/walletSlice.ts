import type { StateCreator } from 'zustand';
import type { Wallet, WalletTransaction } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface WalletSlice {
  wallet: Wallet | null;
  walletTransactions: WalletTransaction[];
  setWallet: (wallet: Wallet | null) => void;
  setWalletTransactions: (transactions: WalletTransaction[]) => void;
  addWalletTransaction: (txn: WalletTransaction) => void;
}

export const createWalletSlice: StateCreator<GuildState, [], [], WalletSlice> = (set) => ({
  wallet: null,
  walletTransactions: [],

  setWallet: (wallet) => set({ wallet }),
  setWalletTransactions: (transactions) => set({ walletTransactions: transactions }),
  addWalletTransaction: (txn) =>
    set((state) => ({
      walletTransactions: [txn, ...state.walletTransactions],
    })),
});
