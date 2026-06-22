"use client";

import React from "react";
import type { ActivityEvent } from "@/lib/types";

// --- Stat Card Component ---
function StatCard({
  label,
  value,
  icon,
  color = "primary",
  animate = false,
  suffix = "",
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: "primary" | "gold" | "legendary" | "destructive" | "xp" | "faction-sega";
  animate?: boolean;
  suffix?: string;
}) {
  const colorMap = {
    primary: {
      border: "border-primary/20",
      shadow: "shadow-[0_0_15px_oklch(0.78_0.2_145/8%)]",
      label: "text-primary/70",
      value: "text-primary text-glow-green",
    },
    gold: {
      border: "border-gold/20",
      shadow: "shadow-[0_0_15px_oklch(0.82_0.16_85/8%)]",
      label: "text-gold/70",
      value: "text-gold text-glow-gold",
    },
    legendary: {
      border: "border-legendary/20",
      shadow: "shadow-[0_0_15px_oklch(0.65_0.25_300/8%)]",
      label: "text-legendary/70",
      value: "text-legendary text-glow-legendary",
    },
    destructive: {
      border: "border-destructive/20",
      shadow: "shadow-[0_0_15px_oklch(0.62_0.24_25/8%)]",
      label: "text-destructive/70",
      value: "text-destructive text-glow-destructive",
    },
    xp: {
      border: "border-xp/20",
      shadow: "shadow-[0_0_15px_oklch(0.7_0.2_170/8%)]",
      label: "text-xp/70",
      value: "text-xp",
    },
    "faction-sega": {
      border: "border-faction-sega/20",
      shadow: "shadow-[0_0_15px_oklch(0.6_0.2_250/8%)]",
      label: "text-faction-sega/70",
      value: "text-faction-sega",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className={`guild-card bg-card rounded-lg p-5 ${c.border} ${c.shadow} ${
        animate ? "animate-glow-breathe" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xs font-medium uppercase tracking-wider ${c.label}`}>
          {label}
        </h3>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${c.value} ${animate ? "animate-neon-pulse" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-lg ml-1 opacity-60">{suffix}</span>}
      </p>
    </div>
  );
}

// --- Faction War Chart Component ---
function FactionWarChart({
  standings,
}: {
  standings: { faction: string; total_points: number; is_winner: boolean }[];
}) {
  const maxPoints = Math.max(...standings.map((s) => s.total_points), 1);

  const factionMeta: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    SEGA_SYNDICATE: { label: "Sega Syndicate", color: "bg-faction-sega", bg: "bg-faction-sega/20", icon: "🔵" },
    NINTENDO_NOMADS: { label: "Nintendo Nomads", color: "bg-faction-nintendo", bg: "bg-faction-nintendo/20", icon: "🔴" },
    SONY_SENTINELS: { label: "Sony Sentinels", color: "bg-faction-sony", bg: "bg-faction-sony/20", icon: "🟣" },
  };

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">
          Faction War — June 2026
        </h3>
        <span className="text-lg">⚔️</span>
      </div>
      <div className="space-y-3">
        {standings
          .sort((a, b) => b.total_points - a.total_points)
          .map((standing) => {
            const meta = factionMeta[standing.faction] || {
              label: standing.faction,
              color: "bg-muted",
              bg: "bg-muted/20",
              icon: "⬜",
            };
            const widthPct = (standing.total_points / maxPoints) * 100;

            return (
              <div key={standing.faction}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span className="text-xs text-foreground/80">{meta.label}</span>
                    {standing.is_winner && (
                      <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">
                        👑 LEADING
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ${standing.total_points.toLocaleString()}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${meta.bg} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${meta.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// --- Activity Feed Component ---
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const typeIcons: Record<string, string> = {
    GRAIL: "💎",
    SCAN: "📸",
    BOUNTY: "📜",
    SALE: "💰",
    SCORE: "🏆",
    TRADE_IN: "🔄",
  };

  const typeColors: Record<string, string> = {
    GRAIL: "text-legendary",
    SCAN: "text-primary",
    BOUNTY: "text-xp",
    SALE: "text-gold",
    SCORE: "text-primary",
    TRADE_IN: "text-muted-foreground",
  };

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 col-span-full lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">
          Live Activity
        </h3>
        <span className="w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
          >
            <span className="text-sm mt-0.5">{typeIcons[event.type] || "📌"}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${typeColors[event.type] || "text-foreground"}`}>
                {event.title}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {event.description}
              </p>
            </div>
            {event.value && (
              <span className="text-xs text-gold font-mono shrink-0">
                ${event.value.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD PAGE ---
import { useGuildStore } from "@/lib/store/useGuildStore";

export default function DashboardPage() {
  const stats = useGuildStore((s) => s.dashboardStats);
  const factionStandings = useGuildStore((s) => s.factionStandings);
  const activityFeed = useGuildStore((s) => s.activityFeed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">
            MERCHANT TERMINAL
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            STATUS: <span className="text-primary">ONLINE</span> ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Gold Farmed (Revenue)"
          value={`$${stats.goldFarmed.toLocaleString()}`}
          icon="🪙"
          color="gold"
          animate
        />
        <StatCard
          label="Legendary Drops"
          value={stats.legendaryDrops}
          icon="💎"
          color="legendary"
        />
        <StatCard
          label="Loot Depleted (Out of Stock)"
          value={stats.lootDepleted}
          icon="💀"
          color="destructive"
          animate={stats.lootDepleted > 5}
        />
        <StatCard
          label="Active Bounties"
          value={stats.activeBounties}
          icon="📜"
          color="xp"
        />
        <StatCard
          label="Price Spike Alerts"
          value={stats.priceSpikeAlerts}
          icon="📈"
          color="destructive"
          animate={stats.priceSpikeAlerts > 0}
        />
        <StatCard
          label="Open Lobbies"
          value={stats.activeLobbies}
          icon="🏟️"
          color="primary"
        />
      </div>

      {/* Bottom Row: Faction Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FactionWarChart standings={factionStandings} />
        <ActivityFeed events={activityFeed} />
      </div>
    </div>
  );
}
