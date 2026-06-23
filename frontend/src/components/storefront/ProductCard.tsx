"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { cardHover, pulseGlow } from "@/lib/animations";
import type { InventoryItem } from "@/lib/types";

// ============================================================
// CONDITION BADGE STYLES
// ============================================================
export const conditionBadgeStyle = (condition?: string) => {
  const map: Record<string, string> = {
    NEW: "bg-primary/20 text-primary border-primary/30",
    CIB: "bg-xp/20 text-xp border-xp/30",
    LOOSE: "bg-gold/20 text-gold border-gold/30",
    SCRAP: "bg-scrap/20 text-scrap border-scrap/30",
  };
  return map[condition || ""] || "bg-muted text-muted-foreground";
};

// ============================================================
// PLATFORM BADGE COLORS
// ============================================================
const platformBadgeStyle = (platform?: string) => {
  const map: Record<string, string> = {
    SNES: "bg-faction-sega/20 text-faction-sega border-faction-sega/30",
    NES: "bg-faction-nintendo/20 text-faction-nintendo border-faction-nintendo/30",
    N64: "bg-faction-nintendo/20 text-faction-nintendo border-faction-nintendo/30",
    GENESIS: "bg-faction-sega/20 text-faction-sega border-faction-sega/30",
    PS1: "bg-faction-sony/20 text-faction-sony border-faction-sony/30",
    PS2: "bg-faction-sony/20 text-faction-sony border-faction-sony/30",
    SATURN: "bg-faction-sega/20 text-faction-sega border-faction-sega/30",
    DREAMCAST: "bg-faction-sega/20 text-faction-sega border-faction-sega/30",
    GAMECUBE: "bg-faction-nintendo/20 text-faction-nintendo border-faction-nintendo/30",
    GBA: "bg-faction-nintendo/20 text-faction-nintendo border-faction-nintendo/30",
  };
  return map[platform || ""] || "bg-muted/20 text-muted-foreground border-muted/30";
};

// ============================================================
// PRODUCT CARD — Reusable across catalog, featured, search
// ============================================================
interface ProductCardProps {
  item: InventoryItem;
  onAddToCart?: (item: InventoryItem) => void;
  showActions?: boolean;
}

export default function ProductCard({ item, onAddToCart, showActions = true }: ProductCardProps) {
  const reducedMotion = useGuildStore((s) => s.reducedMotion);
  const isOutOfStock = item.stock_count === 0;
  const isLowStock = item.stock_count > 0 && item.stock_count <= 2;

  return (
    <motion.div
      variants={cardHover}
      initial={reducedMotion ? undefined : "rest"}
      whileHover={reducedMotion ? undefined : "hover"}
      whileTap={reducedMotion ? undefined : "tap"}
      className="relative group"
    >
      <Link
        href={demoHref(`/products/${item.id}`)}
        className={`block guild-card bg-card border rounded-xl overflow-hidden transition-all duration-300 ${
          item.is_legendary
            ? "border-legendary/40 shadow-[0_0_20px_oklch(0.65_0.25_300/15%)]"
            : "border-border/50 hover:border-primary/30 hover:shadow-[0_0_20px_oklch(0.78_0.2_145/8%)]"
        }`}
      >
        {/* Image Placeholder */}
        <div
          className="w-full aspect-[4/3] flex items-center justify-center text-4xl relative overflow-hidden"
          style={{
            backgroundColor: item.platform
              ? `oklch(0.18 0.03 ${(item.platform.length * 37 + item.item_name.length * 13) % 360})`
              : "oklch(0.14 0.01 260)",
          }}
        >
          <span className="opacity-40">🎮</span>

          {/* Legendary glow overlay */}
          {item.is_legendary && (
            <motion.div
              variants={pulseGlow}
              initial={reducedMotion ? undefined : "rest"}
              animate={reducedMotion ? undefined : "glow"}
              className="absolute inset-0 rounded-lg pointer-events-none"
            />
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-sm font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-lg backdrop-blur-sm border border-destructive/30">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Name + badges row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground truncate flex-1 group-hover:text-primary transition-colors">
              {item.item_name}
            </h3>
            <div className="flex gap-1 shrink-0">
              {item.is_legendary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-legendary/20 text-legendary border border-legendary/30 font-bold">
                  LEGENDARY
                </span>
              )}
              {item.price_spike_flag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30 font-bold animate-spike-flash">
                  SPIKE
                </span>
              )}
            </div>
          </div>

          {/* Platform + Condition badges */}
          <div className="flex flex-wrap gap-1">
            {item.platform && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${platformBadgeStyle(item.platform)}`}>
                {item.platform}
              </span>
            )}
            {item.condition && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${conditionBadgeStyle(item.condition)}`}>
                {item.condition}
              </span>
            )}
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <p className={`text-sm font-bold font-mono ${item.is_legendary ? "text-legendary" : "text-primary"}`}>
                {item.our_price ? `$${item.our_price.toFixed(2)}` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground line-through">
                ${item.market_value.toFixed(2)}
              </p>
            </div>

            {/* Stock indicator */}
            <div className="text-right">
              {isOutOfStock ? (
                <span className="text-[10px] text-destructive font-bold">Sold Out</span>
              ) : isLowStock ? (
                <span className="text-[10px] text-gold font-bold">Only {item.stock_count} left</span>
              ) : (
                <span className="text-[10px] text-xp font-bold">In Stock</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {/* Add to Cart button */}
          {showActions && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onAddToCart && !isOutOfStock) onAddToCart(item);
              }}
              disabled={isOutOfStock}
              className={`w-full mt-1 py-2 text-[11px] rounded-lg font-bold transition-all ${
                isOutOfStock
                  ? "bg-muted/20 text-muted-foreground cursor-not-allowed border border-muted/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30"
              }`}
            >
              {isOutOfStock ? "SOLD OUT" : "ADD TO CART"}
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
