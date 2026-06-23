"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { toast } from "@/components/ui/toaster";
import { phantomInventory } from "@/mocks/phantomData";
import { POSCartPanel } from "@/components/pos/POSCartPanel";
import { POSPaymentPanel } from "@/components/pos/POSPaymentPanel";
import { POSSessionManager, POSSessionBadge } from "@/components/pos/POSSessionManager";
import { POSReceipt } from "@/components/pos/POSReceipt";
import type { InventoryItem, POSCartItem } from "@/lib/types";

// ============================================================================
// POINT OF SALE (POS) TERMINAL
// Full-screen, 3-column retail interface for brick-and-mortar sales
// ============================================================================

const PLATFORM_CATEGORIES = [
  { key: "ALL", label: "All", icon: "📋" },
  { key: "SNES", label: "SNES", icon: "🟪" },
  { key: "NES", label: "NES", icon: "🟥" },
  { key: "N64", label: "N64", icon: "🟩" },
  { key: "GENESIS", label: "Genesis", icon: "🟦" },
  { key: "PS1", label: "PS1", icon: "⬜" },
  { key: "HARDWARE", label: "Hardware", icon: "🖥️" },
  { key: "LEGENDARY", label: "Legendary", icon: "💎" },
] as const;

type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number]["key"];

