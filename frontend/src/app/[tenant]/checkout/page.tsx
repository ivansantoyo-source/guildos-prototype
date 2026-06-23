"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, fadeScale } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import { conditionBadgeStyle } from "@/components/storefront/ProductCard";
import type { Order, OrderStatus, OrderItem } from "@/lib/types";

// ============================================================
// CONFETTI (simple canvas-based celebration)
// ============================================================
function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ["#00ff41", "#ffd700", "#b388ff", "#ff4081", "#40c4ff", "#69f0ae"][i % 6],
            left: `${Math.random() * 100}%`,
            top: -10,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: "100vh",
            rotate: 720 + Math.random() * 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// CHECKOUT PAGE
// ============================================================
export default function CheckoutPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const cart = useGuildStore((s) => s.cart);
  const addCustomerOrder = useGuildStore((s) => s.addCustomerOrder);
  const clearCart = useGuildStore((s) => s.clearCart);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "STORE_CREDIT">("STRIPE");
  const [orderNotes, setOrderNotes] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const taxEstimate = cart ? parseFloat((cart.subtotal * 0.08).toFixed(2)) : 0;
  const estimatedTotal = cart ? cart.subtotal - cart.discount_amount + taxEstimate : 0;

  // Store credit check
  const wallet = useGuildStore((s) => s.wallet);
  const applyStoreCredit = useGuildStore((s) => s.applyStoreCredit);
  const hasEnoughCredit = wallet ? wallet.balance >= estimatedTotal : false;

  const handlePlaceOrder = () => {
    if (!cart || !customerName.trim() || !customerEmail.trim()) return;

    setIsPlacing(true);

    // Simulate order placement
    setTimeout(() => {
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const orderItems: OrderItem[] = cart.items.map((ci) => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order_id: orderId,
        inventory_id: ci.inventory_id,
        item_name: ci.item_name,
        platform: ci.platform,
        price: ci.price,
        quantity: ci.quantity,
        tags: ci.tags,
      }));

      const newOrder: Order = {
        id: orderId,
        organization_id: cart.organization_id,
        profile_id: `customer-${Date.now()}`,
        items: orderItems,
        subtotal: cart.subtotal,
        discount_amount: cart.discount_amount,
        tax_amount: taxEstimate,
        total: estimatedTotal,
        status: "PENDING",
        payment_method: paymentMethod,
        payment_status: paymentMethod === "STORE_CREDIT" ? "PAID" : "UNPAID",
        customer_notes: orderNotes || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addCustomerOrder(newOrder);

      // Apply store credit if that payment method
      if (paymentMethod === "STORE_CREDIT" && hasEnoughCredit) {
        applyStoreCredit(estimatedTotal);
      }

      setConfirmedOrderId(orderId);
      setOrderConfirmed(true);
      setShowConfetti(true);
      setIsPlacing(false);
      clearCart();
    }, 1500);
  };

  // Already confirmed — show success screen
  if (orderConfirmed) {
    return (
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background text-foreground"
      >
        {showConfetti && <ConfettiEffect />}
        <StoreNav tenant={tenant} storeName={storeName} />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <motion.div
            variants={fadeScale}
            initial="initial"
            animate="animate"
            className="bg-card/60 backdrop-blur-md border border-primary/20 rounded-2xl p-8 text-center"
          >
            <motion.span
              className="text-6xl block mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              🎉
            </motion.span>

            <h1 className="text-2xl font-bold text-primary mb-2">Order Confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Thank you for your order, adventurer!
            </p>

            <div className="bg-background/50 rounded-xl p-4 mb-6 inline-block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
              <p className="text-lg font-mono font-bold text-gold">{confirmedOrderId}</p>
            </div>

            <div className="text-left space-y-3 mb-6">
              <h3 className="text-sm font-bold text-foreground">What&apos;s Next?</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3 bg-card/40 rounded-lg p-3">
                  <span className="text-lg shrink-0">📝</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">1. Order Confirmed</p>
                    <p className="text-[10px] text-muted-foreground">Your order has been received and is being processed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-card/40 rounded-lg p-3">
                  <span className="text-lg shrink-0">⚙️</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">2. Processing</p>
                    <p className="text-[10px] text-muted-foreground">Our team is preparing your items for pickup or shipment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-card/40 rounded-lg p-3">
                  <span className="text-lg shrink-0">📦</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">3. Ready</p>
                    <p className="text-[10px] text-muted-foreground">You will receive a notification when your order is ready.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-card/40 rounded-lg p-3">
                  <span className="text-lg shrink-0">🎮</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">4. Enjoy!</p>
                    <p className="text-[10px] text-muted-foreground">Pick up your items or receive them at your doorstep.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={demoHref("/orders")}
                className="px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
              >
                View My Orders
              </Link>
              <Link
                href={demoHref("/products")}
                className="px-6 py-3 text-sm rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background text-foreground"
      >
        <StoreNav tenant={tenant} storeName={storeName} />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
          <span className="text-5xl block mb-4">🛒</span>
          <h1 className="text-xl font-bold text-foreground mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link
            href={demoHref("/products")}
            className="inline-block px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            Browse Items
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background text-foreground"
    >
      <StoreNav tenant={tenant} storeName={storeName} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-primary text-glow-green mb-6">💳 Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Customer Info + Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Info */}
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 space-y-4">
              <h2 className="text-sm font-bold text-foreground">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-foreground">Payment Method</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50 cursor-pointer hover:border-primary/30 transition-all">
                  <input
                    type="radio"
                    name="payment"
                    value="STRIPE"
                    checked={paymentMethod === "STRIPE"}
                    onChange={() => setPaymentMethod("STRIPE")}
                    className="accent-primary"
                  />
                  <span className="text-sm">💳 Credit Card (Stripe)</span>
                </label>
                <label className={`flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50 cursor-pointer hover:border-primary/30 transition-all ${!hasEnoughCredit ? "opacity-50" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="STORE_CREDIT"
                    checked={paymentMethod === "STORE_CREDIT"}
                    onChange={() => paymentMethod === "STORE_CREDIT" ? setPaymentMethod("STORE_CREDIT") : undefined}
                    disabled={!hasEnoughCredit}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm">💰 Store Credit</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {wallet ? `Balance: $${wallet.balance.toFixed(2)}` : "No wallet found"}
                      {hasEnoughCredit ? " (Sufficient)" : " (Insufficient)"}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4">
              <label className="text-[11px] text-muted-foreground block mb-1">Order Notes</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any special requests? (e.g., &quot;Please bubble wrap the cartridges!&quot;)"
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 space-y-4 sticky top-24">
              <h2 className="text-sm font-bold text-foreground">Order Summary</h2>

              {/* Items */}
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-background/30 rounded-lg p-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-5 text-center">
                      x{item.quantity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.platform || ""}</p>
                    </div>
                    <span className="text-xs font-mono text-primary font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-mono">${cart.subtotal.toFixed(2)}</span>
                </div>
                {cart.discount_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-gold font-mono">-${cart.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax (est. 8%)</span>
                  <span className="text-foreground font-mono">${taxEstimate.toFixed(2)}</span>
                </div>
                <div className="border-t border-border/30 pt-1.5 flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary font-mono">${estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing || !customerName.trim() || !customerEmail.trim()}
                className={`w-full py-3 text-sm rounded-xl font-bold transition-all ${
                  isPlacing
                    ? "bg-muted/20 text-muted-foreground border border-muted/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30 shadow-[0_0_20px_oklch(0.78_0.2_145/15%)]"
                }`}
              >
                {isPlacing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Place Order — $${estimatedTotal.toFixed(2)}`
                )}
              </button>

              <Link
                href={demoHref("/cart")}
                className="block w-full py-2.5 text-xs rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-center"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
