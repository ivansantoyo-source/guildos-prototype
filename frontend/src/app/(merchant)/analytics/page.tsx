"use client";

import { useMemo, useState } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { phantomInventory, phantomBounties, phantomFactionStandings, phantomDashboardStats, phantomActivity, phantomProfiles } from "@/mocks/phantomData";

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function AnalyticsPage() {
  const storeStats = useGuildStore((s) => s.dashboardStats);
  const storeInventory = useGuildStore((s) => s.inventory);
  const storeBounties = useGuildStore((s) => s.bounties);
  const storeFactions = useGuildStore((s) => s.factionStandings);

  const stats = storeStats.goldFarmed > 0 ? storeStats : phantomDashboardStats;
  const inventory = storeInventory.length > 0 ? storeInventory : phantomInventory;
  const bounties = storeBounties.length > 0 ? storeBounties : phantomBounties;
  const factions = storeFactions.length > 0 ? storeFactions : phantomFactionStandings;
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Platform distribution
  const platformDist = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((item) => {
      const p = item.platform ?? "Unknown";
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [inventory]);

  // Condition breakdown
  const conditionDist = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((item) => {
      const c = item.condition ?? "UNKNOWN";
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [inventory]);

  // Faction distribution from profiles
  const factionDist = useMemo(() => {
    const map: Record<string, { count: number; spend: number }> = {
      SEGA_SYNDICATE: { count: 1, spend: 1250 },
      NINTENDO_NOMADS: { count: 1, spend: 2800 },
      SONY_SENTINELS: { count: 1, spend: 320 },
    };
    return map;
  }, []);

  const totalInventory = inventory.length;
  const legendaryCount = inventory.filter((i) => i.is_legendary).length;
  const activeBountyCount = bounties.filter((b) => b.status === "ACTIVE").length;
  const fulfilledBountyCount = bounties.filter((b) => b.status === "FULFILLED").length;
  const avgItemValue = totalInventory > 0 ? inventory.reduce((sum, i) => sum + i.market_value, 0) / totalInventory : 0;

  const maxPlatform = Math.max(...platformDist.map(([_, c]) => c), 1);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">📊 ANALYTICS</h1>
          <p className="text-xs text-muted-foreground mt-1">Business Intelligence · Inventory Insights · Revenue Tracking</p>
        </div>
        <div className="flex gap-1 bg-card rounded-lg border border-border p-0.5">
          {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                timeRange === range ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range === "all" ? "All" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Gold Farmed" value={`$${stats.goldFarmed.toLocaleString()}`} sub={`+12.5% vs prev.`} trend="up" icon="🪙" />
        <KpiCard label="Total Items" value={totalInventory.toString()} sub={`${legendaryCount} legendary`} trend="neutral" icon="📦" />
        <KpiCard label="Avg. Item Value" value={`$${avgItemValue.toFixed(2)}`} sub="Market avg." trend="up" icon="💵" />
        <KpiCard label="Bounty Rate" value={`${fulfilledBountyCount}/${activeBountyCount + fulfilledBountyCount}`} sub={`${Math.round((fulfilledBountyCount / (activeBountyCount + fulfilledBountyCount || 1)) * 100)}% fulfilled`} trend="up" icon="📜" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform Distribution */}
        <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
          <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-4">Platform Distribution</h3>
          <div className="space-y-2">
            {platformDist.map(([platform, count]) => (
              <div key={platform}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground/70">{platform}</span>
                  <span className="text-muted-foreground font-mono">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${(count / maxPlatform) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condition Breakdown */}
        <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
          <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-4">Condition Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(conditionDist).map(([condition, count]) => {
              const colors: Record<string, string> = {
                NEW: "text-primary border-primary/30",
                CIB: "text-xp border-xp/30",
                LOOSE: "text-gold border-gold/30",
                SCRAP: "text-scrap border-scrap/30",
              };
              const color = colors[condition] ?? "text-muted-foreground border-muted";
              return (
                <div key={condition} className={`text-center p-4 rounded-lg border ${color} bg-card`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-[11px] uppercase tracking-wider">{condition}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Faction Distribution */}
      <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-4">Customer Faction Mix</h3>
        <div className="space-y-3">
          {Object.entries(factionDist).map(([faction, data]) => {
            const factionMeta: Record<string, { color: string; bg: string; icon: string; label: string }> = {
              SEGA_SYNDICATE: { color: "bg-faction-sega", bg: "bg-faction-sega/10", icon: "🔵", label: "Sega Syndicate" },
              NINTENDO_NOMADS: { color: "bg-faction-nintendo", bg: "bg-faction-nintendo/10", icon: "🔴", label: "Nintendo Nomads" },
              SONY_SENTINELS: { color: "bg-faction-sony", bg: "bg-faction-sony/10", icon: "🟣", label: "Sony Sentinels" },
            };
            const meta = factionMeta[faction] ?? { color: "bg-muted", bg: "bg-muted/10", icon: "⬜", label: faction };
            const totalSpend = Object.values(factionDist).reduce((s, d) => s + d.spend, 0);
            const pct = totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0;

            return (
              <div key={faction}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-foreground/70">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-muted-foreground font-mono">${data.spend.toLocaleString()} ({pct.toFixed(0)}%)</span>
                </div>
                <div className={`h-3 rounded-full ${meta.bg} overflow-hidden`}>
                  <div className={`h-full rounded-full ${meta.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
        <h3 className="text-xs font-medium uppercase tracking-wider text-primary/70 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-3 py-2 text-[11px] text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 text-[11px] text-muted-foreground">Event</th>
                <th className="text-right px-3 py-2 text-[11px] text-muted-foreground">Value</th>
                <th className="text-right px-3 py-2 text-[11px] text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {phantomActivity.slice(0, 10).map((event) => (
                <tr key={event.id} className="border-b border-border/30 hover:bg-primary/[2%]">
                  <td className="px-3 py-2.5 text-sm">{event.type === "GRAIL" ? "💎" : event.type === "SALE" ? "💰" : event.type === "BOUNTY" ? "📜" : event.type === "SCORE" ? "🏆" : "📌"}</td>
                  <td className="px-3 py-2.5 text-xs">{event.description}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-mono text-gold">{event.value ? `$${event.value.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-[11px] text-muted-foreground">{new Date(event.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, icon }: { label: string; value: string; sub: string; trend: "up" | "down" | "neutral"; icon: string }) {
  return (
    <div className="guild-card bg-card rounded-lg p-4 border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className={`text-[10px] mt-1 ${trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"}`}>
        {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {sub}
      </p>
    </div>
  );
}
