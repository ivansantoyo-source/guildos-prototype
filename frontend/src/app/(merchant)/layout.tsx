"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { pageTransition, floatButton, sidebarItem } from "@/lib/animations";
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
import { playClick } from "@/lib/audio/sounds";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⚔️", id: "dashboard" },
  { href: "/inventory", label: "Inventory Matrix", icon: "📦", id: "inventory" },
  { href: "/bounty-board", label: "Quest Board", icon: "📜", id: "bounty-board" },
  { href: "/nexus", label: "The Nexus", icon: "🏟️", id: "nexus" },
  { href: "/shopkeeper", label: "Shopkeeper AI", icon: "🤖", id: "shopkeeper" },
  { href: "/analytics", label: "Analytics", icon: "📊", id: "analytics" },
  { href: "/profile", label: "Profile", icon: "👤", id: "profile" },
  { href: "/settings", label: "Settings", icon: "⚙️", id: "settings" },
];

function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [];

  // Always start with Home
  crumbs.push({ label: "Home", href: "/" });

  let accumulated = "";
  for (const segment of segments) {
    // Skip the tenant segment (first segment, e.g. "demo")
    if (segment === segments[0] && segments.length > 1) continue;
    accumulated += `/${segment}`;
    const match = NAV_ITEMS.find((item) => item.href.endsWith(segment));
    const label = match?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: accumulated });
  }

  return crumbs;
}

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
  const reducedMotion = useGuildStore((s) => s.reducedMotion);

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

  const breadcrumbs = getBreadcrumbs(pathname);
  const activeNav = NAV_ITEMS.find((i) => pathname.startsWith(i.href));

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex relative bg-dot-grid-subtle">
      {/* === MOVING GRADIENT BACKGROUND === */}
      <div className="fixed inset-0 bg-gradient-move pointer-events-none -z-10" />

      {/* === SIDEBAR === */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } transition-all duration-300 ease-in-out border-r border-border flex flex-col shrink-0 relative`}
      >
        {/* Glass overlay for sidebar */}
        <div className="absolute inset-0 bg-sidebar pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar-accent/30 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-border gap-2">
            <motion.span
              className="text-xl"
              whileHover={{ scale: 1.15, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              🎮
            </motion.span>
            {!sidebarCollapsed && (
              <h1 className="text-lg font-bold">
                <span className="text-gradient-primary text-gradient-shine tracking-wider">
                  GUILD_OS
                </span>
              </h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 space-y-1 px-2">
            <AnimatePresence mode="wait">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <motion.div
                    key={item.id}
                    variants={sidebarItem}
                    initial={reducedMotion ? undefined : "initial"}
                    animate="animate"
                    custom={idx}
                  >
                    <Link
                      key={item.id}
                      href={item.href}
                      id={`nav-${item.id}`}
                      onClick={() => playClick()}
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
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-neon-pulse glow-xp" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </nav>

          {/* Demo Mode Badge */}
          {!sidebarCollapsed && demoMode && (
            <div className="mx-3 mb-3 px-3 py-2 rounded-md bg-gold/10 border border-gold/20 glass-dark">
              <p className="text-xs text-gold font-medium">⚡ DEMO MODE</p>
              <p className="text-[10px] text-gold/60 mt-0.5">Phantom data active</p>
            </div>
          )}

          {/* Collapse Toggle */}
          <motion.button
            onClick={toggleSidebar}
            className="h-12 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarCollapsed ? "»" : "«"}
          </motion.button>
        </div>
      </aside>

      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border glass-panel rounded-none flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && (
                    <span className="text-muted-foreground/40 select-none">/</span>
                  )}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-primary/80 font-medium">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-primary transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Faction Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/60 border border-border rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-faction-sega glow-faction-sega" />
              <span>Sega</span>
              <span className="mx-1">|</span>
              <span className="w-1.5 h-1.5 rounded-full bg-faction-nintendo glow-faction-nintendo" />
              <span>Nintendo</span>
              <span className="mx-1">|</span>
              <span className="w-1.5 h-1.5 rounded-full bg-faction-sony glow-faction-sony" />
              <span>Sony</span>
            </div>

            {/* Notification Bell */}
            <motion.button
              id="btn-notifications"
              className="relative text-muted-foreground hover:text-primary transition-colors"
              aria-label="Notifications"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-white rounded-full flex items-center justify-center font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Tenant Name */}
            <div className="text-xs text-muted-foreground border border-border rounded px-2 py-1 glass-dark">
              {demoMode ? "TIME_WARP_GAMING" : "GUILD"}
            </div>
          </div>
        </header>

        {/* Page Content with AnimatePresence */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageTransition}
              initial={reducedMotion ? undefined : "initial"}
              animate="animate"
              exit={reducedMotion ? undefined : "exit"}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* === QUICK-ACTION FLOATING BUTTON === */}
      <motion.button
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-40 border border-primary/30"
        variants={floatButton}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={() => playClick()}
        aria-label="Quick actions"
      >
        <motion.span
          className="text-lg"
          animate={{ rotate: 0 }}
          whileHover={{ rotate: 90 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          +
        </motion.span>
      </motion.button>

      {/* === MOBILE NAVIGATION === */}
      <MobileNav />
    </div>
  );
}
