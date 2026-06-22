"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuildStore } from "@/lib/store/useGuildStore";
import {
  phantomInventory,
  phantomBounties,
  phantomLfgs,
  phantomScoreboards,
  phantomSaveRooms,
  phantomFactionStandings,
  phantomDashboardStats,
  phantomActivity,
  phantomNotifications,
} from "@/mocks/phantomData";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⚔️", id: "dashboard" },
  { href: "/inventory", label: "Inventory Matrix", icon: "📦", id: "inventory" },
  { href: "/bounty-board", label: "Quest Board", icon: "📜", id: "bounty-board" },
  { href: "/nexus", label: "The Nexus", icon: "🏟️", id: "nexus" },
  { href: "/shopkeeper", label: "Shopkeeper AI", icon: "🤖", id: "shopkeeper" },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sidebarCollapsed = useGuildStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useGuildStore((s) => s.toggleSidebar);
  const setActiveModule = useGuildStore((s) => s.setActiveModule);
  const demoMode = useGuildStore((s) => s.demoMode);
  const notifications = useGuildStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Load phantom data in demo mode
  const setInventory = useGuildStore((s) => s.setInventory);
  const setBounties = useGuildStore((s) => s.setBounties);
  const setLfgLobbies = useGuildStore((s) => s.setLfgLobbies);
  const setScoreboards = useGuildStore((s) => s.setScoreboards);
  const setSaveRooms = useGuildStore((s) => s.setSaveRooms);
  const setFactionStandings = useGuildStore((s) => s.setFactionStandings);
  const setDashboardStats = useGuildStore((s) => s.setDashboardStats);
  const setActivityFeed = useGuildStore((s) => s.setActivityFeed);
  const setNotifications = useGuildStore((s) => s.setNotifications);

  useEffect(() => {
    if (demoMode) {
      setInventory(phantomInventory);
      setBounties(phantomBounties);
      setLfgLobbies(phantomLfgs);
      setScoreboards(phantomScoreboards);
      setSaveRooms(phantomSaveRooms);
      setFactionStandings(phantomFactionStandings);
      setDashboardStats(phantomDashboardStats);
      setActivityFeed(phantomActivity);
      setNotifications(phantomNotifications);
    }
  }, [demoMode, setInventory, setBounties, setLfgLobbies, setScoreboards, setFactionStandings, setDashboardStats, setActivityFeed, setNotifications]);

  // Track active module from pathname
  useEffect(() => {
    const active = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    if (active) setActiveModule(active.id);
  }, [pathname, setActiveModule]);

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex">
      {/* === SIDEBAR === */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } transition-all duration-300 ease-in-out border-r border-border bg-sidebar flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <span className="text-xl">🎮</span>
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold text-primary text-glow-green tracking-wider">
              GUILD_OS
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                id={`nav-${item.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-sidebar-accent text-primary border border-primary/20 shadow-[0_0_10px_oklch(0.78_0.2_145/10%)]"
                    : "text-sidebar-foreground/60 hover:text-primary hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-neon-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Demo Mode Badge */}
        {!sidebarCollapsed && demoMode && (
          <div className="mx-3 mb-3 px-3 py-2 rounded-md bg-gold/10 border border-gold/20">
            <p className="text-xs text-gold font-medium">⚡ DEMO MODE</p>
            <p className="text-[10px] text-gold/60 mt-0.5">Phantom data active</p>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="h-12 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "»" : "«"}
        </button>
      </aside>

      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.label ||
                "Terminal"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              id="btn-notifications"
              className="relative text-muted-foreground hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-white rounded-full flex items-center justify-center font-bold animate-neon-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Tenant Name */}
            <div className="text-xs text-muted-foreground border border-border rounded px-2 py-1">
              {demoMode ? "TIME_WARP_GAMING" : "GUILD"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
