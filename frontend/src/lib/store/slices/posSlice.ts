import type { StateCreator } from 'zustand';
import type { POSCartItem, POSSession, POSTransaction } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface POSSlice {
  posCart: POSCartItem[];
  posSession: POSSession | null;
  posTransactions: POSTransaction[];
  addToPOSCart: (item: POSCartItem) => void;
  removeFromPOSCart: (itemId: string) => void;
  updatePOSCartItemQty: (itemId: string, qty: number) => void;
  clearPOSCart: () => void;
  setPOSSession: (session: POSSession | null) => void;
  closePOSSession: (endingCash: number, notes?: string) => void;
  addPOSTransaction: (transaction: POSTransaction) => void;
}

export const createPOSSlice: StateCreator<GuildState, [], [], POSSlice> = (set) => ({
  posCart: [],
  posSession: null,
  posTransactions: [],

  addToPOSCart: (item) =>
    set((state) => {
      const existing = state.posCart.find((i) => i.inventory_id === item.inventory_id);
      if (existing) {
        return {
          posCart: state.posCart.map((i) =>
            i.inventory_id === item.inventory_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { posCart: [...state.posCart, item] };
    }),
  removeFromPOSCart: (itemId) =>
    set((state) => ({
      posCart: state.posCart.filter((i) => i.id !== itemId),
    })),
  updatePOSCartItemQty: (itemId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { posCart: state.posCart.filter((i) => i.id !== itemId) };
      }
      return {
        posCart: state.posCart.map((i) =>
          i.id === itemId ? { ...i, quantity: qty } : i
        ),
      };
    }),
  clearPOSCart: () => set({ posCart: [] }),
  setPOSSession: (session) => set({ posSession: session }),
  closePOSSession: (endingCash, notes) =>
    set((state) => {
      if (!state.posSession) return state;
      const now = new Date().toISOString();
      return {
        posSession: {
          ...state.posSession,
          closed_at: now,
          ending_cash: endingCash,
          status: 'CLOSED' as const,
          notes,
        },
      };
    }),
  addPOSTransaction: (transaction) =>
    set((state) => ({
      posTransactions: [transaction, ...state.posTransactions],
      posCart: [],
    })),
});
