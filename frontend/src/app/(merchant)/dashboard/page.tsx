"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import type { ActivityEvent, DashboardStats, FactionStanding } from "@/lib/types";

// ============================================================
// DATE RANGE FILTER TYPES
// ============================================================
type DateRange = "today" | "week" | "month" | "all";

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const formatGold = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
};

// ============================================================
// SIMPLE INLINE SPARKLINE COMPONENT
// ============================================================
function Sparkline({ data, color = "oklch(0.78 0.2 145)" }: { data: number[]; color?: string }) {
  if (data.length === 0) return null;
  const w = 200;
  const h = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const polyline = points.join(" ");
  const area = `${polyline} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} className="w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-fill-${color.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-fill-${color.replace(/\s/g, "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
type StatColor = "primary" | "gold" | "legendary" | "destructive" | "xp" | "faction-sega";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: StatColor;
  animate?: boolean;
  suffix?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const colorStyles: Record<StatColor, { border: string; shadow: string; label: string; value: string }> = {
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

function StatCard({ label, value, icon, color = "primary", animate = false, suffix = "", children, onClick }: StatCardProps) {
  const c = colorStyles[color];
  return (
    <div
      onClick={onClick}
      className={`guild-card bg-card rounded-lg p-5 ${c.border} ${c.shadow} ${animate ? "animate-glow-breathe" : ""} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xs font-medium uppercase tracking-wider ${c.label}`}>{label}</h3>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${c.value} ${animate ? "animate-neon-pulse" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix && <span className="text-lg ml-1 opacity-60">{suffix}</span>}
      </p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================
function StatCardSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-border/20 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-5 w-5 bg-muted rounded" />
      </div>
      <div className="h-8 w-28 bg-muted rounded mt-2" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-border/20 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-2 w-2 bg-muted rounded-full" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
          <div className="h-4 w-4 bg-muted rounded mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-2.5 w-48 bg-muted rounded" />
          </div>
          <div className="h-3 w-14 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ERROR BANNER
// ============================================================
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="guild-card bg-destructive/10 border-destructive/30 rounded-lg p-5">
      <div className="flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-destructive">Failed to load dashboard</p>
          <p className="text-xs text-destructive/70 mt-0.5">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs rounded bg-destructive/20 text-destructive font-bold hover:bg-destructive/30 transition-colors"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="guild-card bg-card rounded-lg p-12 border-border/20 text-center">
      <span className="text-5xl block mb-4">📡</span>
      <h2 className="text-xl font-bold text-primary text-glow-green mb-2">No Data Received</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Your merchant terminal is connected but no data has been loaded yet.
        Press the refresh button below to initialize your dashboard with demo data.
      </p>
      <button
        onClick={onRefresh}
        className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
      >
        ⚡ LOAD DEMO DATA
      </button>
    </div>
  );
}

// ============================================================
// QUICK ACTIONS
// ============================================================
function QuickActions() {
  const quickActions = [
    { label: "Scan Item", icon: "📸", href: demoHref("/inventory"), id: "btn-quick-scan", color: "border-primary/30 bg-primary/5 text-primary" },
    { label: "Post Bounty", icon: "📜", href: demoHref("/bounty-board"), id: "btn-quick-bounty", color: "border-gold/30 bg-gold/5 text-gold" },
    { label: "Create Lobby", icon: "🎮", href: demoHref("/nexus"), id: "btn-quick-lobby", color: "border-xp/30 bg-xp/5 text-xp" },
    { label: "Ask AI", icon: "🤖", href: demoHref("/shopkeeper"), id: "btn-quick-ai", color: "border-legendary/30 bg-legendary/5 text-legendary" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          id={action.id}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border ${action.color} hover:brightness-125 transition-all`}
        >
          <span>{action.icon}</span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}

