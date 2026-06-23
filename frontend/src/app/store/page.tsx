// ============================================================================
// /store — Clean customer storefront URL
// Uses a client-side approach: sets demo mode, seeds phantom data,
// and renders the storefront inline so the URL stays clean as /store
// ============================================================================

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition, listContainer, listItemStagger } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import ProductCard from "@/components/storefront/ProductCard";
import {
  phantomInventory,
  phantomBounties,
  phantomDashboardStats,
  phantomOrders,
  phantomStorefrontConfig,
  phantomNotifications,
} from "@/mocks/phantomData";
import type { InventoryItem } from "@/lib/types";

const PLATFORMS = ["SNES", "NES", "N64", "GENESIS", "PS1", "PS2", "SATURN", "DREAMCAST", "GAMECUBE", "GBA"];

const TENANT = "store";
const STORE_NAME = "Time Warp Gaming";

// Stats bar
function StatsBar() {
  const inventory = useGuildStore((s) => s.inventory);
  const bounties = useGuildStore((s) => s.bounties);
  const stats = useMemo(() => [
    { label: "Legendary Items", value: inventory.filter((i) => i.is_legendary).length, icon: "💎", color: "text-legendary" },
    { label: "Active Bounties", value: bounties.filter((b) => b.status === "ACTIVE").length, icon: "📜", color: "text-gold" },
    { label: "Total Items", value: inventory.filter((i) => i.status === "ACTIVE").length, icon: "📦", color: "text-primary" },
    { label: "Happy Customers", value: 3, icon: "👥", color: "text-green-400" },
  ], [inventory, bounties]);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="guild-card rounded-xl p-4 text-center">
          <span className="text-2xl">{s.icon}</span>
          <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// Main store page
export default function StorePage() {
  const inventory = useGuildStore((s) => s.inventory);
  const demoMode = useGuildStore((s) => s.demoMode);
  const setDemoMode = useGuildStore((s) => s.setDemoMode);
  const setInventory = useGuildStore((s) => s.setInventory);
  const setBounties = useGuildStore((s) => s.setBounties);
  const setDashboardStats = useGuildStore((s) => s.setDashboardStats);
  const setCustomerOrders = useGuildStore((s) => s.setCustomerOrders);
  const setStorefrontConfig = useGuildStore((s) => s.setStorefrontConfig);
  const setNotifications = useGuildStore((s) => s.setNotifications);
  const addToCartAction = useGuildStore((s) => s.addToCart);
  const [isLoading, setIsLoading] = useState(true);

  // Enable demo mode and seed data
  useEffect(() => {
    if (!demoMode) setDemoMode(true);
    if (inventory.length === 0) {
      setInventory(phantomInventory);
      setBounties(phantomBounties);
      setDashboardStats(phantomDashboardStats);
      setCustomerOrders(phantomOrders);
      setStorefrontConfig(phantomStorefrontConfig);
      setNotifications(phantomNotifications);
    }
  }, []);

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
        <StoreNav tenant={TENANT} storeName={STORE_NAME} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-48 bg-card/50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (<div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse" />))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreNav tenant={TENANT} storeName={STORE_NAME} />

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8"
        variants={pageTransition}
        initial="initial"
        animate="animate"
      >
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-gold/5 border border-border p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-move pointer-events-none opacity-30" />
          <div className="relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary text-gradient-shine">
              {STORE_NAME}
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Where Every Cartridge Tells a Story
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={demoHref("/store/products")} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">
                Browse All
              </Link>
              <Link href={demoHref("/store/cart")} className="px-6 py-2.5 rounded-lg border border-border hover:border-primary/40 transition-all">
                🛒 Cart
              </Link>
            </div>
          </div>
        </section>

        <StatsBar />

        {/* Legendary Drops */}
        {legendaryItems.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">💎 Legendary Drops</h2>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={listContainer} initial="initial" animate="animate">
              {legendaryItems.map((item, i) => (
                <motion.div key={item.id} variants={listItemStagger} custom={i}>
                  <ProductCard item={item} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Browse by Platform */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">🎮 Browse by Platform</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Link key={p} href={demoHref(`/store/products?platform=${p}`)} className="px-4 py-2 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-sm transition-all">
                {p}
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Arrivals */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">📦 Latest Arrivals</h2>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" variants={listContainer} initial="initial" animate="animate">
            {activeItems.slice(0, 8).map((item, i) => (
              <motion.div key={item.id} variants={listItemStagger} custom={i}>
                <ProductCard item={item} onAddToCart={handleAddToCart} />
              </motion.div>
            ))}
          </motion.div>
          {activeItems.length > 8 && (
            <div className="text-center mt-6">
              <Link href={demoHref("/store/products")} className="px-6 py-2.5 rounded-lg border border-border hover:border-primary/40 transition-all text-sm">
                View All {activeItems.length} Items →
              </Link>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-4 text-center text-xs text-muted-foreground space-y-2">
          <div className="flex justify-center gap-6">
            <Link href="/legal/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/legal/refunds" className="hover:text-primary transition-colors">Refunds</Link>
          </div>
          <p>© {new Date().getFullYear()} {STORE_NAME} — Powered by GuildOS</p>
        </footer>
      </motion.div>
    </div>
  );
}
