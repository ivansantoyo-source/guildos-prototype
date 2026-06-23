import type { StateCreator } from 'zustand';
import type { PotionMenuItem, PotionOrder } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface PotionSlice {
  potionsMenu: PotionMenuItem[];
  potionOrders: PotionOrder[];
  potionCart: { item: PotionMenuItem; qty: number; toStation: boolean; stationName?: string }[];
  setPotionsMenu: (items: PotionMenuItem[]) => void;
  addToPotionCart: (item: PotionMenuItem) => void;
  removeFromPotionCart: (itemId: string) => void;
  clearPotionCart: () => void;
  setPotionOrders: (orders: PotionOrder[]) => void;
  addPotionOrder: (order: PotionOrder) => void;
}

export const createPotionSlice: StateCreator<GuildState, [], [], PotionSlice> = (set) => ({
  potionsMenu: [],
  potionOrders: [],
  potionCart: [],

  setPotionsMenu: (items) => set({ potionsMenu: items }),
  addToPotionCart: (item) =>
    set((state) => {
      const existing = state.potionCart.find((c) => c.item.id === item.id);
      if (existing) {
        return {
          potionCart: state.potionCart.map((c) =>
            c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
          ),
        };
      }
      return {
        potionCart: [...state.potionCart, { item, qty: 1, toStation: false }],
      };
    }),
  removeFromPotionCart: (itemId) =>
    set((state) => ({
      potionCart: state.potionCart.filter((c) => c.item.id !== itemId),
    })),
  clearPotionCart: () => set({ potionCart: [] }),
  setPotionOrders: (orders) => set({ potionOrders: orders }),
  addPotionOrder: (order) =>
    set((state) => ({
      potionOrders: [...state.potionOrders, order],
    })),
});
