"use client";

import React from "react";
import { motion } from "framer-motion";
import type { POSTransaction } from "@/lib/types";

// ============================================================================
// POS RECEIPT — Receipt preview/print component with RPG-themed footer
// ============================================================================

interface POSReceiptProps {
  transaction: POSTransaction;
}

export function POSReceipt({ transaction }: POSReceiptProps) {
  const {
    items,
    subtotal,
    discount_amount,
    tax_amount,
    total,
    payment_method,
    cash_tendered,
    change_due,
    receipt_number,
    customer_profile_id,
    created_at,
  } = transaction;

  const date = new Date(created_at);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // RPG XP earned display
  const xpEarned = Math.floor(total);

  const paymentLabel = {
    CASH: "Cash",
    CARD: "Card",
    STORE_CREDIT: "Store Credit",
    SPLIT: "Split",
  }[payment_method];

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-xl p-5 max-w-sm mx-auto"
    >
      {/* Receipt Header */}
      <div className="text-center border-b border-border/30 pb-4 mb-4">
        <h3 className="text-lg font-bold tracking-wider text-primary">TIME WARP GAMING</h3>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Retro Gaming Emporium</p>
        <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground/50">
          <span>{dateStr}</span>
          <span className="text-border/40">|</span>
          <span>{timeStr}</span>
        </div>
        <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono">
          {receipt_number || "RCPT-0000"}
        </div>
      </div>

      {/* Itemized List */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-[10px] text-muted-foreground/50 pb-1 border-b border-border/20 font-semibold uppercase tracking-wider">
          <span>Item</span>
          <span className="text-right">Qty × Price</span>
        </div>
        {items.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className={`flex justify-between text-xs py-1 ${
              item.is_legendary ? "text-legendary" : ""
            }`}
          >
            <div className="flex-1 min-w-0 pr-4">
              <span className="truncate block">
                {item.is_legendary ? "✦ " : ""}
                {item.item_name}
              </span>
              {item.platform && (
                <span className="text-[9px] text-muted-foreground/50">{item.platform}</span>
              )}
            </div>
            <span className="font-mono shrink-0 text-right">
              {item.quantity} × ${item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border/30 pt-3 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        {discount_amount > 0 && (
          <div className="flex justify-between text-xs text-green-400">
            <span>Discount</span>
            <span className="font-mono">−${discount_amount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tax</span>
          <span className="font-mono">${tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-border/30 mt-2">
          <span>TOTAL</span>
          <span className="font-mono text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mt-4 p-3 rounded-lg bg-background/20 border border-border/20 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="font-medium">{paymentLabel}</span>
        </div>
        {cash_tendered !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tendered</span>
            <span className="font-mono">${cash_tendered.toFixed(2)}</span>
          </div>
        )}
        {change_due !== undefined && change_due > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Change</span>
            <span className="font-mono">${change_due.toFixed(2)}</span>
          </div>
        )}
        {customer_profile_id && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-mono text-[10px]">{customer_profile_id}</span>
          </div>
        )}
      </div>

      {/* RPG Footer */}
      <div className="mt-5 text-center space-y-2">
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <p className="text-xs text-primary/70 font-bold tracking-wide">
          Thank you for your quest!
        </p>
        <p className="text-[10px] text-gold font-semibold">
          +{xpEarned} XP Earned
        </p>
        <p className="text-[9px] text-muted-foreground/40 italic mt-1">
          &quot;Every cartridge tells a story.&quot;
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-3">
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 text-xs rounded-lg border border-border/40 text-muted-foreground
              hover:text-foreground hover:border-border/60 transition-all"
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </motion.div>
  );
}
