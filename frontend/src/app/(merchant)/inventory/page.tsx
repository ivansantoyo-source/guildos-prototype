"use client";

import React, { useState, useMemo } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { InventoryItem, ItemCondition } from "@/lib/types";

const PLATFORMS = ["ALL", "SNES", "NES", "N64", "GENESIS", "PS1", "PS2", "SATURN", "DREAMCAST", "GAMECUBE", "GBA"];
const CONDITIONS: (ItemCondition | "ALL")[] = ["ALL", "NEW", "CIB", "LOOSE", "SCRAP"];

export default function InventoryPage() {
  const inventory = useGuildStore((s) => s.inventory);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState<ItemCondition | "ALL">("ALL");
  const [showScrapYard, setShowScrapYard] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "value" | "stock">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let items = [...inventory];

    if (showScrapYard) {
      items = items.filter((i) => i.status === "SCRAP" || i.condition === "SCRAP");
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.platform?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (platformFilter !== "ALL") {
      items = items.filter((i) => i.platform === platformFilter);
    }

    if (conditionFilter !== "ALL") {
      items = items.filter((i) => i.condition === conditionFilter);
    }

    items.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.item_name.localeCompare(b.item_name) * dir;
      if (sortBy === "value") return (a.market_value - b.market_value) * dir;
      if (sortBy === "stock") return (a.stock_count - b.stock_count) * dir;
      return 0;
    });

    return items;
  }, [inventory, search, platformFilter, conditionFilter, showScrapYard, sortBy, sortDir]);

  const toggleSort = (col: "name" | "value" | "stock") => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const getConditionBadge = (condition?: string) => {
    const map: Record<string, string> = {
      NEW: "bg-primary/20 text-primary border-primary/30",
      CIB: "bg-xp/20 text-xp border-xp/30",
      LOOSE: "bg-gold/20 text-gold border-gold/30",
      SCRAP: "bg-scrap/20 text-scrap border-scrap/30",
    };
    return map[condition || ""] || "bg-muted text-muted-foreground";
  };

  const getRowClass = (item: InventoryItem) => {
    if (item.is_legendary) return "border-l-2 border-l-legendary bg-legendary/[3%]";
    if (item.price_spike_flag) return "border-l-2 border-l-gold bg-gold/[3%]";
    if (item.status === "SCRAP") return "border-l-2 border-l-scrap opacity-70";
    if (item.stock_count === 0) return "border-l-2 border-l-destructive opacity-60";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">
            {showScrapYard ? "⚙️ SCRAP YARD" : "📦 INVENTORY MATRIX"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} items · Total value: $
            {filtered.reduce((sum, i) => sum + i.market_value * i.stock_count, 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScrapYard(!showScrapYard)}
            className={`px-3 py-1.5 text-xs rounded border transition-all ${
              showScrapYard
                ? "bg-scrap/20 border-scrap/40 text-scrap"
                : "bg-card border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {showScrapYard ? "← Back to Matrix" : "⚙️ Scrap Yard"}
          </button>
          <button
            id="btn-scan-loot"
            className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            📸 SCAN LOOT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items, platforms, tags..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm bg-card border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
          id="input-inventory-search"
        />
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded text-foreground"
          id="select-platform-filter"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p === "ALL" ? "All Platforms" : p}
            </option>
          ))}
        </select>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value as ItemCondition | "ALL")}
          className="px-3 py-2 text-sm bg-card border border-border rounded text-foreground"
          id="select-condition-filter"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All Conditions" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card/80 border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => toggleSort("name")} className="hover:text-primary transition-colors">
                    Item {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Platform</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Condition</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => toggleSort("value")} className="hover:text-primary transition-colors">
                    Market Value {sortBy === "value" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Our Price</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                  <button onClick={() => toggleSort("stock")} className="hover:text-primary transition-colors">
                    Stock {sortBy === "stock" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-border/50 hover:bg-primary/[3%] transition-colors ${getRowClass(item)}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.is_legendary && <span className="text-xs" title="Legendary">💎</span>}
                      {item.price_spike_flag && (
                        <span className="text-xs animate-spike-flash" title="Price Spike!">⚠️</span>
                      )}
                      <span className={`font-medium ${item.is_legendary ? "text-legendary" : "text-foreground"}`}>
                        {item.item_name}
                      </span>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{item.platform || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${getConditionBadge(item.condition)}`}>
                      {item.condition || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={item.is_legendary ? "text-legendary font-bold" : "text-gold"}>
                      ${item.market_value.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground/70">
                    {item.our_price ? `$${item.our_price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold ${
                        item.stock_count === 0
                          ? "text-destructive"
                          : item.stock_count <= 1
                          ? "text-gold"
                          : "text-primary"
                      }`}
                    >
                      {item.stock_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded ${
                        item.status === "ACTIVE"
                          ? "bg-primary/10 text-primary"
                          : item.status === "SCRAP"
                          ? "bg-scrap/20 text-scrap"
                          : item.status === "SOLD"
                          ? "bg-gold/20 text-gold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <p className="text-lg mb-1">📭</p>
                    <p>No loot found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
