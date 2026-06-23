"use client";

import React, { useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
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
  phantomVitalityQuests,
  phantomStations,
  phantomStationBookings,
  phantomWallets,
  phantomWalletTransactions,
  phantomPotionsMenu,
  phantomPotionOrders,
  phantomOrders,
  phantomPOSSession,
  phantomPOSTransactions,
  phantomAgentSession,
  phantomAgentMessages,
  phantomStorefrontConfig,
} from "@/mocks/phantomData";
import { playClick } from "@/lib/audio/sounds";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoBanner } from "@/components/widgets/demo-banner";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import StaminaBar from "@/components/vitality/stamina-bar";
import { calculateStamina } from "@/lib/vitality/stamina";

// Nav items — hrefs preserve demo mode param so navigation works without redirects
const BASE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⚔️", id: "dashboard" },
  { href: "/inventory", label: "Inventory Matrix", icon: "📦", id: "inventory" },
  { href: "/pos", label: "Point of Sale", icon: "💳", id: "pos" },
  { href: "/bounty-board", label: "Quest Board", icon: "📜", id: "bounty-board" },
  { href: "/nexus", label: "The Nexus", icon: "🏟️", id: "nexus" },
  { href: "/shopkeeper", label: "Shopkeeper AI", icon: "🤖", id: "shopkeeper" },
  { href: "/agent", label: "Agent AI", icon: "🧠", id: "agent" },
  { href: "/analytics", label: "Analytics", icon: "📊", id: "analytics" },
  { href: "/profile", label: "Profile", icon: "👤", id: "profile" },
  { href: "/settings", label: "Settings", icon: "⚙️", id: "settings" },
  { href: "/store", label: "🏪 View Storefront", icon: "🛒", id: "storefront" },
];

function getNavItems() {
  return BASE_NAV.map((item) => ({
    ...item,
    href: demoHref(item.href),
  }));
}

function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [];

  // Always start with Home
  crumbs.push({ label: "Home", href: demoHref("/") });

  let accumulated = "";
  for (const segment of segments) {
    // Skip the tenant segment (first segment, e.g. "demo")
    if (segment === segments[0] && segments.length > 1) continue;
    accumulated += `/${segment}`;
    const match = BASE_NAV.find((item) => item.href.endsWith(segment));
    const label = match?.label || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: demoHref(accumulated) });
  }

  return crumbs;
}

