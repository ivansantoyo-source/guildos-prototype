"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { pageTransition } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";

// ============================================================
// LEVEL TIER CONFIG
// ============================================================
const TIER_CONFIG: Record<string, { label: string; color: string; icon: string; minXp: number }> = {
  PEASANT: { label: "Peasant", color: "text-muted-foreground", icon: "🪵", minXp: 0 },
  RETRO_MAGE: { label: "Retro Mage", color: "text-primary", icon: "🔮", minXp: 10000 },
  TIME_LORD: { label: "Time Lord", color: "text-legendary", icon: "👑", minXp: 25000 },
};

// ============================================================
// FACTION CONFIG
// ============================================================
const FACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  SEGA_SYNDICATE: { label: "Sega Syndicate", color: "text-faction-sega", bgColor: "bg-faction-sega" },
  NINTENDO_NOMADS: { label: "Nintendo Nomads", color: "text-faction-nintendo", bgColor: "bg-faction-nintendo" },
  SONY_SENTINELS: { label: "Sony Sentinels", color: "text-faction-sony", bgColor: "bg-faction-sony" },
};

// ============================================================
// ACCOUNT PAGE
// ============================================================
export default function AccountPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const user = useGuildStore((s) => s.user);
  const wallet = useGuildStore((s) => s.wallet);
  const customerOrders = useGuildStore((s) => s.customerOrders);
  const cart = useGuildStore((s) => s.cart);

  // Build profile from store or demo defaults
  const profile = useMemo(() => {
    if (user) return user;
    // Demo defaults — use PIXEL_QUEEN for showcase
    return {
      display_name: "PIXEL_QUEEN" as string,
      faction: "NINTENDO_NOMADS" as const,
      xp_points: 28000 as number,
      level_tier: "TIME_LORD" as const,
      email: "pixelqueen@example.com" as string | undefined,
      total_spend: 2800 as number,
      avatar_url: undefined as string | undefined,
    };
  }, [user]);

  const levelTier = profile.level_tier ?? "PEASANT";
  const profileFaction = profile.faction ?? "SEGA_SYNDICATE";
  const tier = TIER_CONFIG[levelTier] || TIER_CONFIG.PEASANT;
  const faction = FACTION_CONFIG[profileFaction] || FACTION_CONFIG.SEGA_SYNDICATE;
  const orderCount = customerOrders.length;
  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  // Calculate XP progress to next tier
  const xpProgress = useMemo(() => {
    const tiers = Object.values(TIER_CONFIG).sort((a, b) => a.minXp - b.minXp);
    const currentIdx = tiers.findIndex((t) => t.minXp <= profile.xp_points && (tiers[tiers.indexOf(t) + 1]?.minXp ?? Infinity) > profile.xp_points);
    const currentTier = tiers[currentIdx];
    const nextTier = tiers[currentIdx + 1];
    if (!nextTier) return { current: profile.xp_points, max: profile.xp_points, pct: 100 };
    const range = nextTier.minXp - currentTier.minXp;
    const progress = profile.xp_points - currentTier.minXp;
    return { current: progress, max: range, pct: Math.min(100, (progress / range) * 100) };
  }, [profile.xp_points]);

  // Demo achievements
  const achievements = [
    { id: "ach-001", name: "First Purchase", icon: "🛒", unlocked: true },
    { id: "ach-002", name: "Collector", icon: "📦", unlocked: orderCount >= 3 },
    { id: "ach-003", name: "High Roller", icon: "💰", unlocked: profile.total_spend >= 1000 },
    { id: "ach-004", name: "Loyal Customer", icon: "🏆", unlocked: orderCount >= 5 },
    { id: "ach-005", name: "Grail Hunter", icon: "💎", unlocked: true },
    { id: "ach-006", name: "Retro Royalty", icon: "👑", unlocked: levelTier === "TIME_LORD" },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background text-foreground"
    >
      <StoreNav tenant={tenant} storeName={storeName} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-legendary/30 flex items-center justify-center text-2xl border border-primary/20 shrink-0">
              {profile.display_name.charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground">{profile.display_name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                {/* Faction badge */}
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${faction.color} bg-card border border-border/50`}>
                  {faction.label}
                </span>
                {/* Level tier badge */}
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${tier.color} bg-card border border-border/50`}>
                  {tier.icon} {tier.label}
                </span>
              </div>
              {profile.email && (
                <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>
              )}
            </div>

            {/* Wallet */}
            <div className="bg-background/50 rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet</p>
              <p className="text-lg font-bold font-mono text-gold">
                ${wallet?.balance.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Lifetime: ${(wallet?.total_earned ?? profile.total_spend).toFixed(0)}
              </p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Experience</span>
              <span className="text-xp font-mono font-bold">{profile.xp_points.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress.pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-xp"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {xpProgress.pct < 100
                ? `${xpProgress.current.toLocaleString()} / ${xpProgress.max.toLocaleString()} XP to next tier`
                : "Maximum tier reached!"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href={demoHref("/orders")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-all"
          >
            <span className="text-2xl block mb-1">📋</span>
            <p className="text-lg font-bold font-mono text-primary">{orderCount}</p>
            <p className="text-[10px] text-muted-foreground">Orders</p>
          </Link>
          <Link
            href={demoHref("/cart")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-all"
          >
            <span className="text-2xl block mb-1">🛒</span>
            <p className="text-lg font-bold font-mono text-primary">{cartCount}</p>
            <p className="text-[10px] text-muted-foreground">Cart Items</p>
          </Link>
          <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 text-center">
            <span className="text-2xl block mb-1">💰</span>
            <p className="text-lg font-bold font-mono text-gold">${profile.total_spend.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Spent</p>
          </div>
          <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 text-center">
            <span className="text-2xl block mb-1">🏅</span>
            <p className="text-lg font-bold font-mono text-legendary">{achievements.filter((a) => a.unlocked).length}</p>
            <p className="text-[10px] text-muted-foreground">Achievements</p>
          </div>
        </div>

        {/* Achievement Showcase */}
        <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">🏆 Achievement Showcase</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`text-center p-3 rounded-lg border transition-all ${
                  ach.unlocked
                    ? "bg-background/50 border-primary/20"
                    : "bg-muted/10 border-border/20 opacity-40"
                }`}
              >
                <span className="text-2xl block mb-1">{ach.icon}</span>
                <p className={`text-[10px] font-bold ${ach.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {ach.name}
                </p>
                {!ach.unlocked && (
                  <p className="text-[8px] text-muted-foreground mt-0.5">Locked</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={demoHref("/orders")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm font-bold text-foreground">View Orders</p>
              <p className="text-[10px] text-muted-foreground">Track your purchases and order status</p>
            </div>
          </Link>
          <Link
            href={demoHref("/cart")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
          >
            <span className="text-2xl">🛒</span>
            <div>
              <p className="text-sm font-bold text-foreground">Shopping Cart</p>
              <p className="text-[10px] text-muted-foreground">{cartCount > 0 ? `${cartCount} items in your cart` : "Your cart is empty"}</p>
            </div>
          </Link>
          <Link
            href={demoHref("/chat")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
          >
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-bold text-foreground">AI Shopkeeper</p>
              <p className="text-[10px] text-muted-foreground">Ask about inventory, prices, and more</p>
            </div>
          </Link>
          <Link
            href={demoHref("/products")}
            className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
          >
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-sm font-bold text-foreground">Browse Items</p>
              <p className="text-[10px] text-muted-foreground">Explore our full catalog</p>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
