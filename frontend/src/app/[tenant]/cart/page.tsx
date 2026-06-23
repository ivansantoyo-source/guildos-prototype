"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, listContainer, listItemStagger } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import { conditionBadgeStyle } from "@/components/storefront/ProductCard";

// ============================================================
// CART PAGE — Full shopping cart view
// ============================================================
export default function CartPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const cart = useGuildStore((s) => s.cart);
  const removeFromCart = useGuildStore((s) => s.removeFromCart);
  const updateCartItemQty = useGuildStore((s) => s.updateCartItemQty);
  const applyDiscountToCart = useGuildStore((s) => s.applyDiscountToCart);

  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const taxEstimate = cart ? parseFloat((cart.subtotal * 0.08).toFixed(2)) : 0;
  const estimatedTotal = cart ? cart.subtotal - cart.discount_amount + taxEstimate : 0;

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    // Demo: accept "KONAMI" or "FACTION" for 10% off
    const code = discountCode.trim().toUpperCase();
    if (code === "KONAMI" || code === "FACTION" || code === "WELCOME10") {
      const discountAmount = cart ? parseFloat((cart.subtotal * 0.1).toFixed(2)) : 0;
      applyDiscountToCart(code, discountAmount);
      setDiscountApplied(true);
      setDiscountError("");
    } else {
      setDiscountError("Invalid discount code");
      setDiscountApplied(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background text-foreground"
    >
      <StoreNav tenant={tenant} storeName={storeName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-primary text-glow-green mb-6">🛒 Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-12 text-center">
            <span className="text-5xl block mb-4">🛒</span>
            <h2 className="text-lg font-bold text-foreground mb-2">Your Cart is Empty</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Your cart is empty, adventurer! Browse our collection to find your next quest item.
            </p>
            <Link
              href={demoHref("/products")}
              className="inline-block px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              Browse All Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {cart.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    variants={listItemStagger}
                    custom={idx}
                    className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-xl shrink-0"
                        style={{
                          backgroundColor: item.platform
                            ? `oklch(0.18 0.03 ${(item.platform.length * 37 + item.item_name.length * 13) % 360})`
                            : "oklch(0.14 0.01 260)",
                        }}
                      >
                        🎮
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{item.item_name}</h3>
                        <div className="flex gap-1 mt-1">
                          {item.platform && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.platform}</span>
                          )}
                          {item.condition && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${conditionBadgeStyle(item.condition)}`}>{item.condition}</span>
                          )}
                        </div>
                        <p className="text-xs font-mono font-bold text-primary mt-1">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                          aria-label={`Remove ${item.item_name}`}
                        >
                          ✕
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          >
                            −
                          </button>
                          <span className="text-sm font-mono font-bold text-foreground w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs font-mono font-bold text-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <Link
                href={demoHref("/products")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-foreground">Order Summary</h2>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                    <span className="text-foreground font-mono">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount_amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Discount ({cart.discount_code})</span>
                      <span className="text-gold font-mono">-${cart.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tax (est. 8%)</span>
                    <span className="text-foreground font-mono">${taxEstimate.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-foreground">Estimated Total</span>
                    <span className="text-primary font-mono">${estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Discount Code */}
                <div className="border-t border-border/50 pt-3">
                  <label className="text-[11px] text-muted-foreground block mb-1.5">Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                      placeholder="Enter code..."
                      className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={discountApplied}
                      className={`px-3 py-2 text-xs rounded-lg font-bold transition-all ${
                        discountApplied
                          ? "bg-xp/20 text-xp border border-xp/30"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {discountApplied ? "✓ Applied" : "Apply"}
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-[10px] text-destructive mt-1">{discountError}</p>
                  )}
                  {discountApplied && (
                    <p className="text-[10px] text-xp mt-1">10% discount applied! Try codes: KONAMI, FACTION, WELCOME10</p>
                  )}
                </div>

                {/* Checkout button */}
                <Link
                  href={demoHref("/checkout")}
                  className="block w-full py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors text-center shadow-[0_0_20px_oklch(0.78_0.2_145/15%)]"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href={demoHref("/products")}
                  className="block w-full py-2.5 text-xs rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
