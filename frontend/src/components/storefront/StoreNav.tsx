"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import { badgePop } from "@/lib/animations";
import CartDrawer from "@/components/storefront/CartDrawer";

// ============================================================
// STORE NAV — Customer-facing navigation header
// ============================================================
interface StoreNavProps {
  tenant: string;
  storeName?: string;
}

export default function StoreNav({ tenant, storeName }: StoreNavProps) {
  const pathname = usePathname();
  const cart = useGuildStore((s) => s.cart);
  const storefrontConfig = useGuildStore((s) => s.storefrontConfig);
  const reducedMotion = useGuildStore((s) => s.reducedMotion);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = storeName || storefrontConfig?.store_name || tenant.replace(/-/g, " ");

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [cart]
  );

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: demoHref("/products"), label: "Browse", icon: "📦" },
    { href: demoHref("/orders"), label: "Orders", icon: "📋" },
    { href: demoHref("/account"), label: "Account", icon: "👤" },
    { href: demoHref("/chat"), label: "AI Chat", icon: "🤖" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
              {/* Store name / Home link */}
              <Link
                href={demoHref("/")}
                className="flex items-center gap-2 group"
              >
                <span className="text-xl">🎮</span>
                <h1 className="text-sm font-bold hidden sm:block">
                  <span className="text-gradient-primary text-gradient-shine tracking-wider">
                    {displayName}
                  </span>
                </h1>
              </Link>

              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-1" aria-label="Store navigation">
                {navLinks.map((link) => {
                  const linkPath = link.href.split("?")[0];
                  const isActive = pathname === linkPath || pathname.startsWith(linkPath + "/");
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Cart + Mobile menu */}
            <div className="flex items-center gap-3">
              {/* Cart button */}
              <motion.button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Shopping cart with ${itemCount} items`}
              >
                <span className="text-base">🛒</span>
                <span className="hidden sm:inline text-xs">Cart</span>
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key="cart-badge"
                      variants={badgePop}
                      initial={reducedMotion ? undefined : "initial"}
                      animate="animate"
                      exit="exit"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] text-primary-foreground rounded-full flex items-center justify-center font-bold"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 overflow-hidden"
            >
              <nav className="px-4 py-3 space-y-1" aria-label="Mobile store navigation">
                <Link
                  href={demoHref("/")}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
                {navLinks.map((link) => {
                  const linkPath = link.href.split("?")[0];
                  const isActive = pathname === linkPath;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
