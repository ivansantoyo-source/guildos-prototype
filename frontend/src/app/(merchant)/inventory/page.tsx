"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { InventoryItem, ItemCondition } from "@/lib/types";

const PLATFORMS = ["ALL", "SNES", "NES", "N64", "GENESIS", "PS1", "PS2", "SATURN", "DREAMCAST", "GAMECUBE", "GBA"];
const CONDITIONS: (ItemCondition | "ALL")[] = ["ALL", "NEW", "CIB", "LOOSE", "SCRAP"];
const ITEMS_PER_PAGE = 20;

const conditionBadge = (condition?: string) => {
  const map: Record<string, string> = {
    NEW: "bg-primary/20 text-primary border-primary/30",
    CIB: "bg-xp/20 text-xp border-xp/30",
    LOOSE: "bg-gold/20 text-gold border-gold/30",
    SCRAP: "bg-scrap/20 text-scrap border-scrap/30",
  };
  return map[condition || ""] || "bg-muted text-muted-foreground";
};

const rowClass = (item: InventoryItem) => {
  if (item.is_legendary) return "border-l-2 border-l-legendary bg-legendary/[3%]";
  if (item.price_spike_flag) return "border-l-2 border-l-gold bg-gold/[3%]";
  if (item.status === "SCRAP") return "border-l-2 border-l-scrap opacity-70";
  if (item.stock_count === 0) return "border-l-2 border-l-destructive opacity-60";
  return "";
};

// ============================================================
// ITEM IMAGE PLACEHOLDER
// ============================================================
function ItemImagePlaceholder({ name, platform }: { name: string; platform?: string }) {
  const hue = platform ? platform.length * 37 : 145;
  return (
    <div
      className="w-full aspect-square rounded-lg flex items-center justify-center text-3xl"
      style={{ backgroundColor: `oklch(0.2 0.05 ${hue % 360})` }}
    >
      🎮
    </div>
  );
}

