import type { StateCreator } from 'zustand';
import type { Cart, CartItem, Order } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface CustomerStorefrontSlice {
  cart: Cart | null;
  customerOrders: Order[];
  storefrontConfig: {
    store_name: string;
    tagline: string;
    enable_customer_chat: boolean;
    show_prices: boolean;
  } | null;
  setCart: (cart: Cart | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  applyDiscountToCart: (code: string, amount: number) => void;
  setCustomerOrders: (orders: Order[]) => void;
  addCustomerOrder: (order: Order) => void;
  updateCustomerOrder: (id: string, updates: Partial<Order>) => void;
  setStorefrontConfig: (config: {
    store_name: string;
    tagline: string;
    enable_customer_chat: boolean;
    show_prices: boolean;
  } | null) => void;
}

export const createCustomerStorefrontSlice: StateCreator<GuildState, [], [], CustomerStorefrontSlice> = (set) => ({
  cart: null,
  customerOrders: [],
  storefrontConfig: null,

  setCart: (cart) => set({ cart }),
  addToCart: (item) =>
    set((state) => {
      const existingCart = state.cart;
      if (!existingCart) {
        const newCart: Cart = {
          id: `cart-${Date.now()}`,
          organization_id: state.tenant?.id ?? 'demo-time-warp-001',
          profile_id: state.user?.id,
          items: [item],
          subtotal: item.price * item.quantity,
          discount_amount: 0,
          total: item.price * item.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { cart: newCart };
      }
      const existingIdx = existingCart.items.findIndex(
        (i) => i.inventory_id === item.inventory_id
      );
      let newItems: CartItem[];
      if (existingIdx >= 0) {
        newItems = existingCart.items.map((i, idx) =>
          idx === existingIdx
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...existingCart.items, item];
      }
      const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const total = Math.max(0, subtotal - existingCart.discount_amount);
      return {
        cart: {
          ...existingCart,
          items: newItems,
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100,
          updated_at: new Date().toISOString(),
        },
      };
    }),
  removeFromCart: (itemId) =>
    set((state) => {
      if (!state.cart) return { cart: null };
      const newItems = state.cart.items.filter((i) => i.id !== itemId);
      if (newItems.length === 0) return { cart: null };
      const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const total = Math.max(0, subtotal - state.cart.discount_amount);
      return {
        cart: {
          ...state.cart,
          items: newItems,
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(total * 100) / 100,
          updated_at: new Date().toISOString(),
        },
      };
    }),
  updateCartItemQty: (itemId, qty) =>
    set((state) => {
      if (!state.cart) return state;
      if (qty <= 0) {
        const newItems = state.cart.items.filter((i) => i.id !== itemId);
        if (newItems.length === 0) return { cart: null };
        const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return {
          cart: {
            ...state.cart,
            items: newItems,
            subtotal: Math.round(subtotal * 100) / 100,
            total: Math.round(Math.max(0, subtotal - state.cart.discount_amount) * 100) / 100,
            updated_at: new Date().toISOString(),
          },
        };
      }
      const newItems = state.cart.items.map((i) =>
        i.id === itemId ? { ...i, quantity: qty } : i
      );
      const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return {
        cart: {
          ...state.cart,
          items: newItems,
          subtotal: Math.round(subtotal * 100) / 100,
          total: Math.round(Math.max(0, subtotal - state.cart.discount_amount) * 100) / 100,
          updated_at: new Date().toISOString(),
        },
      };
    }),
  clearCart: () => set({ cart: null }),
  applyDiscountToCart: (code, amount) =>
    set((state) => {
      if (!state.cart) return state;
      const total = Math.max(0, state.cart.subtotal - amount);
      return {
        cart: {
          ...state.cart,
          discount_code: code,
          discount_amount: amount,
          total: Math.round(total * 100) / 100,
          updated_at: new Date().toISOString(),
        },
      };
    }),
  setCustomerOrders: (orders) => set({ customerOrders: orders }),
  addCustomerOrder: (order) =>
    set((state) => ({ customerOrders: [order, ...state.customerOrders] })),
  updateCustomerOrder: (id, updates) =>
    set((state) => ({
      customerOrders: state.customerOrders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),
  setStorefrontConfig: (config) => set({ storefrontConfig: config }),
});
