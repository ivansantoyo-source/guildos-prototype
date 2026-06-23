"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Coffee, Waves, Brain, Salad, Droplets, Zap, Star, ChevronRight, Monitor, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import PaymentMethodSelector from '@/components/payment/payment-method-selector';
import type { PaymentMethod } from '@/components/payment/payment-method-selector';
import { isDemoMode } from '@/lib/toggles';

interface PotionItem {
  id: string;
  name: string;
  description: string;
  category: 'TEA' | 'SMOOTHIE' | 'NOOTROPIC' | 'MEAL' | 'SNACK' | 'HYDRATION';
  price: number;
  vitality_boost: { stamina?: number; mind?: number; body?: number; soul?: number; duration_minutes?: number };
  emoji: string;
}

type Category = { key: string; label: string; icon: React.ElementType; emoji: string };

const CATEGORIES: Category[] = [
  { key: 'TEA', label: 'Teas', icon: Coffee, emoji: '🍵' },
  { key: 'SMOOTHIE', label: 'Smoothies', icon: Waves, emoji: '🥤' },
  { key: 'NOOTROPIC', label: 'Nootropics', icon: Brain, emoji: '🧠' },
  { key: 'MEAL', label: 'Meals', icon: Salad, emoji: '🥗' },
  { key: 'HYDRATION', label: 'Hydration', icon: Droplets, emoji: '💧' },
];

const DEMO_MENU: PotionItem[] = [
  { id: 'pot-001', name: 'Zen Green Tea', description: 'Japanese matcha with lion\'s mane mushroom. Calm focus without jitters.', category: 'TEA', price: 5.00, vitality_boost: { mind: 1, stamina: 5, duration_minutes: 120 }, emoji: '🍵' },
  { id: 'pot-002', name: 'Dragon Chai', description: 'Spiced black tea with adaptogenic herbs. Warming and energizing.', category: 'TEA', price: 4.50, vitality_boost: { stamina: 8, body: 1, duration_minutes: 90 }, emoji: '☕' },
  { id: 'pot-003', name: 'Berry Mana Smoothie', description: 'Blueberry, acai, banana, and hemp protein. Sustained energy for long sessions.', category: 'SMOOTHIE', price: 8.00, vitality_boost: { stamina: 15, body: 2, duration_minutes: 180 }, emoji: '🥤' },
  { id: 'pot-004', name: 'Tropical Phoenix', description: 'Mango, pineapple, coconut water, and turmeric. Anti-inflammatory recovery.', category: 'SMOOTHIE', price: 7.50, vitality_boost: { stamina: 12, body: 1, duration_minutes: 150 }, emoji: '🍹' },
  { id: 'pot-005', name: 'Mind Sharp Nootropic', description: 'Alpha-GPC, L-Theanine, and Rhodiola Rosea. Tournament-grade cognitive enhancement.', category: 'NOOTROPIC', price: 6.00, vitality_boost: { mind: 3, soul: 1, duration_minutes: 240 }, emoji: '🧠' },
  { id: 'pot-006', name: 'Focus Formula', description: 'Caffeine + L-Theanine stack. The classic gamer focus combo, perfected.', category: 'NOOTROPIC', price: 4.00, vitality_boost: { mind: 2, duration_minutes: 180 }, emoji: '⚡' },
  { id: 'pot-007', name: 'Warrior Bowl', description: 'Grilled chicken, quinoa, roasted vegetables, and tahini. Real food for real gamers.', category: 'MEAL', price: 12.00, vitality_boost: { stamina: 25, body: 3, soul: 1, duration_minutes: 300 }, emoji: '🥗' },
  { id: 'pot-008', name: 'Mage\'s Grain Bowl', description: 'Falafel, hummus, pickled vegetables, and herb rice. Plant-powered arcade fuel.', category: 'MEAL', price: 11.00, vitality_boost: { stamina: 20, body: 2, mind: 1, duration_minutes: 240 }, emoji: '🧆' },
  { id: 'pot-009', name: 'Pixel Trail Mix', description: 'Dark chocolate, almonds, dried cherries, and sea salt. Perfect handheld snack.', category: 'SNACK', price: 4.00, vitality_boost: { stamina: 5, duration_minutes: 60 }, emoji: '🥜' },
  { id: 'pot-010', name: 'Energy Bar — Legendary', description: 'Oats, honey, peanut butter, and dark chocolate chunks. Baked fresh daily.', category: 'SNACK', price: 3.50, vitality_boost: { stamina: 8, body: 1, duration_minutes: 90 }, emoji: '🍫' },
  { id: 'pot-011', name: 'Electrolyte Elixir', description: 'Coconut water base with magnesium and potassium. Stay hydrated through marathon sessions.', category: 'HYDRATION', price: 3.00, vitality_boost: { stamina: 10, duration_minutes: 60 }, emoji: '💧' },
  { id: 'pot-012', name: 'Iced Hibiscus Refresher', description: 'Caffeine-free. Hibiscus, rosehip, and a touch of honey. Cool and refreshing.', category: 'HYDRATION', price: 3.50, vitality_boost: { stamina: 5, soul: 1, duration_minutes: 60 }, emoji: '🌺' },
];

