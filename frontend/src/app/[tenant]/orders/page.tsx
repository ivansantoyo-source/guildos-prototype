"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, listContainer, listItemStagger } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import OrderTimeline from "@/components/storefront/OrderTimeline";
import { conditionBadgeStyle } from "@/components/storefront/ProductCard";
import type { Order, OrderStatus } from "@/lib/types";

// ============================================================
// ORDER STATUS BADGE
// ============================================================
const statusBadge = (status: OrderStatus) => {
  const map: Record<string, string> = {
    PENDING: "bg-gold/20 text-gold border-gold/30",
    CONFIRMED: "bg-primary/20 text-primary border-primary/30",
    PROCESSING: "bg-primary/20 text-primary border-primary/30",
    READY_FOR_PICKUP: "bg-xp/20 text-xp border-xp/30",
    SHIPPED: "bg-xp/20 text-xp border-xp/30",
    DELIVERED: "bg-xp/20 text-xp border-xp/30",
    CANCELLED: "bg-destructive/20 text-destructive border-destructive/30",
    REFUNDED: "bg-muted/30 text-muted-foreground border-muted/30",
  };
  return map[status] || "bg-muted/20 text-muted-foreground border-muted/30";
};

const statusIcon = (status: OrderStatus) => {
  const map: Record<string, string> = {
    PENDING: "📝",
    CONFIRMED: "✅",
    PROCESSING: "⚙️",
    READY_FOR_PICKUP: "📦",
    SHIPPED: "🚚",
    DELIVERED: "🎉",
    CANCELLED: "❌",
    REFUNDED: "💳",
  };
  return map[status] || "📋";
};

// ============================================================
// ORDER CARD
// ============================================================
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemNames = order.items.map((i) => i.item_name).join(", ");

  return (
    <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden">
      {/* Header - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start justify-between gap-4 hover:bg-primary/[2%] transition-colors text-left"
        aria-expanded={expanded}
        aria-label={`Order ${order.id} - ${order.status}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{statusIcon(order.status)}</span>
            <h3 className="text-sm font-bold text-foreground truncate">
              {order.id}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${statusBadge(order.status)}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <span className="text-[11px] text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {itemNames}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-mono font-bold text-primary">
            ${order.total.toFixed(2)}
          </span>
          <span className="text-muted-foreground text-xs transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
              {/* Timeline */}
              <OrderTimeline status={order.status} />

              {/* Items */}
              <div>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
                <div className="space-y-1.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-background/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-muted-foreground">x{item.quantity}</span>
                        <div>
                          <p className="text-xs text-foreground">{item.item_name}</p>
                          {item.platform && (
                            <p className="text-[10px] text-muted-foreground">{item.platform}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-primary font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-background/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-mono">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-gold font-mono">-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground font-mono">${order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-border/30 pt-1.5 font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary font-mono">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Payment: {order.payment_method}</span>
                <span>·</span>
                <span>Status: {order.payment_status.replace(/_/g, " ")}</span>
                {order.customer_notes && (
                  <>
                    <span>·</span>
                    <span className="italic">Notes: &quot;{order.customer_notes}&quot;</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ORDERS PAGE
// ============================================================
export default function OrdersPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const customerOrders = useGuildStore((s) => s.customerOrders);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return customerOrders;
    return customerOrders.filter((o) => o.status === statusFilter);
  }, [customerOrders, statusFilter]);

  const STATUSES: (OrderStatus | "ALL")[] = [
    "ALL", "PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
  ];

  if (customerOrders.length === 0) {
    return (
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background text-foreground"
      >
        <StoreNav tenant={tenant} storeName={storeName} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <h1 className="text-xl font-bold text-foreground mb-2">No Orders Yet</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            You haven&apos;t placed any orders yet. Start your collection today!
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow-green">📋 Order History</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {customerOrders.length} total {customerOrders.length === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                statusFilter === s
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Order list */}
        {filtered.length === 0 ? (
          <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-8 text-center">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-sm text-muted-foreground">No orders match this filter.</p>
          </div>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filtered.map((order, idx) => (
              <motion.div key={order.id} variants={listItemStagger} custom={idx}>
                <OrderCard order={order} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