function StaminaBarWrapper() {
  const stamina = useGuildStore((s) => s.stamina);
  const maxStamina = useGuildStore((s) => s.maxStamina);
  const debuffType = useGuildStore((s) => s.debuffType);
  const debuffUntil = useGuildStore((s) => s.debuffUntil);

  return (
    <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-background/30 border border-border/30">
      <StaminaBar
        stamina={stamina}
        maxStamina={maxStamina}
        debuffType={debuffType}
        debuffUntil={debuffUntil}
      />
    </div>
  );
}

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const setDemoMode = useGuildStore((s) => s.setDemoMode);
  const sidebarCollapsed = useGuildStore((s) => s.sidebarCollapsed);
  const sidebarHidden = useGuildStore((s) => s.sidebarHidden);
  const toggleSidebar = useGuildStore((s) => s.toggleSidebar);
  const setSidebarHidden = useGuildStore((s) => s.setSidebarHidden);
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
  const setStaminaVal = useGuildStore((s) => s.setStamina);
  const setVitalityQuests = useGuildStore((s) => s.setVitalityQuests);
  const setStations = useGuildStore((s) => s.setStations);
  const setStationBookings = useGuildStore((s) => s.setStationBookings);
  const setWallet = useGuildStore((s) => s.setWallet);
  const setWalletTransactions = useGuildStore((s) => s.setWalletTransactions);
  const setPotionsMenu = useGuildStore((s) => s.setPotionsMenu);
  const setPotionOrders = useGuildStore((s) => s.setPotionOrders);
  const setCustomerOrders = useGuildStore((s) => s.setCustomerOrders);
  const setPOSSession = useGuildStore((s) => s.setPOSSession);
  const setAgentSession = useGuildStore((s) => s.setAgentSession);
  const setStorefrontConfig = useGuildStore((s) => s.setStorefrontConfig);

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
      setVitalityQuests(phantomVitalityQuests);
      setStations(phantomStations);
      setStationBookings(phantomStationBookings);
      setWallet(phantomWallets[0]);
      setWalletTransactions(phantomWalletTransactions);
      setPotionsMenu(phantomPotionsMenu);
      setPotionOrders(phantomPotionOrders);
      setCustomerOrders(phantomOrders);
      setPOSSession(phantomPOSSession);
      setAgentSession(phantomAgentSession);
      setStorefrontConfig(phantomStorefrontConfig);

      // Initialize demo stamina
      setStaminaVal(72);
      useGuildStore.setState({ maxStamina: 100, consecutiveHours: 1.5, lastActivityAt: new Date().toISOString() });
    }
  }, [demoMode, setInventory, setBounties, setLfgLobbies, setScoreboards, setFactionStandings, setDashboardStats, setActivityFeed, setNotifications, setVitalityQuests, setStations, setStaminaVal, setStationBookings, setWallet, setWalletTransactions, setPotionsMenu, setPotionOrders, setCustomerOrders, setPOSSession, setAgentSession, setStorefrontConfig]);

  // Stamina tick interval — recalculate every 5 minutes
  useEffect(() => {
    const tick = () => {
      const state = useGuildStore.getState();
      const newStamina = calculateStamina({
        stamina: state.stamina,
        maxStamina: state.maxStamina,
        debuffType: state.debuffType,
        debuffUntil: state.debuffUntil,
        consecutiveHours: state.consecutiveHours,
        lastActivityAt: state.lastActivityAt,
      });
      useGuildStore.setState(newStamina);
    };
    // Tick immediately on mount
    tick();
    const interval = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect ?demo=true in URL and force demo mode (client-side only, no useSearchParams)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');
    if (demoParam === 'true' && !demoMode) {
      setDemoMode(true);
      document.cookie = 'guildos_demo_mode=true; path=/; max-age=86400; SameSite=Lax';
    }
    if (demoParam === 'false' && demoMode) {
      setDemoMode(false);
      document.cookie = 'guildos_demo_mode=false; path=/; max-age=86400; SameSite=Lax';
    }
  }, [demoMode, setDemoMode]);

  // Responsive: on initial mount, collapse sidebar on screens below 1280px
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1280 && !sidebarCollapsed && !sidebarHidden) {
      toggleSidebar();
    }
  }, []); // only on mount — don't override user preference mid-session

  // Track active module from pathname
  useEffect(() => {
    const active = BASE_NAV.find((item) => pathname.startsWith(item.href));
    if (active) setActiveModule(active.id);
  }, [pathname, setActiveModule]);

  // ── Session timeout monitor ──
  const { isWarning, isExpiring, refreshSession } = useSessionTimeout();

  const breadcrumbs = getBreadcrumbs(pathname);
  const activeNav = BASE_NAV.find((i) => pathname.startsWith(i.href));

  // Cycling toggle: expanded → collapsed → hidden → expanded
  const handleToggleSidebar = useCallback(() => {
    if (sidebarHidden) {
      // hidden → expanded
      setSidebarHidden(false);
      if (sidebarCollapsed) toggleSidebar();
    } else if (sidebarCollapsed) {
      // collapsed → hidden
      setSidebarHidden(true);
    } else {
      // expanded → collapsed
      toggleSidebar();
    }
  }, [sidebarHidden, sidebarCollapsed, setSidebarHidden, toggleSidebar]);

  // Determine sidebar width class for 3-state
  const sidebarWidthClass = sidebarHidden
    ? "w-0 overflow-hidden"
    : sidebarCollapsed
      ? "w-16"
      : "w-64";

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex relative bg-dot-grid-subtle">
      {/* === MOVING GRADIENT BACKGROUND === */}
      <div className="fixed inset-0 bg-gradient-move pointer-events-none -z-10" />

      {/* === SIDEBAR === */}
      <div
        className={`${
          sidebarWidthClass
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
          <nav aria-label="Primary navigation" className="flex-1 py-4 space-y-1 px-2">
            <AnimatePresence mode="wait">
              {getNavItems().map((item, idx) => {
                const itemPath = item.href.split('?')[0];
                const isActive = pathname === itemPath || pathname.startsWith(itemPath + '/');
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
                      prefetch={['dashboard', 'inventory', 'bounty-board'].includes(item.id) ? true : undefined}
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

          {/* Stamina Bar */}
          {!sidebarCollapsed && (
            <StaminaBarWrapper />
          )}

          {/* Demo Mode Badge */}
          {!sidebarCollapsed && demoMode && (
            <div className="mx-3 mb-3 px-3 py-2 rounded-md bg-gold/10 border border-gold/20 glass-dark">
              <p className="text-xs text-gold font-medium">⚡ DEMO MODE</p>
              <p className="text-[10px] text-gold/60 mt-0.5">Phantom data active</p>
            </div>
          )}

          {/* Collapse Toggle — only shown when sidebar is visible */}
          {!sidebarHidden && (
            <motion.button
              onClick={handleToggleSidebar}
              className="h-12 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              aria-label={
                sidebarCollapsed
                  ? "Hide sidebar"
                  : "Collapse sidebar"
              }
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {sidebarCollapsed ? "»" : "«"}
            </motion.button>
          )}
        </div>
      </div>

      {/* === FLOATING HAMBURGER (shown when sidebar is fully hidden) === */}
      {sidebarHidden && (
        <motion.button
          onClick={() => {
            setSidebarHidden(false);
            if (sidebarCollapsed) toggleSidebar();
          }}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-sidebar/90 backdrop-blur-sm border border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-lg"
          aria-label="Open sidebar"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-lg">☰</span>
        </motion.button>
      )}

      {/* === MAIN CONTENT AREA === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header role="banner" className="h-16 border-b border-border glass-panel rounded-none flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

        {/* Demo Mode Banner — interactive tour for potential customers */}
        <DemoBanner />

        {/* Session Expiry Warning Banner */}
        {isWarning && (
          <div
            onClick={() => refreshSession()}
            className="cursor-pointer border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-sm"
          >
            <div className="px-6 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
              <span className={`inline-block w-2 h-2 rounded-full bg-amber-400 ${isExpiring ? "animate-ping" : "animate-pulse"}`} />
              <span>
                {isExpiring
                  ? "Session expiring in under 1 minute — click to extend"
                  : "Session expiring soon — click to extend"}
              </span>
            </div>
          </div>
        )}

        {/* Page Content with AnimatePresence */}
        <main id="main-content" role="main" className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageTransition}
              initial={reducedMotion ? undefined : "initial"}
              animate="animate"
              exit={reducedMotion ? undefined : "exit"}
            >
              <RealtimeProvider>{children}</RealtimeProvider>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* === FLOATING CART BUTTON === */}
      <motion.a
        href={demoHref('/potions')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[var(--neon-primary)] text-black rounded-full flex items-center justify-center shadow-lg z-40 border border-[var(--neon-primary)]/30"
        variants={floatButton}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        aria-label="Potions &#x26; Provisions"
      >
        <motion.span
          className="text-lg"
          animate={{ rotate: 0 }}
          whileHover={{ rotate: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          🛒
        </motion.span>
      </motion.a>

      {/* === MOBILE NAVIGATION === */}
      <MobileNav />
    </div>
  );
}