interface CartItem { item: PotionItem; qty: number; toStation: boolean; stationName?: string }

export default function PotionsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('TEA');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [deliverToStation, setDeliverToStation] = useState(false);
  const [stationName, setStationName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('store_credit');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    xpEarned: number;
    total: number;
  } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | undefined>(undefined);

  // Load wallet balance for payment method display
  const loadWallet = useCallback(async () => {
    try {
      const params = isDemoMode() ? '?demo=true' : '';
      const res = await fetch(`/api/wallet${params}`);
      const data = await res.json();
      if (data.wallet) {
        setWalletBalance(data.wallet.balance);
      }
    } catch {
      // Wallet not available — card-only fallback
      setWalletBalance(undefined);
    }
  }, []);

  // Load wallet when cart drawer opens
  React.useEffect(() => {
    if (showCart && walletBalance === undefined) {
      loadWallet();
    }
  }, [showCart, walletBalance, loadWallet]);

  const filteredItems = DEMO_MENU.filter((item) => item.category === activeCategory);
  const cartTotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.qty, 0);
  const cartCount = cart.reduce((sum, ci) => sum + ci.qty, 0);

  const addToCart = (item: PotionItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) => ci.item.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
      }
      return [...prev, { item, qty: 1, toStation: deliverToStation, stationName: deliverToStation ? stationName : undefined }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map((ci) => ci.item.id === itemId ? { ...ci, qty: ci.qty - 1 } : ci);
      }
      return prev.filter((ci) => ci.item.id !== itemId);
    });
  };

  const placeOrder = useCallback(async () => {
    setOrderLoading(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const demo = isDemoMode();
      const params = demo ? '?demo=true' : '';

      // 1. Submit the order to create it
      const orderRes = await fetch(`/api/potions/orders${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((ci) => ({
            id: ci.item.id,
            name: ci.item.name,
            qty: ci.qty,
            price: ci.item.price,
            toStation: ci.toStation,
            stationName: ci.stationName,
          })),
          total: cartTotal,
          station_id: deliverToStation ? stationName : null,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to place order');
      }

      const orderData = await orderRes.json();

      // 2. If paying with store credit and wallet balance is sufficient, debit wallet
      if (paymentMethod === 'store_credit') {
        const walletRes = await fetch(`/api/wallet${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'DEBIT_PURCHASE',
            amount: cartTotal,
            description: `Potion order #${orderData.order.id}: ${cart.map((ci) => `${ci.qty}x ${ci.item.name}`).join(', ')}`,
            reference_type: 'potion_order',
            reference_id: orderData.order.id,
          }),
        });

        if (!walletRes.ok) {
          const walletErr = await walletRes.json().catch(() => ({}));
          // Wallet debit failed — order still exists; warn user
          setOrderError(
            `Order placed but wallet debit failed: ${walletErr.error || 'Unknown error'}. Contact staff.`
          );
        } else {
          const walletData = await walletRes.json();
          if (walletData.wallet) {
            setWalletBalance(walletData.wallet.balance);
          }
        }
      }

      // 3. Success path
      setOrderResult({
        orderId: orderData.order.id,
        xpEarned: orderData.xpEarned || 15,
        total: cartTotal,
      });
      setOrdered(true);
      setCart([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setOrderError(message);
    } finally {
      setOrderLoading(false);
    }
  }, [cart, cartTotal, paymentMethod, deliverToStation, stationName]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Potions & Provisions</h1>
          <p className="text-sm text-[var(--text-secondary)]">Fuel your quest. Every item boosts your Vitality stats.</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Delivery toggle */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={deliverToStation} onChange={(e) => setDeliverToStation(e.target.checked)} className="w-4 h-4 rounded accent-[var(--neon-primary)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            <Monitor className="w-4 h-4 inline mr-1" />
            Deliver to my station
          </span>
        </label>
        {deliverToStation && (
          <input
            type="text"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            placeholder="Station name..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm"
          />
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === key
                ? 'bg-[var(--neon-primary)] text-black'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--border-primary)] hover:border-[var(--neon-primary)]/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">{item.name}</h3>
              </div>
              <span className="text-sm font-bold text-[var(--gold-primary)]">${item.price.toFixed(2)}</span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{item.description}</p>

            {/* Vitality boosts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.vitality_boost.stamina && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                  <Zap className="w-2.5 h-2.5" />+{item.vitality_boost.stamina} STA
                </span>
              )}
              {item.vitality_boost.mind && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  <Brain className="w-2.5 h-2.5" />+{item.vitality_boost.mind} MND
                </span>
              )}
              {item.vitality_boost.body && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                  <Star className="w-2.5 h-2.5" />+{item.vitality_boost.body} BOD
                </span>
              )}
              {item.vitality_boost.soul && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  ✦ +{item.vitality_boost.soul} SOL
                </span>
              )}
            </div>

            <button
              onClick={() => addToCart(item)}
              className="w-full py-2 rounded-lg bg-[var(--neon-primary)]/10 text-[var(--neon-primary)] text-xs font-bold border border-[var(--neon-primary)]/20 hover:bg-[var(--neon-primary)]/20 transition-colors"
            >
              Add to Order
            </button>
          </motion.div>
        ))}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-0 right-0 z-40 w-full max-w-md h-full p-4 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-l border-[var(--border-primary)] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Your Order</h2>
            <button onClick={() => setShowCart(false)} className="text-sm text-[var(--text-secondary)]">Close</button>
          </div>

          {cart.length === 0 && !ordered ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Your cart is empty. Browse the potions menu!</p>
            </div>
          ) : ordered ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <span className="text-5xl">
                {orderError ? '⚠️' : '✅'}
              </span>
              <h3 className="text-lg font-bold text-[var(--neon-primary)] mt-4">
                {orderError ? 'Order Placed with Issue' : 'Order Placed!'}
              </h3>

              {orderResult && (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-[var(--text-secondary)]">
                    Order ID:{' '}
                    <span className="font-mono text-[var(--text-primary)]">
                      {orderResult.orderId}
                    </span>
                  </p>
                  <p className="text-[var(--gold-primary)] font-bold">
                    +{orderResult.xpEarned} XP Earned!
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Charged{' '}
                    <span className="font-bold text-[var(--text-primary)]">
                      ${orderResult.total.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}

              {orderError && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{orderError}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Your order was created — contact staff to resolve payment.
                  </p>
                </div>
              )}

              <p className="text-sm text-[var(--text-secondary)] mt-3">
                Your potions are being prepared.
              </p>
              {deliverToStation && (
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Delivering to your station shortly.
                </p>
              )}

              <button
                onClick={() => {
                  setOrdered(false);
                  setOrderError(null);
                  setOrderResult(null);
                  setShowCart(false);
                }}
                className="mt-6 px-6 py-2.5 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Continue Ordering
              </button>
            </motion.div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {cart.map((ci) => (
                  <div key={ci.item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]/50">
                    <span className="text-xl">{ci.item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{ci.item.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        ${ci.item.price.toFixed(2)} ea
                        {ci.toStation && <> • to {ci.stationName || 'Station'}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(ci.item.id)} className="w-6 h-6 rounded bg-[var(--bg-tertiary)] text-sm">−</button>
                      <span className="text-sm font-bold w-4 text-center">{ci.qty}</span>
                      <button onClick={() => addToCart(ci.item)} className="w-6 h-6 rounded bg-[var(--bg-tertiary)] text-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border-primary)] pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Subtotal</span>
                  <span className="font-bold text-[var(--text-primary)]">${cartTotal.toFixed(2)}</span>
                </div>

                {/* Payment Method Selector */}
                <PaymentMethodSelector
                  walletBalance={walletBalance}
                  total={cartTotal}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />

                {/* Error state */}
                {orderError && !ordered && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{orderError}</p>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  onClick={placeOrder}
                  disabled={orderLoading || (paymentMethod === 'store_credit' && walletBalance !== undefined && walletBalance < cartTotal)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    orderLoading
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-wait'
                      : paymentMethod === 'store_credit' && walletBalance !== undefined && walletBalance < cartTotal
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                      : 'bg-[var(--neon-primary)] text-black hover:opacity-90'
                  }`}
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {paymentMethod === 'store_credit'
                        ? `Pay with Store Credit — $${cartTotal.toFixed(2)}`
                        : `Place Order — $${cartTotal.toFixed(2)}`}
                    </>
                  )}
                </button>

                {paymentMethod === 'store_credit' && walletBalance !== undefined && walletBalance < cartTotal && (
                  <p className="text-xs text-red-400 text-center">
                    Switch to card or split pay, or add funds to your wallet.
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
