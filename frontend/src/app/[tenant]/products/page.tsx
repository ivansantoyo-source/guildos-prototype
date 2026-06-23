"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { pageTransition, listContainer, listItemStagger } from "@/lib/animations";
import StoreNav from "@/components/storefront/StoreNav";
import ProductCard from "@/components/storefront/ProductCard";
import type { InventoryItem, ItemCondition } from "@/lib/types";

// ============================================================
// CONSTANTS
// ============================================================
const PLATFORMS = ["ALL", "SNES", "NES", "N64", "GENESIS", "PS1", "PS2", "SATURN", "DREAMCAST", "GAMECUBE", "GBA"];
const CONDITIONS: (ItemCondition | "ALL")[] = ["ALL", "NEW", "CIB", "LOOSE", "SCRAP"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
];
const ITEMS_PER_PAGE = 12;

// ============================================================
// FILTER SIDEBAR
// ============================================================
function FilterSidebar({
  platformFilter,
  setPlatformFilter,
  conditionFilter,
  setConditionFilter,
  showLegendaryOnly,
  setShowLegendaryOnly,
  showSpikeOnly,
  setShowSpikeOnly,
  priceRange,
  setPriceRange,
  selectedTags,
  setSelectedTags,
  allTags,
  hasActiveFilters,
  clearFilters,
}: {
  platformFilter: string;
  setPlatformFilter: (v: string) => void;
  conditionFilter: ItemCondition | "ALL";
  setConditionFilter: (v: ItemCondition | "ALL") => void;
  showLegendaryOnly: boolean;
  setShowLegendaryOnly: (v: boolean) => void;
  showSpikeOnly: boolean;
  setShowSpikeOnly: (v: boolean) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  selectedTags: Set<string>;
  setSelectedTags: (v: Set<string>) => void;
  allTags: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Platform */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Platform</h3>
        <div className="flex flex-wrap gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`text-[10px] px-2 py-1 rounded border transition-all ${
                platformFilter === p
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {p === "ALL" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Condition</h3>
        <div className="flex flex-wrap gap-1">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => setConditionFilter(c)}
              className={`text-[10px] px-2 py-1 rounded border transition-all ${
                conditionFilter === c
                  ? "bg-primary/20 border-primary/40 text-primary font-bold"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {c === "ALL" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowLegendaryOnly(!showLegendaryOnly)}
          className={`flex-1 text-[10px] px-2 py-1.5 rounded border transition-all ${
            showLegendaryOnly
              ? "bg-legendary/20 border-legendary/40 text-legendary font-bold"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          💎 Legendary
        </button>
        <button
          onClick={() => setShowSpikeOnly(!showSpikeOnly)}
          className={`flex-1 text-[10px] px-2 py-1.5 rounded border transition-all ${
            showSpikeOnly
              ? "bg-gold/20 border-gold/40 text-gold font-bold"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          📈 Spike
        </button>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Price Range: ${priceRange[0]} — ${priceRange[1]}
        </h3>
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
          className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const next = new Set(selectedTags);
                  if (next.has(tag)) next.delete(tag);
                  else next.add(tag);
                  setSelectedTags(next);
                }}
                className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${
                  selectedTags.has(tag)
                    ? "bg-primary/20 border-primary/40 text-primary font-bold"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                #{tag.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 text-[11px] rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
        >
          ✕ Clear All Filters
        </button>
      )}
    </div>
  );
}

// ============================================================
// PRODUCTS PAGE CONTENT (wrapped for search params)
// ============================================================
function ProductsPageContent({ params }: { params: { tenant: string } }) {
  const searchParams = useSearchParams();
  const tenant = params.tenant;
  const storeName = tenant.replace(/-/g, " ");

  const inventory = useGuildStore((s) => s.inventory);
  const addToCartAction = useGuildStore((s) => s.addToCart);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") || "ALL");
  const [conditionFilter, setConditionFilter] = useState<ItemCondition | "ALL">("ALL");
  const [showLegendaryOnly, setShowLegendaryOnly] = useState(false);
  const [showSpikeOnly, setShowSpikeOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Compute all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    inventory.forEach((i) => i.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [inventory]);

  // Determine whether any non-default filter is active
  const hasActiveFilters = useMemo(() => {
    return search !== ""
      || platformFilter !== "ALL"
      || conditionFilter !== "ALL"
      || showLegendaryOnly
      || showSpikeOnly
      || priceRange[1] < 1000
      || selectedTags.size > 0;
  }, [search, platformFilter, conditionFilter, showLegendaryOnly, showSpikeOnly, priceRange, selectedTags]);

  // Filter + Sort + Paginate
  const filtered = useMemo(() => {
    let items = inventory.filter((i) => i.status === "ACTIVE");

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(q) ||
          i.platform?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Platform
    if (platformFilter !== "ALL") items = items.filter((i) => i.platform === platformFilter);
    // Condition
    if (conditionFilter !== "ALL") items = items.filter((i) => i.condition === conditionFilter);
    // Legendary
    if (showLegendaryOnly) items = items.filter((i) => i.is_legendary);
    // Spike
    if (showSpikeOnly) items = items.filter((i) => i.price_spike_flag);
    // Price range
    items = items.filter((i) => (i.our_price || i.market_value) >= priceRange[0] && (i.our_price || i.market_value) <= priceRange[1]);
    // Tags
    if (selectedTags.size > 0) {
      items = items.filter((i) => i.tags.some((t) => selectedTags.has(t)));
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        items.sort((a, b) => (a.our_price || a.market_value) - (b.our_price || b.market_value));
        break;
      case "price-desc":
        items.sort((a, b) => (b.our_price || b.market_value) - (a.our_price || a.market_value));
        break;
      case "name-asc":
        items.sort((a, b) => a.item_name.localeCompare(b.item_name));
        break;
      case "name-desc":
        items.sort((a, b) => b.item_name.localeCompare(a.item_name));
        break;
      case "newest":
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return items;
  }, [inventory, search, platformFilter, conditionFilter, showLegendaryOnly, showSpikeOnly, priceRange, selectedTags, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, platformFilter, conditionFilter, showLegendaryOnly, showSpikeOnly, selectedTags, priceRange, sortBy]);

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

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("ALL");
    setConditionFilter("ALL");
    setShowLegendaryOnly(false);
    setShowSpikeOnly(false);
    setPriceRange([0, 1000]);
    setSelectedTags(new Set());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StoreNav tenant={tenant} storeName={storeName} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-10 bg-card/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-card/50 rounded-xl animate-pulse" />
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow-green">📦 Product Catalog</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? "item" : "items"} available
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar (desktop) */}
          <aside className="hidden lg:block space-y-6">
            <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-4">
              <FilterSidebar
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                conditionFilter={conditionFilter}
                setConditionFilter={setConditionFilter}
                showLegendaryOnly={showLegendaryOnly}
                setShowLegendaryOnly={setShowLegendaryOnly}
                showSpikeOnly={showSpikeOnly}
                setShowSpikeOnly={setShowSpikeOnly}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                allTags={allTags}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search + Sort + Mobile Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items, platforms, tags..."
                  className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl guild-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 text-xs bg-card border border-border rounded-xl guild-input text-foreground"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Mobile filter chips */}
            <div className="flex lg:hidden flex-wrap gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="text-[11px] px-2 py-1.5 bg-card border border-border rounded-lg text-foreground"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p === "ALL" ? "All Platforms" : p}</option>
                ))}
              </select>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value as ItemCondition | "ALL")}
                className="text-[11px] px-2 py-1.5 bg-card border border-border rounded-lg text-foreground"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c === "ALL" ? "All Conditions" : c}</option>
                ))}
              </select>
              <button
                onClick={() => setShowLegendaryOnly(!showLegendaryOnly)}
                className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all ${
                  showLegendaryOnly
                    ? "bg-legendary/20 border-legendary/40 text-legendary font-bold"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                💎 Legendary
              </button>
              <button
                onClick={() => setShowSpikeOnly(!showSpikeOnly)}
                className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all ${
                  showSpikeOnly
                    ? "bg-gold/20 border-gold/40 text-gold font-bold"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                📈 Spike
              </button>
            </div>

            {/* Product Grid */}
            {paginatedItems.length === 0 ? (
              <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl p-12 text-center">
                <span className="text-5xl block mb-4">🔍</span>
                <h2 className="text-lg font-bold text-foreground mb-2">No Items Found</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  No items match your search. Try a different filter or check back soon!
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {paginatedItems.map((item, idx) => (
                  <motion.div key={item.id} variants={listItemStagger} custom={idx}>
                    <ProductCard item={item} onAddToCart={handleAddToCart} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
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
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// WRAPPER — Suspense boundary for useSearchParams()
// ============================================================
export default function ProductsPage(props: { params: { tenant: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-10 bg-card/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-card/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsPageContent params={props.params} />
    </Suspense>
  );
}