export default function POSPage() {
  // --- Store hooks ---
  const posCart = useGuildStore((s) => s.posCart);
  const posSession = useGuildStore((s) => s.posSession);
  const addToPOSCart = useGuildStore((s) => s.addToPOSCart);
  const clearPOSCart = useGuildStore((s) => s.clearPOSCart);
  const inventory = useGuildStore((s) => s.inventory);
  const demoMode = useGuildStore((s) => s.demoMode);
  const reducedMotion = useGuildStore((s) => s.reducedMotion);
  const user = useGuildStore((s) => s.user);
  const posTransactions = useGuildStore((s) => s.posTransactions);

  // --- Local state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PlatformCategory>("ALL");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Load phantom inventory into store if not already loaded (demo mode)
  useEffect(() => {
    if (demoMode && inventory.length === 0) {
      useGuildStore.getState().setInventory(phantomInventory);
    }
  }, [demoMode, inventory.length]);

  // Auto-open demo POS session
  useEffect(() => {
    if (demoMode && !posSession) {
      const now = new Date().toISOString();
      useGuildStore.getState().setPOSSession({
        id: "pos-session-001",
        organization_id: "demo-time-warp-001",
        staff_profile_id: user?.id || "usr-001",
        opened_at: new Date(Date.now() - 14400000).toISOString(),
        starting_cash: 200.00,
        total_sales: 845.50,
        total_transactions: 7,
        cash_sales: 320.00,
        card_sales: 425.50,
        store_credit_sales: 100.00,
        status: "OPEN",
      });
    }
  }, [demoMode, posSession, user]);

  // --- Filtered inventory for catalog ---
  const filteredInventory = useMemo(() => {
    let items = inventory.filter((i) => i.status !== "SOLD" && i.status !== "SCRAP");

    // Category filter
    if (activeCategory !== "ALL" && activeCategory !== "LEGENDARY" && activeCategory !== "HARDWARE") {
      items = items.filter((i) => i.platform === activeCategory);
    } else if (activeCategory === "HARDWARE") {
      items = items.filter((i) => i.tags.includes("HARDWARE"));
    } else if (activeCategory === "LEGENDARY") {
      items = items.filter((i) => i.is_legendary);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.platform?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }, [inventory, searchQuery, activeCategory]);

  // --- Add item to POS cart ---
  const handleAddToCart = useCallback(
    (invItem: InventoryItem) => {
      if (!posSession || posSession.status !== "OPEN") {
        toast("warning", "Register Closed", "Open the register before adding items.");
        return;
      }

      if (invItem.stock_count <= 0) {
        toast("error", "Out of Stock", `${invItem.item_name} is not available.`);
        return;
      }

      const cartItem: POSCartItem = {
        id: `posci-${Date.now()}-${invItem.id}`,
        inventory_id: invItem.id,
        item_name: invItem.item_name,
        platform: invItem.platform,
        price: invItem.our_price || invItem.market_value,
        quantity: 1,
        is_legendary: invItem.is_legendary,
        tags: invItem.tags,
      };

      addToPOSCart(cartItem);

      if (invItem.is_legendary) {
        toast("legendary", "Legendary Item Added", `${invItem.item_name} — $${cartItem.price.toFixed(2)}`);
      }
    },
    [posSession, addToPOSCart]
  );

  // --- Handle barcode/SKU search (Enter key on search input) ---
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        // Try to find an exact match first
        const match =
          inventory.find(
            (i) => i.item_name.toLowerCase() === q || i.id.toLowerCase() === q
          ) ||
          inventory.find(
            (i) =>
              i.item_name.toLowerCase().includes(q) ||
              i.platform?.toLowerCase().includes(q) ||
              i.tags.some((t) => t.toLowerCase().includes(q))
          );

        if (match) {
          handleAddToCart(match);
          setSearchQuery("");
        } else {
          toast("info", "Item Not Found", `No item matching "${searchQuery}" in inventory.`);
        }
      }
    },
    [searchQuery, inventory, handleAddToCart]
  );

  // --- Handle complete sale callback ---
  const handleSaleComplete = useCallback(() => {
    setDiscountPercent(0);
    setShowReceipt(true);
  }, []);

  // --- Clear cart with confirmation ---
  const handleClearCart = useCallback(() => {
    if (posCart.length === 0) return;
    clearPOSCart();
    toast("info", "Cart Cleared", "All items have been removed from the cart.");
  }, [posCart, clearPOSCart]);

  return (
    <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] flex flex-col">
      {/* ===== POS HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2.5 mb-3 glass-panel rounded-xl shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold tracking-wider text-primary">
            ⚡ POINT OF SALE
          </h1>
          <POSSessionBadge session={posSession} />
        </div>

        <div className="flex items-center gap-3">
          {/* Staff Name */}
          <span className="text-xs text-muted-foreground hidden sm:block">
            👤 {user?.display_name || (demoMode ? "TRON_99" : "Staff")}
          </span>

          {/* Session Manager Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSessionManager(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              posSession?.status === "OPEN"
                ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
                : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
            }`}
          >
            {posSession?.status === "OPEN" ? "✕ CLOSE REGISTER" : "◉ OPEN REGISTER"}
          </motion.button>
        </div>
      </div>

      {/* ===== THREE-COLUMN LAYOUT ===== */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* === LEFT COLUMN: Item Catalog (40%) === */}
        <div className="w-[40%] flex flex-col glass-panel rounded-xl p-4 min-h-0">
          {/* Search Bar */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search items, scan barcode, or press Enter to quick-add..."
              className="w-full pl-8 pr-4 py-2.5 bg-background/30 border border-border/40 rounded-lg text-xs
                focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
                placeholder:text-muted-foreground/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none shrink-0 pb-1" role="tablist">
            {PLATFORM_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                role="tab"
                aria-selected={activeCategory === cat.key}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-full border transition-all ${
                  activeCategory === cat.key
                    ? "bg-primary/15 text-primary border-primary/40 shadow-[0_0_8px_oklch(0.78_0.2_145/10%)]"
                    : "bg-background/20 text-muted-foreground border-border/30 hover:text-foreground hover:border-border/50"
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-3xl mb-2 opacity-40">
                  {searchQuery ? "🔍" : "📦"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "No items match your search"
                    : "No inventory items available"}
                </p>
                {searchQuery && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    Try a different search term or category
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pr-1">
                {filteredInventory.map((item) => (
                  <POSCatalogItem
                    key={item.id}
                    item={item}
                    onClick={() => handleAddToCart(item)}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === CENTER COLUMN: Cart (35%) === */}
        <div className="w-[35%] flex flex-col glass-panel rounded-xl p-4 min-h-0">
          <POSCartPanel
            discountPercent={discountPercent}
            onDiscountChange={setDiscountPercent}
            onClearCart={handleClearCart}
          />
        </div>

        {/* === RIGHT COLUMN: Checkout (25%) === */}
        <div className="w-[25%] flex flex-col glass-panel rounded-xl p-4 min-h-0">
          <POSPaymentPanel
            cartItems={posCart}
            discountPercent={discountPercent}
            onComplete={handleSaleComplete}
          />
        </div>
      </div>

      {/* ===== SESSION MANAGER MODAL ===== */}
      <AnimatePresence>
        {showSessionManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSessionManager(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4"
            >
              <POSSessionManager onClose={() => setShowSessionManager(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== RECENT TRANSACTIONS BAR ===== */}
      {posTransactions.length > 0 && !showReceipt && (
        <div className="mt-3 px-4 py-2 glass-panel rounded-xl shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Recent Transactions
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              {posTransactions.length} total
            </span>
          </div>
          <div className="flex gap-3 mt-1.5 overflow-x-auto scrollbar-none">
            {posTransactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background/20 border border-border/20 text-[10px]"
              >
                <span className="font-mono text-muted-foreground/60">
                  {txn.receipt_number}
                </span>
                <span className="font-semibold">${txn.total.toFixed(2)}</span>
                <span className="text-muted-foreground/50">
                  {txn.payment_method === "CASH" ? "💵" : txn.payment_method === "CARD" ? "💳" : "🪙"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto"
            >
              {posTransactions[0] && <POSReceipt transaction={posTransactions[0]} />}
              <button
                onClick={() => setShowReceipt(false)}
                className="mt-3 w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// POS CATALOG ITEM — Quick-add product card in the catalog grid
// ============================================================================

function POSCatalogItem({
  item,
  onClick,
  reducedMotion,
}: {
  item: InventoryItem;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  const price = item.our_price || item.market_value;
  const outOfStock = item.stock_count <= 0;

  return (
    <motion.button
      onClick={onClick}
      disabled={outOfStock}
      whileHover={!reducedMotion && !outOfStock ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!reducedMotion && !outOfStock ? { scale: 0.98 } : undefined}
      className={`relative text-left p-3 rounded-xl border transition-all ${
        outOfStock
          ? "border-border/10 bg-background/10 opacity-40 cursor-not-allowed"
          : item.is_legendary
            ? "border-legendary/30 bg-legendary/[3%] hover:border-legendary/50 hover:bg-legendary/[6%] shadow-[0_0_8px_oklch(0.85_0.2_90/5%)]"
            : "border-border/20 bg-background/20 hover:border-border/40 hover:bg-background/40"
      }`}
    >
      {/* Item Name */}
      <div className="flex items-start justify-between gap-1">
        <span
          className={`text-xs font-semibold leading-tight line-clamp-2 ${
            item.is_legendary ? "text-legendary" : "text-foreground"
          }`}
        >
          {item.item_name}
        </span>
        {item.is_legendary && (
          <span className="shrink-0 text-[9px] text-legendary/70 font-bold">✦</span>
        )}
      </div>

      {/* Platform Badge */}
      {item.platform && (
        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/60">
          {item.platform}
        </span>
      )}

      {/* Price & Stock */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/20">
        <span className="text-sm font-mono font-bold text-primary">
          ${price.toFixed(2)}
        </span>
        <span
          className={`text-[9px] ${
            outOfStock
              ? "text-destructive/60"
              : item.stock_count <= 2
                ? "text-gold"
                : "text-muted-foreground/50"
          }`}
        >
          {outOfStock ? "SOLD" : `${item.stock_count} left`}
        </span>
      </div>
    </motion.button>
  );
}
