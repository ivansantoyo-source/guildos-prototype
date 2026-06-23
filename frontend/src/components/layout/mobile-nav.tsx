"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuildStore } from "@/lib/store/useGuildStore";

const BASE_TABS = [
  { href: "/dashboard", label: "Terminal", icon: "⚔️", id: "dashboard" },
  { href: "/inventory", label: "Loot", icon: "📦", id: "inventory" },
  { href: "/bounty-board", label: "Quests", icon: "📜", id: "bounty-board" },
  { href: "/nexus", label: "Nexus", icon: "🏟️", id: "nexus" },
  { href: "/shopkeeper", label: "AI", icon: "🤖", id: "shopkeeper" },
];

function getTabs(demoMode: boolean) {
  if (!demoMode) return BASE_TABS;
  return BASE_TABS.map((tab) => ({
    ...tab,
    href: `${tab.href}?demo=true`,
  }));
}

export function MobileNav() {
  const pathname = usePathname();
  const demoMode = useGuildStore((s) => s.demoMode);
  const notifications = useGuildStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const tabs = getTabs(demoMode);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-0 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`text-lg relative ${isActive ? "drop-shadow-[0_0_6px_var(--primary)]" : ""}`}>
                {tab.icon}
                {tab.id === "dashboard" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-destructive text-[9px] text-white rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate">{tab.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
