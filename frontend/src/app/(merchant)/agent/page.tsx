"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { demoHref } from "@/lib/utils/url";
import AgentChat from "@/components/ai/AgentChat";
import { phantomAgentSession } from "@/mocks/phantomData";
import type { AgentSession } from "@/lib/types";

// ============================================================================
// SESSION CARD — Summary of current store context
// ============================================================================

function StoreContextPanel() {
  const inventory = useGuildStore((s) => s.inventory);
  const bounties = useGuildStore((s) => s.bounties);
  const customerOrders = useGuildStore((s) => s.customerOrders);
  const dashboardStats = useGuildStore((s) => s.dashboardStats);

  const activeBounties = bounties.filter((b) => b.status === "ACTIVE").length;
  const legendaryItems = inventory.filter((i) => i.is_legendary).length;
  const lowStockItems = inventory.filter((i) => i.stock_count > 0 && i.stock_count <= 2).length;
  const totalRevenue = customerOrders?.reduce((sum, o) => sum + o.total, 0) || 0;

  const stats = [
    { label: "Inventory", value: inventory.length, icon: "📦", color: "text-blue-400" },
    { label: "Legendary", value: legendaryItems, icon: "🏆", color: "text-yellow-400" },
    { label: "Active Bounties", value: activeBounties, icon: "📜", color: "text-purple-400" },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: "💰", color: "text-green-400" },
    { label: "Low Stock", value: lowStockItems, icon: "⚠️", color: "text-orange-400" },
    { label: "Orders", value: customerOrders?.length || 0, icon: "📋", color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Store Context
      </h3>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/30 border border-border/20"
        >
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span>{stat.icon}</span>
            {stat.label}
          </span>
          <span className={`text-xs font-mono font-semibold ${stat.color}`}>{stat.value}</span>
        </div>
      ))}

      {/* Platform coverage */}
      {inventory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2">
            Platforms
          </h4>
          <div className="flex flex-wrap gap-1">
            {[...new Set(inventory.map((i) => i.platform).filter(Boolean))].map((platform) => (
              <span
                key={platform}
                className="px-2 py-0.5 text-[10px] rounded-full bg-primary/5 border border-primary/20 text-primary/70"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AGENT PAGE
// ============================================================================

export default function AgentPage() {
  const [chatKey, setChatKey] = useState(0);
  const demoMode = useGuildStore((s) => s.demoMode);
  const [showSidebar, setShowSidebar] = useState(true);

  // Track when component mounts for phantom data loading
  const [session, setSession] = useState<AgentSession | null>(null);

  useEffect(() => {
    if (demoMode) {
      setSession(phantomAgentSession);
    }
  }, [demoMode]);

  const newChat = useCallback(() => {
    setChatKey((k) => k + 1);
  }, []);

  // Quick actions that trigger predefined messages
  const quickActions = [
    {
      icon: "📦",
      label: "Check Stock",
      description: "View current stock levels and low stock alerts",
    },
    {
      icon: "💰",
      label: "Market Prices",
      description: "Check current market values for retro games",
    },
    {
      icon: "📜",
      label: "Create Bounty",
      description: "Set up a new wanted item bounty",
    },
    {
      icon: "📊",
      label: "Store Report",
      description: "Full store health and performance overview",
    },
    {
      icon: "👤",
      label: "Lookup Customer",
      description: "Find customer by gamer tag or name",
    },
    {
      icon: "🎯",
      label: "Recommendations",
      description: "Get AI-powered item recommendations",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* ─── MAIN CHAT AREA ─── */}
      <div className="flex-1 flex flex-col rounded-2xl border border-border/40 overflow-hidden bg-background/30 backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-border/30 px-5 py-3 flex items-center justify-between glass-dark rounded-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold text-sm text-primary">Agentic AI</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
            {session && (
              <span className="text-[10px] text-muted-foreground/50 border-l border-border/30 pl-3">
                Session: {session.id.slice(0, 16)}...
              </span>
            )}
            {demoMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold">
                Demo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={newChat}
              className="px-3 py-1.5 text-xs rounded-lg border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>+</span>
              <span className="hidden sm:inline">New Chat</span>
            </motion.button>
            <motion.button
              onClick={() => setShowSidebar((s) => !s)}
              className="p-1.5 text-xs rounded-lg border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showSidebar ? "◀" : "▶"}
            </motion.button>
          </div>
        </div>

        {/* Chat component */}
        <div className="flex-1 overflow-hidden" key={chatKey}>
          <AgentChat mode="merchant" />
        </div>
      </div>

      {/* ─── SIDEBAR ─── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 260 }}
            exit={{ opacity: 0, width: 0 }}
            className="w-[260px] shrink-0 overflow-hidden"
          >
            <div className="h-full rounded-2xl border border-border/40 bg-background/30 backdrop-blur-sm p-4 overflow-y-auto">
              {/* Store Context */}
              <StoreContextPanel />

              {/* Divider */}
              <div className="my-4 border-t border-border/30" />

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-1.5">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.label}
                      className="w-full text-left px-3 py-2 rounded-lg bg-background/20 border border-border/20 hover:bg-primary/5 hover:border-primary/20 transition-colors group"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const chatInput = document.querySelector('textarea');
                        if (chatInput) {
                          chatInput.focus();
                          // Dispatch a custom event or just set the value
                          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype, 'value'
                          )?.set;
                          nativeInputValueSetter?.call(chatInput, action.description);
                          chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{action.icon}</span>
                        <div>
                          <div className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                            {action.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-border/30" />

              {/* Info section */}
              <div className="text-[10px] text-muted-foreground/40 leading-relaxed">
                <p className="mb-2">
                  <strong className="text-muted-foreground/60">Agentic AI</strong> uses tool calling
                  to perform actions on your store data. Type naturally and the AI will decide
                  which tools to use.
                </p>
                <p>
                  In <strong className="text-gold">Demo Mode</strong>, the AI uses mock data with
                  intelligent response matching. In production, it connects to DeepSeek-R1 via
                  NVIDIA NIM for real AI-powered decisions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
