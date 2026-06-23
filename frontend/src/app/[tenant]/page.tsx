"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, listContainer, listItemStagger } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import ProductCard from "@/components/storefront/ProductCard";
import type { InventoryItem } from "@/lib/types";

// ============================================================
// PLATFORM CHIPS
// ============================================================
const PLATFORMS = ["SNES", "NES", "N64", "GENESIS", "PS1", "PS2", "SATURN", "DREAMCAST", "GAMECUBE", "GBA"];

// ============================================================
// STATS BAR
// ============================================================
function StatsBar() {
  const inventory = useGuildStore((s) => s.inventory);
  const bounties = useGuildStore((s) => s.bounties);

  const stats = useMemo(() => [
    {
      label: "Legendary Items",
      value: inventory.filter((i) => i.is_legendary).length,
      icon: "💎",
      color: "text-legendary",
    },
    {
      label: "Active Bounties",
      value: bounties.filter((b) => b.status === "ACTIVE").length,
      icon: "📜",
      color: "text-gold",
    },
    {
      label: "Total Items",
      value: inventory.length,
      icon: "📦",
      color: "text-primary",
    },
    {
      label: "Happy Customers",
      value: "500+",
      icon: "🎮",
      color: "text-xp",
    },
  ], [inventory, bounties]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          variants={listItemStagger}
          custom={idx}
          className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 text-center hover:border-primary/20 transition-all"
        >
          <span className="text-2xl block mb-1">{stat.icon}</span>
          <p className={`text-lg font-bold font-mono ${stat.color}`}>
            {stat.value}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// FEATURED / LEGENDARY DROPS
// ============================================================
function LegendaryDrops({ items, onAddToCart }: { items: InventoryItem[]; onAddToCart: (item: InventoryItem) => void }) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          <span className="text-gradient-primary text-gradient-shine">💎 Legendary Drops</span>
        </h2>
        <Link
          href={demoHref("/products")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, 3).map((item, idx) => (
          <motion.div
            key={item.id}
            variants={listItemStagger}
            custom={idx}
          >
            <ProductCard item={item} onAddToCart={onAddToCart} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// BROWSE BY PLATFORM
// ============================================================
function PlatformFilters() {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground mb-4">🎮 Browse by Platform</h2>
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <Link
            key={platform}
            href={demoHref(`/products?platform=${platform}`)}
            className="px-3 py-2 text-xs rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            {platform}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// LATEST ARRIVALS
// ============================================================
function LatestArrivals({ items, onAddToCart }: { items: InventoryItem[]; onAddToCart: (item: InventoryItem) => void }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [items]
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">🆕 Latest Arrivals</h2>
        <Link
          href={demoHref("/products")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Browse All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {sorted.slice(0, 10).map((item, idx) => (
          <motion.div
            key={item.id}
            variants={listItemStagger}
            custom={idx}
          >
            <ProductCard item={item} onAddToCart={onAddToCart} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CTA SECTION
// ============================================================
function CTASection({ tenant }: { tenant: string }) {
  return (
    <section className="bg-gradient-to-br from-primary/5 to-legendary/5 border border-primary/10 rounded-2xl p-8 text-center">
      <span className="text-5xl block mb-4">🏪</span>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Visit {tenant.replace(/-/g, " ")}
      </h2>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
        Stop by our store to see our full collection in person. Trade in your old games,
        join a tournament, or just hang out with fellow retro enthusiasts!
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={demoHref("/products")}
          className="px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          Browse All Items
        </Link>
        <Link
          href={demoHref("/orders")}
          className="px-6 py-3 text-sm rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
        >
          View Orders
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function StoreFooter({ tenant }: { tenant: string }) {
  return (
    <footer className="border-t border-border/50 mt-8 pt-8 pb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Shop</h3>
          <div className="space-y-2">
            <Link href={demoHref("/products")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Browse All
            </Link>
            <Link href={demoHref("/cart")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Cart
            </Link>
            <Link href={demoHref("/orders")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Orders
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Community</h3>
          <div className="space-y-2">
            <Link href={demoHref("/chat")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              AI Shopkeeper
            </Link>
            <Link href={demoHref("/account")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Account
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Support</h3>
          <div className="space-y-2">
            <Link href={demoHref("/account")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </Link>
            <Link href={demoHref("/orders")} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Track Order
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Legal</h3>
          <div className="space-y-2">
            <Link href="/legal/terms" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/refunds" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border/30 text-center">
        <p className="text-[10px] text-muted-foreground">
          Powered by <span className="text-primary">GuildOS</span> — Retro Gaming Command Center
        </p>
      </div>
    </footer>
  );
}

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection({ tenant, storeName }: { tenant: string; storeName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-legendary/10 border border-primary/10 mb-8">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-move opacity-30 pointer-events-none" />

      <div className="relative px-6 py-12 md:py-16 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block text-5xl mb-4">🎮</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="text-gradient-primary text-gradient-shine tracking-wider">
              {storeName}
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6">
            Your destination for retro gaming treasures. Browse our curated collection of classic games, consoles, and accessories.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={demoHref("/products")}
              className="px-6 py-3 text-sm rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-[0_0_20px_oklch(0.78_0.2_145/20%)]"
            >
              🛒 Start Shopping
            </Link>
            <Link
              href={demoHref("/chat")}
              className="px-6 py-3 text-sm rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              🤖 Ask the Shopkeeper
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN STOREFRONT HOME PAGE
// ============================================================
export default function TenantHomePage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const inventory = useGuildStore((s) => s.inventory);
  const addToCartAction = useGuildStore((s) => s.addToCart);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const legendaryItems = useMemo(
    () => inventory.filter((i) => i.is_legendary && i.status === "ACTIVE"),
    [inventory]
  );

  const activeItems = useMemo(
    () => inventory.filter((i) => i.status === "ACTIVE"),
    [inventory]
  );

  const handleAddToCart = (item: InventoryItem) => {
    addToCartAction({
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inventory_id: item.id,
      item_name: item.item_name,
      platform: item.platform,
      condition: item.condition,
      price: item.our_price || item.market_value,
      quantity: 1,
      image_url: item.image_url,
      tags: item.tags,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StoreNav tenant={tenant} storeName={storeName} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-48 bg-card/50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-8">
          {/* Hero */}
          <HeroSection tenant={tenant} storeName={storeName} />

          {/* Stats Bar */}
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            <StatsBar />
          </motion.div>

          {/* Legendary Drops */}
          {legendaryItems.length > 0 && (
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              <LegendaryDrops items={legendaryItems} onAddToCart={handleAddToCart} />
            </motion.div>
          )}

          {/* Browse by Platform */}
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            <PlatformFilters />
          </motion.div>

          {/* Latest Arrivals */}
          {activeItems.length > 0 && (
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
            >
              <LatestArrivals items={activeItems} onAddToCart={handleAddToCart} />
            </motion.div>
          )}

          {/* Empty state if no items */}
          {activeItems.length === 0 && (
            <div className="text-center py-12 bg-card/30 rounded-2xl border border-border/30">
              <span className="text-5xl block mb-4">📭</span>
              <h2 className="text-lg font-bold text-foreground mb-2">No Items Yet</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Our inventory is being updated. Check back soon for retro gaming treasures!
              </p>
            </div>
          )}

          {/* CTA */}
          <CTASection tenant={tenant} />

          {/* Footer */}
          <StoreFooter tenant={tenant} />
        </div>
      </div>
    </motion.div>
  );
}