// ============================================================
// FACTION WAR CHART
// ============================================================
function FactionWarChart({ standings }: { standings: FactionStanding[] }) {
  const maxPoints = Math.max(...standings.map((s) => s.total_points), 1);

  const factionMeta: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    SEGA_SYNDICATE: { label: "Sega Syndicate", color: "bg-faction-sega", bg: "bg-faction-sega/20", icon: "🔵" },
    NINTENDO_NOMADS: { label: "Nintendo Nomads", color: "bg-faction-nintendo", bg: "bg-faction-nintendo/20", icon: "🔴" },
    SONY_SENTINELS: { label: "Sony Sentinels", color: "bg-faction-sony", bg: "bg-faction-sony/20", icon: "🟣" },
  };

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">
          Faction War — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <span className="text-lg">⚔️</span>
      </div>
      <div className="space-y-3">
        {standings
          .sort((a, b) => b.total_points - a.total_points)
          .map((standing) => {
            const meta = factionMeta[standing.faction] || { label: standing.faction, color: "bg-muted", bg: "bg-muted/20", icon: "⬜" };
            const widthPct = (standing.total_points / maxPoints) * 100;
            return (
              <div key={standing.faction}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span className="text-xs text-foreground/80">{meta.label}</span>
                    {standing.is_winner && (
                      <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">👑 LEADING</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">${standing.total_points.toLocaleString()}</span>
                </div>
                <div className={`h-2 rounded-full ${meta.bg} overflow-hidden`}>
                  <div className={`h-full rounded-full ${meta.color} transition-all duration-1000 ease-out`} style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY FEED
// ============================================================
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const typeIcons: Record<string, string> = { GRAIL: "💎", SCAN: "📸", BOUNTY: "📜", SALE: "💰", SCORE: "🏆", TRADE_IN: "🔄" };
  const typeColors: Record<string, string> = { GRAIL: "text-legendary", SCAN: "text-primary", BOUNTY: "text-xp", SALE: "text-gold", SCORE: "text-primary", TRADE_IN: "text-muted-foreground" };

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">Live Activity</h3>
        <span className="w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <span className="text-sm mt-0.5">{typeIcons[event.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${typeColors[event.type] || "text-foreground"}`}>{event.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{event.description}</p>
              </div>
              {event.value != null && (
                <span className="text-xs text-gold font-mono shrink-0">${event.value.toFixed(2)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// INVENTORY ALERTS
// ============================================================
function InventoryAlerts() {
  const inventory = useGuildStore((s) => s.inventory);
  const lowStock = useMemo(() => inventory.filter((i) => i.stock_count > 0 && i.stock_count <= 1 && i.status === "ACTIVE"), [inventory]);
  const priceSpikes = useMemo(() => inventory.filter((i) => i.price_spike_flag && i.status === "ACTIVE"), [inventory]);

  if (lowStock.length === 0 && priceSpikes.length === 0) {
    return (
      <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-3">Inventory Alerts</h3>
        <p className="text-xs text-muted-foreground text-center py-4">All clear — no alerts.</p>
      </div>
    );
  }

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">Inventory Alerts</h3>
      {lowStock.length > 0 && (
        <div>
          <p className="text-[11px] text-destructive font-bold mb-1.5">⚠ LOW STOCK ({lowStock.length})</p>
          <div className="space-y-1">
            {lowStock.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{item.item_name}</span>
                <span className="text-destructive font-mono font-bold">x{item.stock_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {priceSpikes.length > 0 && (
        <div>
          <p className="text-[11px] text-gold font-bold mb-1.5">📈 PRICE SPIKE ({priceSpikes.length})</p>
          <div className="space-y-1">
            {priceSpikes.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{item.item_name}</span>
                <span className="text-gold font-mono">${item.market_value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// UPCOMING LFG SESSIONS
// ============================================================
function UpcomingLfgSessions() {
  const lobbies = useGuildStore((s) => s.lfgLobbies);
  const today = new Date().toISOString().split("T")[0];
  const todayLobbies = useMemo(() => lobbies.filter((l) => l.start_time && l.start_time.startsWith(today)), [lobbies, today]);

  if (todayLobbies.length === 0) {
    return (
      <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-3">Today&apos;s LFG Sessions</h3>
        <p className="text-xs text-muted-foreground text-center py-4">No sessions scheduled for today.</p>
      </div>
    );
  }

  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70">Today&apos;s LFG Sessions</h3>
        <span className="text-lg">🎮</span>
      </div>
      <div className="space-y-2">
        {todayLobbies.slice(0, 4).map((lobby) => (
          <div key={lobby.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs">{lobby.console_type === "N64" ? "🟢" : lobby.console_type === "GAMECUBE" ? "🟡" : "🔵"}</span>
              <span className="text-xs text-foreground/80 truncate">{lobby.game_title}</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {lobby.player_slots_filled}/{lobby.player_slots_total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT TO CSV
// ============================================================
function ExportCSVButton({ events }: { events: ActivityEvent[] }) {
  const handleExport = useCallback(() => {
    const headers = "Type,Title,Description,Value,Timestamp\n";
    const rows = events.map((e) =>
      `"${e.type}","${e.title}","${e.description}",${e.value ?? ""},${e.timestamp}`
    ).join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guildos-activity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1.5 text-xs rounded border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
    >
      📥 Export CSV
    </button>
  );
}

// ============================================================
// MAIN DASHBOARD PAGE
// ============================================================
export default function DashboardPage() {
  const stats = useGuildStore((s) => s.dashboardStats);
  const factionStandings = useGuildStore((s) => s.factionStandings);
  const activityFeed = useGuildStore((s) => s.activityFeed);
  const inventory = useGuildStore((s) => s.inventory);
  const setDashboardStats = useGuildStore((s) => s.setDashboardStats);
  const setActivityFeed = useGuildStore((s) => s.setActivityFeed);

  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Simulated loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLoadError(null);
    // Simulate a refresh with potential error
    setTimeout(() => {
      // Import phantom data for refresh
      const { phantomDashboardStats, phantomActivity } = require("@/mocks/phantomData");
      setDashboardStats(phantomDashboardStats);
      setActivityFeed(phantomActivity);
      setIsRefreshing(false);
    }, 1200);
    // Simulate occasional error
    if (Math.random() < 0.05) {
      setTimeout(() => {
        setLoadError("Network timeout while fetching dashboard data.");
        setIsRefreshing(false);
      }, 2000);
    }
  }, [setDashboardStats, setActivityFeed]);

  // Compute derived values
  const activeBountiesCount = useGuildStore((s) => s.bounties.filter((b) => b.status === "ACTIVE").length);
  const activeLobbiesCount = useGuildStore((s) => s.lfgLobbies.filter((l) => l.lobby_status === "OPEN").length);
  const totalInventoryValue = useMemo(() => inventory.reduce((s, i) => s + i.market_value * i.stock_count, 0), [inventory]);

  // Sparkline data (phantom daily revenue)
  const sparklineData = useMemo(() => [120, 180, 95, 230, 310, 280, 340, 290, 410, 380, 450, 420, 390, 510], []);

  // Filter activity by date range
  const filteredActivity = useMemo(() => {
    if (dateRange === "all") return activityFeed;
    const now = new Date();
    const thresholds: Record<DateRange, number> = { today: 1, week: 7, month: 30, all: 9999 };
    const days = thresholds[dateRange];
    const cutoff = new Date(now.getTime() - days * 86400000);
    return activityFeed.filter((e) => new Date(e.timestamp) >= cutoff);
  }, [activityFeed, dateRange]);

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><StatCardSkeleton /></div>
          <ActivitySkeleton />
        </div>
      </div>
    );
  }

  if (!hasLoaded) {
    return <EmptyState onRefresh={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">MERCHANT TERMINAL</h1>
          <p className="text-xs text-muted-foreground mt-1">
            STATUS: <span className="text-primary">ONLINE</span> ·{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVButton events={filteredActivity} />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-3 py-1.5 text-xs rounded border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1.5`}
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>⟳</span>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {loadError && <ErrorBanner message={loadError} onRetry={handleRefresh} />}

      {/* Quick Actions */}
      <QuickActions />

      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-3">
        {DATE_RANGES.map((dr) => (
          <button
            key={dr.id}
            onClick={() => setDateRange(dr.id)}
            className={`px-3 py-1.5 text-xs rounded transition-all ${
              dateRange === dr.id
                ? "bg-primary/20 border border-primary/40 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {dr.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Gold Farmed (Revenue)" value={`$${stats.goldFarmed.toLocaleString()}`} icon="🪙" color="gold" animate>
          <Sparkline data={sparklineData} color="oklch(0.82 0.16 85)" />
        </StatCard>
        <StatCard label="Legendary Drops" value={stats.legendaryDrops} icon="💎" color="legendary" />
        <StatCard
          label="Loot Depleted (Out of Stock)"
          value={stats.lootDepleted}
          icon="💀"
          color="destructive"
          animate={stats.lootDepleted > 5}
        />
        <StatCard label="Active Bounties" value={activeBountiesCount} icon="📜" color="xp" />
        <StatCard
          label="Price Spike Alerts"
          value={stats.priceSpikeAlerts}
          icon="📈"
          color="destructive"
          animate={stats.priceSpikeAlerts > 0}
        />
        <StatCard label="Open Lobbies" value={activeLobbiesCount} icon="🏟️" color="primary" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FactionWarChart standings={factionStandings} />
        <ActivityFeed events={filteredActivity} />
      </div>

      {/* Additional Sections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InventoryAlerts />
        <UpcomingLfgSessions />
        <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
          <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-3">Inventory Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Items</span>
              <span className="text-foreground font-mono">{inventory.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Value</span>
              <span className="text-gold font-mono font-bold">${totalInventoryValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Legendary Items</span>
              <span className="text-legendary font-mono">{inventory.filter((i) => i.is_legendary).length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Out of Stock</span>
              <span className="text-destructive font-mono">{inventory.filter((i) => i.stock_count === 0).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
