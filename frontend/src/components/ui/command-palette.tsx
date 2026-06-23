"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGuildStore } from "@/lib/store/useGuildStore";

interface CommandItem {
  id: string;
  group: string;
  icon: string;
  title: string;
  subtitle?: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const inventory = useGuildStore((s) => s.inventory);
  const bounties = useGuildStore((s) => s.bounties);
  const demoMode = useGuildStore((s) => s.demoMode);
  const demo = demoMode ? "?demo=true" : "";

  // Build command list
  const commands = useMemo((): CommandItem[] => {
    const nav: CommandItem[] = [
      { id: "nav-dashboard", group: "Navigate", icon: "⚔️", title: "Dashboard", subtitle: "RPG Admin Console", action: () => router.push(`/dashboard${demo}`) },
      { id: "nav-inventory", group: "Navigate", icon: "📦", title: "Inventory Matrix", subtitle: "Loot Scanner", action: () => router.push(`/inventory${demo}`) },
      { id: "nav-bounties", group: "Navigate", icon: "📜", title: "Bounty Board", subtitle: "Quest Board", action: () => router.push(`/bounty-board${demo}`) },
      { id: "nav-nexus", group: "Navigate", icon: "🏟️", title: "The Nexus", subtitle: "LFG + Scores + Rooms", action: () => router.push(`/nexus${demo}`) },
      { id: "nav-shopkeeper", group: "Navigate", icon: "🤖", title: "AI Shopkeeper", subtitle: "DeepSeek-V3 Assistant", action: () => router.push(`/shopkeeper${demo}`) },
      { id: "nav-analytics", group: "Navigate", icon: "📊", title: "Analytics", subtitle: "Business Intelligence", action: () => router.push(`/analytics${demo}`) },
    ];

    const actions: CommandItem[] = [
      { id: "act-scan", group: "Quick Actions", icon: "📸", title: "Scan New Item", subtitle: "Add inventory via camera", action: () => router.push(`/inventory${demo}`) },
      { id: "act-bounty", group: "Quick Actions", icon: "📌", title: "Post Bounty", subtitle: "Create new quest", action: () => router.push(`/bounty-board${demo}`) },
      { id: "act-lobby", group: "Quick Actions", icon: "🎮", title: "Create Lobby", subtitle: "Host a gaming session", action: () => router.push(`/nexus${demo}`) },
      { id: "act-chat", group: "Quick Actions", icon: "💬", title: "Ask Shopkeeper", subtitle: "AI-powered recommendations", action: () => router.push(`/shopkeeper${demo}`) },
      { id: "act-mode", group: "Quick Actions", icon: "🔄", title: "Toggle Demo Mode", subtitle: "Switch between demo and production", action: () => useGuildStore.getState().setDemoMode(!useGuildStore.getState().demoMode) },
    ];

    const invItems: CommandItem[] = inventory.slice(0, 10).map((item) => ({
      id: `inv-${item.id}`,
      group: "Inventory",
      icon: item.is_legendary ? "💎" : "🎮",
      title: item.item_name,
      subtitle: `${item.platform ?? ""} — $${item.market_value}`,
      action: () => router.push(`/inventory${demo}`),
    }));

    const bountyItems: CommandItem[] = bounties.filter((b) => b.status === "ACTIVE").slice(0, 5).map((b) => ({
      id: `bty-${b.id}`,
      group: "Active Bounties",
      icon: "📜",
      title: b.target_item_name,
      subtitle: `Reward: $${b.store_credit_value.toFixed(2)}`,
      action: () => router.push(`/bounty-board${demo}`),
    }));

    return [...nav, ...actions, ...invItems, ...bountyItems];
  }, [inventory, bounties, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIdx(0);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIdx]) {
          filtered[selectedIdx].action();
          setOpen(false);
        }
      }
    },
    [filtered, selectedIdx]
  );

  if (!open) return null;

  // Group commands
  const grouped: Record<string, CommandItem[]> = {};
  filtered.forEach((c) => {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-primary/30 rounded-xl shadow-[0_0_60px_rgba(120,200,80,0.1)] overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, inventory, bounties..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p className="text-lg mb-1">🔮</p>
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1.5 font-medium">{group}</p>
              {items.map((item) => {
                const globalIdx = filtered.indexOf(item);
                const isSelected = globalIdx === selectedIdx;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); setOpen(false); }}
                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all text-sm ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "text-foreground/80 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.subtitle && <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>}
                    </div>
                    {isSelected && <span className="text-[10px] text-primary">↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
