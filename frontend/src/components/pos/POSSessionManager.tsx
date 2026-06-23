"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { toast } from "@/components/ui/toaster";
import type { POSSession } from "@/lib/types";

// ============================================================================
// POS SESSION MANAGER — Register Open / Close
// ============================================================================

interface POSSessionManagerProps {
  onClose: () => void;
}

export function POSSessionManager({ onClose }: POSSessionManagerProps) {
  const posSession = useGuildStore((s) => s.posSession);
  const setPOSSession = useGuildStore((s) => s.setPOSSession);
  const closePOSSession = useGuildStore((s) => s.closePOSSession);
  const demoMode = useGuildStore((s) => s.demoMode);

  const [startingCash, setStartingCash] = useState("200");
  const [endingCash, setEndingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenRegister = async () => {
    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) {
      toast("error", "Invalid Amount", "Please enter a valid starting cash amount.");
      return;
    }
    setLoading(true);
    try {
      // Simulate API call with delay
      await new Promise((r) => setTimeout(r, 500));

      const now = new Date().toISOString();
      const newSession: POSSession = {
        id: `pos-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        staff_profile_id: "usr-001",
        opened_at: now,
        starting_cash: cash,
        total_sales: 0,
        total_transactions: 0,
        cash_sales: 0,
        card_sales: 0,
        store_credit_sales: 0,
        status: "OPEN",
      };
      setPOSSession(newSession);
      toast("success", "Register Opened", `Starting cash: $${cash.toFixed(2)}`);
      onClose();
    } catch (err) {
      toast("error", "Error", "Failed to open register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegister = async () => {
    const cash = parseFloat(endingCash);
    if (isNaN(cash) || cash < 0) {
      toast("error", "Invalid Amount", "Please enter the ending cash amount.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      closePOSSession(cash, notes || undefined);
      toast("success", "Register Closed", "Session has been closed successfully.");
      onClose();
    } catch (err) {
      toast("error", "Error", "Failed to close register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If session is open, show close form
  if (posSession?.status === "OPEN") {
    const expectedCash = posSession.starting_cash + posSession.cash_sales - posSession.card_sales - posSession.store_credit_sales;
    const overShort = parseFloat(endingCash || "0") - (posSession.starting_cash + posSession.total_sales - posSession.card_sales - posSession.store_credit_sales);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass-panel rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-wide">CLOSE REGISTER</h2>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
            ● OPEN
          </span>
        </div>

        {/* Session Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-background/30 rounded-lg p-3 border border-border/30">
            <span className="text-muted-foreground block mb-1">Opened</span>
            <span className="font-semibold">
              {posSession.opened_at
                ? new Date(posSession.opened_at).toLocaleTimeString()
                : "—"}
            </span>
          </div>
          <div className="bg-background/30 rounded-lg p-3 border border-border/30">
            <span className="text-muted-foreground block mb-1">Starting Cash</span>
            <span className="font-semibold text-gold">
              ${posSession.starting_cash.toFixed(2)}
            </span>
          </div>
          <div className="bg-background/30 rounded-lg p-3 border border-border/30">
            <span className="text-muted-foreground block mb-1">Transactions</span>
            <span className="font-semibold">{posSession.total_transactions}</span>
          </div>
          <div className="bg-background/30 rounded-lg p-3 border border-border/30">
            <span className="text-muted-foreground block mb-1">Total Sales</span>
            <span className="font-semibold text-primary">
              ${posSession.total_sales.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">Cash Sales</span>
            <span className="font-mono">${posSession.cash_sales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">Card Sales</span>
            <span className="font-mono">${posSession.card_sales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Store Credit</span>
            <span className="font-mono">${posSession.store_credit_sales.toFixed(2)}</span>
          </div>
        </div>

        {/* Ending Cash Input */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            Ending Cash Count
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={endingCash}
              onChange={(e) => setEndingCash(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-3 bg-background/30 border border-border/40 rounded-lg text-sm font-mono
                focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
                placeholder:text-muted-foreground/40"
            />
          </div>
          {endingCash && (
            <div className={`text-xs flex items-center gap-2 ${overShort >= 0 ? "text-green-400" : "text-red-400"}`}>
              <span>{overShort >= 0 ? "Over" : "Short"}:</span>
              <span className="font-mono font-bold">
                ${Math.abs(overShort).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any discrepancies or notes..."
            rows={2}
            className="w-full px-3 py-2 bg-background/30 border border-border/40 rounded-lg text-xs
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
              placeholder:text-muted-foreground/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border/40 text-muted-foreground
              hover:text-foreground hover:border-border/60 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCloseRegister}
            disabled={loading || !endingCash}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-destructive text-white font-bold
              hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Closing..." : "CLOSE REGISTER"}
          </button>
        </div>
      </motion.div>
    );
  }

  // Session is closed or doesn't exist — show open form
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-panel rounded-xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gold tracking-wide">OPEN REGISTER</h2>
        <span className="text-xs bg-muted/20 text-muted-foreground px-2 py-0.5 rounded-full border border-border/30">
          ● CLOSED
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Enter the starting cash amount for this shift. The register will be ready for
        customer transactions once opened.
      </p>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">
          Starting Cash
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <input
            type="number"
            step="0.01"
            value={startingCash}
            onChange={(e) => setStartingCash(e.target.value)}
            placeholder="200.00"
            className="w-full pl-7 pr-4 py-3 bg-background/30 border border-border/40 rounded-lg text-sm font-mono
              focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
              placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Quick Cash Amounts */}
      <div className="flex gap-2">
        {["100", "200", "300", "500"].map((amt) => (
          <button
            key={amt}
            onClick={() => setStartingCash(amt)}
            className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-all ${
              startingCash === amt
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/30 text-muted-foreground hover:border-border/60"
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border/40 text-muted-foreground
            hover:text-foreground hover:border-border/60 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleOpenRegister}
          disabled={loading || !startingCash}
          className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground font-bold
            hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Opening..." : "OPEN REGISTER"}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// POS SESSION BADGE — Small status indicator for the POS header
// ============================================================================

export function POSSessionBadge({ session }: { session: POSSession | null }) {
  if (!session || session.status !== "OPEN") {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive/80">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span>Register Closed</span>
      </div>
    );
  }

  const duration = session.opened_at
    ? Math.floor((Date.now() - new Date(session.opened_at).getTime()) / 3600000)
    : 0;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Register Open
      </span>
      <span className="text-muted-foreground/60">|</span>
      <span className="text-muted-foreground">{duration}h active</span>
      <span className="text-muted-foreground/60">|</span>
      <span className="text-muted-foreground">
        {session.total_transactions} txns
      </span>
      <span className="text-muted-foreground/60">|</span>
      <span className="text-primary font-semibold">
        ${session.total_sales.toFixed(2)}
      </span>
    </div>
  );
}
