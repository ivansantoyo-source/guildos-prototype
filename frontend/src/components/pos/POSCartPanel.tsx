"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { POSCartItem } from "@/lib/types";

// ============================================================================
// POS CART PANEL — Items in cart with qty controls and pricing summary
// ============================================================================

const TAX_RATE = 0.08; // 8% sales tax

interface POSCartPanelProps {
  discountPercent: number;
  onDiscountChange: (pct: number) => void;
  onClearCart: () => void;
}

export function POSCartPanel({ discountPercent, onDiscountChange, onClearCart }: POSCartPanelProps) {
  const posCart = useGuildStore((s) => s.posCart);
  const removeFromPOSCart = useGuildStore((s) => s.removeFromPOSCart);
  const updatePOSCartItemQty = useGuildStore((s) => s.updatePOSCartItemQty);

  // Calculate totals
  const subtotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * TAX_RATE;
  const total = taxableAmount + taxAmount;

  const handleQtyChange = (item: POSCartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromPOSCart(item.id);
    } else {
      updatePOSCartItemQty(item.id, newQty);
    }
  };

  if (posCart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Current Cart
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <span className="text-4xl mb-3 opacity-40">🛒</span>
          <p className="text-sm text-muted-foreground">Cart is empty</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Search or tap items to add
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Current Cart ({posCart.length})
        </h2>
        <button
          onClick={onClearCart}
          className="text-xs text-destructive/70 hover:text-destructive transition-colors px-2 py-1 rounded
            hover:bg-destructive/10"
        >
          Clear All
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {posCart.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-lg p-3 border ${
                item.is_legendary
                  ? "border-legendary/30 bg-legendary/[4%]"
                  : "border-border/30 bg-background/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Item Name */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-sm font-semibold truncate ${
                      item.is_legendary ? "text-legendary" : "text-foreground"
                    }`}>
                      {item.item_name}
                    </span>
                    {item.is_legendary && (
                      <span className="text-[10px] text-legendary/70 font-bold shrink-0">LEGENDARY</span>
                    )}
                  </div>

                  {/* Platform Badge */}
                  {item.platform && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/70">
                      {item.platform}
                    </span>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-muted-foreground/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-mono font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQtyChange(item, -1)}
                    className="w-7 h-7 rounded-md bg-background/40 border border-border/30 flex items-center justify-center
                      text-sm text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
                    aria-label="Decrease quantity"
                  >
                    −
                  </motion.button>
                  <span className="w-8 text-center text-sm font-mono font-semibold">
                    {item.quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQtyChange(item, 1)}
                    className="w-7 h-7 rounded-md bg-background/40 border border-border/30 flex items-center justify-center
                      text-sm text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
                    aria-label="Increase quantity"
                  >
                    +
                  </motion.button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/50">
                    ${item.price.toFixed(2)} ea
                  </span>
                  <button
                    onClick={() => removeFromPOSCart(item.id)}
                    className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Totals Section */}
      <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Input */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Discount</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent || ""}
              onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              placeholder="0"
              className="w-16 px-2 py-1 text-xs text-right bg-background/30 border border-border/40 rounded
                font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
                placeholder:text-muted-foreground/40"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-green-400">
            <span>− Discount ({discountPercent}%)</span>
            <span className="font-mono">−${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span className="font-mono">${taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-base font-bold pt-2 border-t border-border/40">
          <span>TOTAL</span>
          <span className="font-mono text-primary text-lg">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
