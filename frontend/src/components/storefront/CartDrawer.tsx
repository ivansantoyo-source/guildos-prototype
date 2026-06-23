"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { slideIn } from "@/lib/animations";
import { conditionBadgeStyle } from "@/components/storefront/ProductCard";

// ============================================================
// CART DRAWER — Slide-out cart for quick access
// ============================================================
interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const cart = useGuildStore((s) => s.cart);
  const removeFromCart = useGuildStore((s) => s.removeFromCart);
  const updateCartItemQty = useGuildStore((s) => s.updateCartItemQty);
  const reducedMotion = useGuildStore((s) => s.reducedMotion);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            variants={slideIn("right")}
            initial={reducedMotion ? undefined : "initial"}
            animate="animate"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-card border-l border-border shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-bold text-primary">🛒 Your Cart</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-primary text-lg transition-colors"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!cart || cart.items.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🛒</span>
                  <p className="text-sm text-muted-foreground">
                    Your cart is empty, adventurer!
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Browse our collection to find your next quest item.
                  </p>
                  <Link
                    href={demoHref("/store/products")}
                    onClick={onClose}
                    className="inline-block mt-4 px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                  >
                    Browse All Items
                  </Link>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-background/50 rounded-lg p-3 border border-border/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {item.item_name}
                        </h4>
                        <div className="flex gap-1 mt-1">
                          {item.platform && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                              {item.platform}
                            </span>
                          )}
                          {item.condition && (
                            <span className={`text-[9px] px-1 py-0.5 rounded border ${conditionBadgeStyle(item.condition)}`}>
                              {item.condition}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive text-xs transition-colors shrink-0"
                        aria-label={`Remove ${item.item_name} from cart`}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-xs font-mono font-bold text-foreground w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer — summary + checkout */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3 shrink-0">
                <div className="space-y-1">
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
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/50">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary font-mono">${cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={demoHref("/store/products")}
                    onClick={onClose}
                    className="flex-1 py-2.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-center"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    href={demoHref("/store/checkout")}
                    onClick={onClose}
                    className="flex-1 py-2.5 text-xs rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors text-center"
                  >
                    Checkout
                  </Link>
                  <Link
                    href={demoHref("/store/cart")}
                    onClick={onClose}
                    className="px-3 py-2.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    title="View full cart"
                  >
                    📋
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
