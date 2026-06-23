"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, listContainer, listItemStagger, pulseGlow } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import ProductCard from "@/components/storefront/ProductCard";
import { conditionBadgeStyle } from "@/components/storefront/ProductCard";
import type { InventoryItem, CartItem } from "@/lib/types";

// ============================================================
// PRODUCT DETAIL PAGE
// ============================================================
export default function ProductDetailPage({ params }: { params: { tenant: string; id: string } }) {
  const { tenant, id } = params;
  const storeName = tenant.replace(/-/g, " ");
  const router = useRouter();

  const inventory = useGuildStore((s) => s.inventory);
  const addToCartAction = useGuildStore((s) => s.addToCart);
  const reducedMotion = useGuildStore((s) => s.reducedMotion);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const item = useMemo(() => inventory.find((i) => i.id === id), [inventory, id]);

  // Recommended items with similar tags
  const recommended = useMemo(() => {
    if (!item) return [];
    return inventory
      .filter((i) => i.id !== item.id && i.status === "ACTIVE" && i.tags.some((t) => item.tags.includes(t)))
      .slice(0, 4);
  }, [item, inventory]);

  const handleAddToCart = () => {
    if (!item) return;

    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inventory_id: item.id,
      item_name: item.item_name,
      platform: item.platform,
      condition: item.condition,
      price: item.our_price || item.market_value,
      quantity,
      image_url: item.image_url,
      tags: item.tags,
    };

    addToCartAction(cartItem);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StoreNav tenant={tenant} storeName={storeName} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <span className="text-5xl block mb-4">🔍</span>
          <h1 className="text-xl font-bold text-foreground mb-2">Item Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This item could not be found. It may have been sold or removed.
          </p>
          <Link
            href={demoHref("/products")}
            className="inline-block px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = item.stock_count === 0;
  const isLowStock = item.stock_count > 0 && item.stock_count <= 2;
  const displayPrice = item.our_price || item.market_value;
  const savings = item.our_price ? item.market_value - item.our_price : 0;

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
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Image + badges */}
          <div>
            <div
              className={`relative w-full aspect-square rounded-2xl flex items-center justify-center text-6xl overflow-hidden ${
                item.is_legendary
                  ? "border-2 border-legendary/50"
                  : "border border-border/50"
              }`}
              style={{
                backgroundColor: item.platform
                  ? `oklch(0.18 0.03 ${(item.platform.length * 37 + item.item_name.length * 13) % 360})`
                  : "oklch(0.14 0.01 260)",
              }}
            >
              <span className="opacity-30">🎮</span>

              {/* Legendary glow */}
              {item.is_legendary && (
                <motion.div
                  variants={pulseGlow}
                  initial={reducedMotion ? undefined : "rest"}
                  animate={reducedMotion ? undefined : "glow"}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                />
              )}

              {/* Out of stock overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <span className="text-lg font-bold text-destructive bg-destructive/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-destructive/30">
                    OUT OF STOCK
                  </span>
                </div>
              )}

              {/* Badge overlays */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {item.is_legendary && (
                  <span className="text-[11px] px-2 py-1 rounded bg-legendary/20 text-legendary border border-legendary/30 font-bold backdrop-blur-sm">
                    💎 LEGENDARY
                  </span>
                )}
                {item.price_spike_flag && (
                  <span className="text-[11px] px-2 py-1 rounded bg-gold/20 text-gold border border-gold/30 font-bold animate-spike-flash backdrop-blur-sm">
                    📈 PRICE SPIKE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Name + badges */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {item.item_name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.platform && (
                  <span className={`text-xs px-2 py-1 rounded border ${conditionBadgeStyle(item.platform)}`}>
                    {item.platform}
                  </span>
                )}
                {item.condition && (
                  <span className={`text-xs px-2 py-1 rounded border ${conditionBadgeStyle(item.condition)}`}>
                    {item.condition}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded border ${
                  item.status === "ACTIVE" ? "bg-xp/20 text-xp border-xp/30" : "bg-muted text-muted-foreground"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Price comparison */}
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Market Value</span>
                <span className="text-sm text-muted-foreground font-mono line-through">
                  ${item.market_value.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/30 pt-2">
                <span className="text-lg text-foreground font-bold">Our Price</span>
                <span className={`text-2xl font-bold font-mono ${item.is_legendary ? "text-legendary" : "text-primary"}`}>
                  ${displayPrice.toFixed(2)}
                </span>
              </div>
              {savings > 0 && (
                <div className="flex justify-end">
                  <span className="text-[11px] text-xp font-bold">
                    Save ${savings.toFixed(2)} vs. market!
                  </span>
                </div>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                isOutOfStock ? "bg-destructive" : isLowStock ? "bg-gold" : "bg-xp"
              }`} />
              <span className={`text-xs font-bold ${
                isOutOfStock ? "text-destructive" : isLowStock ? "text-gold" : "text-xp"
              }`}>
                {isOutOfStock ? "Out of Stock" : isLowStock ? `Only ${item.stock_count} left in stock!` : `${item.stock_count} in stock`}
              </span>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={demoHref(`/products?tags=${tag}`)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    >
                      #{tag.toLowerCase()}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="w-8 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-mono font-bold text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(item.stock_count, quantity + 1))}
                    disabled={isOutOfStock || quantity >= item.stock_count}
                    className="w-8 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3 text-sm rounded-xl font-bold transition-all ${
                  addedToCart
                    ? "bg-xp/20 text-xp border border-xp/30"
                    : isOutOfStock
                      ? "bg-muted/20 text-muted-foreground cursor-not-allowed border border-muted/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30 shadow-[0_0_20px_oklch(0.78_0.2_145/15%)]"
                }`}
              >
                {addedToCart ? "✓ Added to Cart!" : isOutOfStock ? "Out of Stock" : `Add to Cart — $${(displayPrice * quantity).toFixed(2)}`}
              </button>

              <Link
                href={demoHref("/cart")}
                className="block w-full py-2.5 text-xs rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-center"
              >
                View Cart →
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended Items */}
        {recommended.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-foreground mb-4">🎯 Recommended Items</h2>
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {recommended.map((recItem, idx) => (
                <motion.div key={recItem.id} variants={listItemStagger} custom={idx}>
                  <ProductCard item={recItem} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