// ============================================================
// DETAIL SLIDEOVER
// ============================================================
function ItemDetailSlideover({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const updateInventoryItem = useGuildStore((s) => s.updateInventoryItem);
  const [editPrice, setEditPrice] = useState(item.our_price?.toString() || "");
  const [editCondition, setEditCondition] = useState(item.condition || "");
  const [editStock, setEditStock] = useState(item.stock_count.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateInventoryItem(item.id, {
        our_price: parseFloat(editPrice) || undefined,
        condition: (editCondition as ItemCondition) || undefined,
        stock_count: parseInt(editStock, 10) || 0,
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  // Phantom price history data
  const priceHistory = useMemo(() => {
    const base = item.market_value;
    const points = [];
    for (let i = 30; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * base * 0.3;
      points.push({ date: new Date(Date.now() - i * 86400000).toLocaleDateString(), value: Math.max(base + variance, 1) });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{item.item_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{item.platform || "No platform"} · {item.id}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary text-lg">✕</button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background/50 rounded p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Market</p>
              <p className={`text-sm font-mono font-bold mt-1 ${item.is_legendary ? "text-legendary" : "text-gold"}`}>
                ${item.market_value.toFixed(2)}
              </p>
            </div>
            <div className="bg-background/50 rounded p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Our Price</p>
              <p className="text-sm font-mono font-bold mt-1 text-primary">
                {item.our_price ? `$${item.our_price.toFixed(2)}` : "—"}
              </p>
            </div>
            <div className="bg-background/50 rounded p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Stock</p>
              <p className={`text-sm font-mono font-bold mt-1 ${item.stock_count === 0 ? "text-destructive" : "text-primary"}`}>
                {item.stock_count}
              </p>
            </div>
          </div>

          {/* Status & Condition */}
          <div className="flex gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded border ${conditionBadge(item.condition)}`}>
              {item.condition || "—"}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded ${
              item.status === "ACTIVE" ? "bg-primary/10 text-primary" :
              item.status === "SOLD" ? "bg-gold/20 text-gold" :
              item.status === "SCRAP" ? "bg-scrap/20 text-scrap" :
              "bg-muted text-muted-foreground"
            }`}>
              {item.status}
            </span>
            {item.is_legendary && <span className="text-[11px] px-2 py-0.5 rounded bg-legendary/20 text-legendary font-bold">💎 LEGENDARY</span>}
            {item.price_spike_flag && <span className="text-[11px] px-2 py-0.5 rounded bg-gold/20 text-gold font-bold animate-spike-flash">📈 SPIKE</span>}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}

          {/* Price History Chart */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Price History (30 days)</h3>
            <div className="bg-background/50 rounded p-3">
              <svg viewBox="0 0 300 80" className="w-full h-20">
                <defs>
                  <linearGradient id="price-hist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="oklch(0.78 0.2 145)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <polygon
                  points={priceHistory.map((p, i) => {
                    const x = (i / (priceHistory.length - 1)) * 300;
                    const min = Math.min(...priceHistory.map((pp) => pp.value));
                    const max = Math.max(...priceHistory.map((pp) => pp.value));
                    const range = max - min || 1;
                    const y = 80 - ((p.value - min) / range) * 72 - 4;
                    return `${x},${y}`;
                  }).join(" ") + ` 300,80 0,80`}
                  fill="url(#price-hist)"
                />
                <polyline
                  points={priceHistory.map((p, i) => {
                    const x = (i / (priceHistory.length - 1)) * 300;
                    const min = Math.min(...priceHistory.map((pp) => pp.value));
                    const max = Math.max(...priceHistory.map((pp) => pp.value));
                    const range = max - min || 1;
                    const y = 80 - ((p.value - min) / range) * 72 - 4;
                    return `${x},${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="oklch(0.78 0.2 145)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Edit Form */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Edit</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Our Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Condition</label>
                <select
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground"
                >
                  <option value="">—</option>
                  <option value="NEW">NEW</option>
                  <option value="CIB">CIB</option>
                  <option value="LOOSE">LOOSE</option>
                  <option value="SCRAP">SCRAP</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`mt-3 w-full py-2 text-xs rounded font-bold transition-all ${
                saved
                  ? "bg-xp/20 text-xp border border-xp/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {saving ? "Saving..." : saved ? "✓ SAVED" : "SAVE CHANGES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCAN LOOT MODAL
// ============================================================
function ScanLootModal({ onClose }: { onClose: () => void }) {
  const addInventoryItem = useGuildStore((s) => s.addInventoryItem);
  const [dragOver, setDragOver] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoFill, setAutoFill] = useState({
    item_name: "",
    platform: "",
    condition: "LOOSE" as ItemCondition,
    market_value: 0,
  });
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setScanning(true);
    setTimeout(() => {
      setAutoFill({
        item_name: "Mega Man X2",
        platform: "SNES",
        condition: "LOOSE",
        market_value: 120.00,
      });
      setScanned(true);
      setScanning(false);
    }, 1500);
  };

  const handleAdd = () => {
    if (!autoFill.item_name) return;
    addInventoryItem({
      id: `inv-${Date.now()}`,
      organization_id: "demo-time-warp-001",
      item_name: autoFill.item_name,
      platform: autoFill.platform || undefined,
      condition: autoFill.condition,
      market_value: autoFill.market_value,
      our_price: undefined,
      scrap_value: 0,
      stock_count: 1,
      is_legendary: autoFill.market_value >= 150,
      price_spike_flag: false,
      tags: [],
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-primary">📸 SCAN LOOT</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">✕</button>
        </div>

        {/* Drop Zone */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragOver ? "border-primary bg-primary/10" : scanned ? "border-xp bg-xp/10" : "border-border"
          }`}
        >
          {scanning ? (
            <div className="space-y-3">
              <span className="text-4xl block animate-spin">🔍</span>
              <p className="text-xs text-muted-foreground">AI analyzing image...</p>
            </div>
          ) : scanned ? (
            <div className="space-y-2">
              <span className="text-4xl block">✅</span>
              <p className="text-xs text-xp font-bold">Image scanned successfully!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-4xl block">📸</span>
              <p className="text-xs text-muted-foreground">
                Drag & drop an image here, or click to browse
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Supports: JPG, PNG, WEBP · Max 10MB
              </p>
            </div>
          )}
        </div>

        {/* Auto-fill Results */}
        {scanned && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] text-primary font-bold">AI SUGGESTED DATA</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Item Name</label>
                <input
                  type="text"
                  value={autoFill.item_name}
                  onChange={(e) => setAutoFill((p) => ({ ...p, item_name: e.target.value }))}
                  className="mt-0.5 w-full px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Platform</label>
                <input
                  type="text"
                  value={autoFill.platform}
                  onChange={(e) => setAutoFill((p) => ({ ...p, platform: e.target.value }))}
                  className="mt-0.5 w-full px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Condition</label>
                <select
                  value={autoFill.condition}
                  onChange={(e) => setAutoFill((p) => ({ ...p, condition: e.target.value as ItemCondition }))}
                  className="mt-0.5 w-full px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground"
                >
                  <option value="NEW">NEW</option>
                  <option value="CIB">CIB</option>
                  <option value="LOOSE">LOOSE</option>
                  <option value="SCRAP">SCRAP</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Est. Market Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={autoFill.market_value}
                  onChange={(e) => setAutoFill((p) => ({ ...p, market_value: parseFloat(e.target.value) || 0 }))}
                  className="mt-0.5 w-full px-2 py-1.5 text-xs bg-background border border-border rounded guild-input text-foreground"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              + ADD TO INVENTORY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// INLINE PRICE EDITOR
// ============================================================
function InlinePriceEditor({ item, onSave }: { item: InventoryItem; onSave: (price: number) => void }) {
  const [val, setVal] = useState(item.our_price?.toString() || "");
  const [editing, setEditing] = useState(false);
  return editing ? (
    <div className="flex items-center gap-1">
      <input
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave(parseFloat(val) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(parseFloat(val) || 0); setEditing(false); } }}
        className="w-20 px-1 py-0.5 text-xs bg-background border border-border rounded text-right font-mono"
        autoFocus
      />
    </div>
  ) : (
    <button onClick={() => setEditing(true)} className="hover:text-primary transition-colors">
      {item.our_price ? `$${item.our_price.toFixed(2)}` : "—"}
    </button>
  );
}

// ============================================================
// MAIN INVENTORY PAGE
// ============================================================
export default function InventoryPage() {
  const inventory = useGuildStore((s) => s.inventory);
  const updateInventoryItem = useGuildStore((s) => s.updateInventoryItem);
  const removeInventoryItem = useGuildStore((s) => s.removeInventoryItem);
  const batchUpdateInventoryItems = useGuildStore((s) => s.batchUpdateInventoryItems);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState<ItemCondition | "ALL">("ALL");
  const [showScrapYard, setShowScrapYard] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "value" | "stock">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showScanModal, setShowScanModal] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLegendaryOnly, setShowLegendaryOnly] = useState(false);
  const [showSpikeOnly, setShowSpikeOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Compute all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    inventory.forEach((i) => i.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [inventory]);

  // Filter + Sort + Paginate
  const filtered = useMemo(() => {
    let items = [...inventory];

    // Scrap yard toggle
    if (showScrapYard) {
      items = items.filter((i) => i.status === "SCRAP" || i.condition === "SCRAP");
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) => i.item_name.toLowerCase().includes(q) || i.platform?.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Platform filter
    if (platformFilter !== "ALL") items = items.filter((i) => i.platform === platformFilter);

    // Condition filter
    if (conditionFilter !== "ALL") items = items.filter((i) => i.condition === conditionFilter);

    // Legendary only
    if (showLegendaryOnly) items = items.filter((i) => i.is_legendary);

    // Price spike only
    if (showSpikeOnly) items = items.filter((i) => i.price_spike_flag);

    // Price range
    items = items.filter((i) => i.market_value >= priceRange[0] && i.market_value <= priceRange[1]);

    // Tag filter
    if (selectedTags.size > 0) {
      items = items.filter((i) => i.tags.some((t) => selectedTags.has(t)));
    }

    // Sort
    items.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.item_name.localeCompare(b.item_name) * dir;
      if (sortBy === "value") return (a.market_value - b.market_value) * dir;
      if (sortBy === "stock") return (a.stock_count - b.stock_count) * dir;
      return 0;
    });

    return items;
  }, [inventory, search, platformFilter, conditionFilter, showScrapYard, sortBy, sortDir, showLegendaryOnly, showSpikeOnly, priceRange, selectedTags]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, platformFilter, conditionFilter, showLegendaryOnly, showSpikeOnly, selectedTags, priceRange, showScrapYard]);

  const toggleSort = (col: "name" | "value" | "stock") => {
    if (sortBy === col) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortBy(col); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => removeInventoryItem(id));
    setSelectedIds(new Set());
  };

  const handleBatchSold = () => {
    batchUpdateInventoryItems(Array.from(selectedIds), { status: "SOLD" });
    setSelectedIds(new Set());
  };

  const handleExportCSV = useCallback(() => {
    const headers = "Item Name,Platform,Condition,Market Value,Our Price,Stock,Status,Tags\n";
    const rows = filtered.map((i) =>
      `"${i.item_name}","${i.platform || ""}","${i.condition || ""}",${i.market_value},${i.our_price ?? ""},${i.stock_count},"${i.status}","${i.tags.join(";")}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guildos-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-3">
          <div className="h-9 flex-1 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted/30 border-b border-border/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">
            {showScrapYard ? "⚙️ SCRAP YARD" : "📦 INVENTORY MATRIX"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} items · Total value: ${filtered.reduce((sum, i) => sum + i.market_value * i.stock_count, 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
            title={viewMode === "list" ? "Switch to grid view" : "Switch to list view"}
          >
            {viewMode === "list" ? "📇 Grid" : "📋 List"}
          </button>
          <button
            onClick={() => setShowScrapYard(!showScrapYard)}
            className={`px-3 py-1.5 text-xs rounded border transition-all ${
              showScrapYard ? "bg-scrap/20 border-scrap/40 text-scrap" : "bg-card border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {showScrapYard ? "← Back to Matrix" : "⚙️ Scrap Yard"}
          </button>
          {/* Export button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
            >
              📥 Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 w-36">
                <button onClick={handleExportCSV} className="w-full px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors">
                  📄 Export CSV
                </button>
                <button onClick={() => { window.print(); setShowExportMenu(false); }} className="w-full px-3 py-2 text-xs text-left text-foreground hover:bg-muted transition-colors">
                  📄 Export PDF
                </button>
              </div>
            )}
          </div>
          <button
            id="btn-scan-loot"
            onClick={() => setShowScanModal(true)}
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
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded text-foreground">
          {PLATFORMS.map((p) => (<option key={p} value={p}>{p === "ALL" ? "All Platforms" : p}</option>))}
        </select>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value as ItemCondition | "ALL")} className="px-3 py-2 text-sm bg-card border border-border rounded text-foreground">
          {CONDITIONS.map((c) => (<option key={c} value={c}>{c === "ALL" ? "All Conditions" : c}</option>))}
        </select>
        {/* Advanced Filter Toggles */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setShowLegendaryOnly(!showLegendaryOnly)}
            className={`px-2 py-1.5 text-[11px] rounded border transition-all ${
              showLegendaryOnly ? "bg-legendary/20 border-legendary/40 text-legendary font-bold" : "bg-card border-border text-muted-foreground"
            }`}
          >
            💎 Legendary
          </button>
          <button
            onClick={() => setShowSpikeOnly(!showSpikeOnly)}
            className={`px-2 py-1.5 text-[11px] rounded border transition-all ${
              showSpikeOnly ? "bg-gold/20 border-gold/40 text-gold font-bold" : "bg-card border-border text-muted-foreground"
            }`}
          >
            📈 Spike
          </button>
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">Price Range:</span>
        <input
          type="range"
          min="0"
          max="10000"
          step="10"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
          className="flex-1 max-w-xs h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        />
        <span className="text-[11px] text-gold font-mono">
          ${priceRange[0]} — ${priceRange[1]}
        </span>
      </div>

      {/* Tag Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags((prev) => {
                  const next = new Set(prev);
                  if (next.has(tag)) next.delete(tag); else next.add(tag);
                  return next;
                });
              }}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                selectedTags.has(tag)
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              #{tag.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && !showScrapYard && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-border/20">
          <span className="text-5xl block mb-4">📭</span>
          <h2 className="text-lg font-bold text-primary mb-2">No Items in Inventory</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Your inventory is empty. Scan your first item to get started.
          </p>
          <button
            onClick={() => setShowScanModal(true)}
            className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            📸 SCAN YOUR FIRST ITEM
          </button>
        </div>
      )}

      {/* Scrap Yard Empty State */}
      {filtered.length === 0 && showScrapYard && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-scrap/20">
          <span className="text-5xl block mb-4">⚙️</span>
          <h2 className="text-lg font-bold text-scrap mb-2">Scrap Yard Empty</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No items marked as SCRAP in your inventory. Items with SCRAP condition will appear here for harvesting.
          </p>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <span className="text-xs text-foreground font-bold">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              Deselect
            </button>
            <button onClick={handleBatchSold} className="px-2 py-1 text-[11px] rounded bg-gold/20 border border-gold/30 text-gold hover:bg-gold/30 transition-colors">
              Mark Sold
            </button>
            <button onClick={handleExportCSV} className="px-2 py-1 text-[11px] rounded bg-xp/20 border border-xp/30 text-xp hover:bg-xp/30 transition-colors">
              Export
            </button>
            <button onClick={handleBatchDelete} className="px-2 py-1 text-[11px] rounded bg-destructive/20 border border-destructive/30 text-destructive hover:bg-destructive/30 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* === GRID VIEW === */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setDetailItem(item)}
              className={`guild-card bg-card rounded-lg overflow-hidden cursor-pointer ${rowClass(item)}`}
            >
              <ItemImagePlaceholder name={item.item_name} platform={item.platform} />
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-1">
                  {item.is_legendary && <span className="text-xs" title="Legendary">💎</span>}
                  {item.price_spike_flag && <span className="text-xs animate-spike-flash" title="Price Spike!">⚠️</span>}
                  <p className="text-xs font-bold text-foreground truncate">{item.item_name}</p>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{item.platform || "—"}</span>
                  <span className={`font-mono font-bold ${item.is_legendary ? "text-legendary" : "text-gold"}`}>
                    ${item.market_value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${conditionBadge(item.condition)}`}>
                    {item.condition || "—"}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${item.stock_count === 0 ? "text-destructive" : "text-primary"}`}>
                    x{item.stock_count}
                  </span>
                </div>
                {/* Checkbox overlay for batch select */}
                <div className="absolute top-1 right-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-3.5 h-3.5 rounded border-border cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === LIST VIEW === */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card/80 border-b border-border">
                  <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={paginatedItems.length > 0 && selectedIds.size === paginatedItems.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-border cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort("name")} className="hover:text-primary transition-colors">Item {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}</button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Platform</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Condition</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort("value")} className="hover:text-primary transition-colors">Market Value {sortBy === "value" && (sortDir === "asc" ? "↑" : "↓")}</button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Our Price</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">
                    <button onClick={() => toggleSort("stock")} className="hover:text-primary transition-colors">Stock {sortBy === "stock" && (sortDir === "asc" ? "↑" : "↓")}</button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setDetailItem(item)}
                    className={`border-b border-border/50 hover:bg-primary/[3%] transition-colors cursor-pointer ${rowClass(item)}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-3.5 h-3.5 rounded border-border cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.is_legendary && <span className="text-xs" title="Legendary">💎</span>}
                        {item.price_spike_flag && <span className="text-xs animate-spike-flash" title="Price Spike!">⚠️</span>}
                        <span className={`font-medium ${item.is_legendary ? "text-legendary" : "text-foreground"}`}>{item.item_name}</span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.platform || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${conditionBadge(item.condition)}`}>{item.condition || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={item.is_legendary ? "text-legendary font-bold" : "text-gold"}>${item.market_value.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground/70" onClick={(e) => e.stopPropagation()}>
                      <InlinePriceEditor item={item} onSave={(price) => updateInventoryItem(item.id, { our_price: price || undefined })} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold ${item.stock_count === 0 ? "text-destructive" : item.stock_count <= 1 ? "text-gold" : "text-primary"}`}>
                        {item.stock_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded ${
                        item.status === "ACTIVE" ? "bg-primary/10 text-primary" :
                        item.status === "SCRAP" ? "bg-scrap/20 text-scrap" :
                        item.status === "SOLD" ? "bg-gold/20 text-gold" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, safePage - 2);
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-7 text-xs rounded border transition-all ${
                    pageNum === safePage ? "bg-primary/20 border-primary/40 text-primary font-bold" : "border-border text-muted-foreground hover:text-primary"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Scrap Yard Grid */}
      {showScrapYard && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="guild-card bg-card rounded-lg p-4 border-scrap/20 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground truncate">{item.item_name}</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-scrap/20 text-scrap">SCRAP</span>
              </div>
              {item.platform && <p className="text-[10px] text-muted-foreground">{item.platform}</p>}
              <div className="bg-background/50 rounded p-2 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Market Value</span>
                  <span className="text-muted-foreground font-mono">${item.market_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Scrap Value</span>
                  <span className="text-scrap font-mono font-bold">${item.scrap_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Harvestable</span>
                  <span className="text-xp font-mono">{item.scrap_value > 0 ? "✅ YES" : "❌ NO"}</span>
                </div>
              </div>
              <div className="relative group flex items-center justify-center">
                {item.scrap_value > 0 && (
                  <button className="w-full py-1.5 text-[10px] rounded bg-scrap/10 border border-scrap/30 text-scrap hover:bg-scrap/20 transition-colors">
                    ⚙️ HARVEST COMPONENTS
                  </button>
                )}
                {item.scrap_value === 0 && (
                  <div className="w-full py-1.5 text-[10px] rounded bg-muted/20 border border-muted/30 text-muted-foreground text-center cursor-help">
                    🚫 No harvest value
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan Loot Modal */}
      {showScanModal && <ScanLootModal onClose={() => setShowScanModal(false)} />}

      {/* Item Detail Slideover */}
      {detailItem && <ItemDetailSlideover item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}
