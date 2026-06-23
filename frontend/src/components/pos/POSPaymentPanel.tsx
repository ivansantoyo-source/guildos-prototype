"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { toast } from "@/components/ui/toaster";
import type { POSCartItem, POSPaymentMethod, POSTransaction } from "@/lib/types";
import { POSReceipt } from "./POSReceipt";

// ============================================================================
// POS PAYMENT PANEL — Payment method selection, cash calculator, complete sale
// ============================================================================

const TAX_RATE = 0.08;

interface POSPaymentPanelProps {
  cartItems: POSCartItem[];
  discountPercent: number;
  onComplete: () => void;
}

export function POSPaymentPanel({ cartItems, discountPercent, onComplete }: POSPaymentPanelProps) {
  const posSession = useGuildStore((s) => s.posSession);
  const addPOSTransaction = useGuildStore((s) => s.addPOSTransaction);
  const updateInventoryItem = useGuildStore((s) => s.updateInventoryItem);
  const inventory = useGuildStore((s) => s.inventory);
  const demoMode = useGuildStore((s) => s.demoMode);

  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>("CASH");
  const [cashTendered, setCashTendered] = useState("");
  const [processing, setProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<POSTransaction | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerProfileId, setCustomerProfileId] = useState<string | undefined>(undefined);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * TAX_RATE;
  const total = Math.round(taxableAmount * 100 + taxAmount * 100) / 100;

  const cashValue = parseFloat(cashTendered) || 0;
  const changeDue = cashValue >= total ? cashValue - total : 0;

  // Quick cash amounts
  const quickCash = useMemo(() => {
    const amounts = [20, 40, 60, 100];
    // also suggest an "Exact" amount
    const nearestBill = Math.ceil(total);
    return [...amounts, nearestBill > total ? nearestBill : null].filter(Boolean) as number[];
  }, [total]);

  // Check if session is open
  const isSessionOpen = posSession?.status === "OPEN";
  const canComplete = cartItems.length > 0 && total > 0 && isSessionOpen && !processing;

  const handleCompleteSale = async () => {
    if (!canComplete) {
      if (!isSessionOpen) {
        toast("error", "Register Closed", "Open the register before completing a sale.");
      }
      return;
    }

    // Validate cash payment if applicable
    if (paymentMethod === "CASH" && cashValue < total) {
      toast("error", "Insufficient Cash", "Cash tendered must be at least the total amount.");
      return;
    }

    setProcessing(true);

    try {
      // Simulate processing delay for card payments
      if (paymentMethod === "CARD") {
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Build transaction
      const now = new Date().toISOString();
      const txnId = `pos-txn-${Date.now()}`;
      const receiptNum = `RCPT-${String(posSession!.total_transactions + 1).padStart(4, "0")}`;

      const transaction: POSTransaction = {
        id: txnId,
        session_id: posSession!.id,
        organization_id: posSession!.organization_id,
        items: [...cartItems],
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === "CASH" ? cashValue : undefined,
        change_due: paymentMethod === "CASH" ? changeDue : undefined,
        customer_profile_id: customerProfileId,
        receipt_number: receiptNum,
        created_at: now,
      };

      // Update inventory stock (decrement)
      for (const cartItem of cartItems) {
        const invItem = inventory.find((i) => i.id === cartItem.inventory_id);
        if (invItem && invItem.stock_count > cartItem.quantity) {
          const newStock = invItem.stock_count - cartItem.quantity;
          updateInventoryItem(invItem.id, { stock_count: newStock });
        } else if (invItem) {
          updateInventoryItem(invItem.id, { stock_count: 0, status: "SOLD" });
        }
      }

      // Add transaction to store (this also clears the POS cart)
      addPOSTransaction(transaction);

      // Update session totals
      if (posSession) {
        const sessionUpdates: Partial<typeof posSession> = {
          total_sales: Math.round((posSession.total_sales + total) * 100) / 100,
          total_transactions: posSession.total_transactions + 1,
          cash_sales:
            paymentMethod === "CASH"
              ? Math.round((posSession.cash_sales + total) * 100) / 100
              : posSession.cash_sales,
          card_sales:
            paymentMethod === "CARD"
              ? Math.round((posSession.card_sales + total) * 100) / 100
              : posSession.card_sales,
          store_credit_sales:
            paymentMethod === "STORE_CREDIT"
              ? Math.round((posSession.store_credit_sales + total) * 100) / 100
              : posSession.store_credit_sales,
        };
        useGuildStore.setState({ posSession: { ...posSession, ...sessionUpdates } });
      }

      toast("success", "Sale Complete", `Receipt #${receiptNum} — $${total.toFixed(2)}`);
      setCompletedReceipt(transaction);
      onComplete();
    } catch (err) {
      toast("error", "Transaction Failed", "Could not complete the sale. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // If we have a completed receipt, show it
  if (completedReceipt) {
    return (
      <div className="flex flex-col h-full">
        <POSReceipt transaction={completedReceipt} />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCompletedReceipt(null)}
          className="mt-4 w-full py-3 text-sm rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold
            hover:bg-primary/20 transition-all"
        >
          New Sale
        </motion.button>
      </div>
    );
  }

  // Empty state (shouldn't happen since parent controls this, but defensive)
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <span className="text-4xl mb-3 opacity-40">💳</span>
        <p className="text-sm text-muted-foreground">Add items to cart</p>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Payment panel will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Checkout
      </h2>

      {/* Payment Method Selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          {(["CASH", "CARD", "STORE_CREDIT", "SPLIT"] as POSPaymentMethod[]).map((method) => {
            const icons: Record<POSPaymentMethod, string> = {
              CASH: "💵",
              CARD: "💳",
              STORE_CREDIT: "🪙",
              SPLIT: "🔀",
            };
            return (
              <motion.button
                key={method}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPaymentMethod(method)}
                className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                  paymentMethod === method
                    ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_oklch(0.78_0.2_145/15%)]"
                    : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                }`}
              >
                <span className="text-lg block mb-0.5">{icons[method]}</span>
                <span>
                  {method === "STORE_CREDIT" ? "STORE CREDIT" : method}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Cash Tender Section (for CASH method) */}
      <AnimatePresence>
        {paymentMethod === "CASH" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Cash Input */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">Cash Tendered</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-3 bg-background/30 border border-border/40 rounded-lg text-sm font-mono
                    focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
                    placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {quickCash.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashTendered(amt.toFixed(2))}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    parseFloat(cashTendered) === amt
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-border/60"
                  }`}
                >
                  {amt === Math.ceil(total) && amt > 100
                    ? `Exact ($${total.toFixed(2)})`
                    : `$${amt.toFixed(0)}`}
                </button>
              ))}
              <button
                onClick={() => setCashTendered(total.toFixed(2))}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  Math.abs(parseFloat(cashTendered || "0") - total) < 0.01
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/30 text-muted-foreground hover:border-border/60"
                }`}
              >
                Exact
              </button>
            </div>

            {/* Change Due */}
            {cashValue >= total && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-xs text-green-400 font-semibold">Change Due</span>
                <span className="text-lg font-mono font-bold text-green-400">
                  ${changeDue.toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Processing Note */}
      {paymentMethod === "CARD" && (
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400/80">
          💳 Card payments will be processed securely. A terminal prompt may appear on the connected
          payment device.
        </div>
      )}

      {/* Store Credit: Customer Lookup */}
      {paymentMethod === "STORE_CREDIT" && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Customer Search</label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search by name or player tag..."
            className="w-full px-3 py-2 bg-background/30 border border-border/40 rounded-lg text-xs
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
              placeholder:text-muted-foreground/40"
          />
          {customerSearch.length > 0 && (
            <div className="text-[10px] text-muted-foreground/60 bg-background/20 rounded-lg p-2 border border-border/20">
              Customer lookup requires wallet with sufficient balance. In demo mode, all
              store credit transactions reference profile "TRON_99".
            </div>
          )}
        </div>
      )}

      {/* Split Payment Placeholder */}
      {paymentMethod === "SPLIT" && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400/80">
          🔀 Split payment accepts cash + card + store credit simultaneously. Enter amounts for
          each method below. (Coming in demo mode as card-only for simplicity.)
        </div>
      )}

      {/* Total Display */}
      <div className="mt-auto pt-3 border-t border-border/40">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">Total Due</span>
          <span className="text-2xl font-mono font-bold text-primary">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Complete Sale Button */}
        <motion.button
          whileTap={canComplete ? { scale: 0.97 } : undefined}
          onClick={handleCompleteSale}
          disabled={!canComplete || processing}
          className={`w-full py-4 rounded-xl text-sm font-bold tracking-wider transition-all ${
            !canComplete || processing
              ? "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
              : paymentMethod === "CASH"
                ? "bg-green-600 text-white hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                : paymentMethod === "STORE_CREDIT"
                  ? "bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_oklch(0.78_0.2_145/20%)]"
          }`}
        >
          {processing
            ? "Processing..."
            : `COMPLETE SALE — $${total.toFixed(2)}`}
        </motion.button>

        {/* Session Closed Warning */}
        {!isSessionOpen && (
          <p className="text-[10px] text-destructive/70 text-center mt-2">
            Open the register before completing a sale
          </p>
        )}
      </div>
    </div>
  );
}
