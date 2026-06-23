"use client";

import Link from "next/link";
import { demoHref } from "@/lib/utils/url";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void; href?: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <span className="text-5xl block mb-4 opacity-70">{icon}</span>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={demoHref(action.href)}
            className="inline-flex px-5 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex px-5 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export function EmptyInventory() {
  return (
    <EmptyState
      icon="📦"
      title="No Loot in Your Inventory"
      description="Your inventory matrix is empty. Scan your first retro gaming item to start building your collection."
      action={{ label: "📸 Scan Your First Item", href: "/inventory" }}
    />
  );
}

export function EmptyBounties() {
  return (
    <EmptyState
      icon="📜"
      title="No Active Bounties"
      description="Post your first bounty to start crowd-sourcing inventory from your community of collectors."
      action={{ label: "📌 Post a Bounty", href: "/bounty-board" }}
    />
  );
}

export function EmptyLobbies() {
  return (
    <EmptyState
      icon="🎮"
      title="No Active Gaming Sessions"
      description="No LFG lobbies are open right now. Be the first to host a gaming session!"
      action={{ label: "🎮 Create a Lobby", href: "/nexus" }}
    />
  );
}

export function EmptyScores() {
  return (
    <EmptyState
      icon="🏆"
      title="No Scores Logged Yet"
      description="Your Ghost Data leaderboard is empty. Add an arcade cabinet and start logging scores."
      action={{ label: "🕹️ Add Cabinet", href: "/nexus" }}
    />
  );
}

export function EmptyRooms() {
  return (
    <EmptyState
      icon="🔑"
      title="No Save Rooms Configured"
      description="Set up Save Rooms for your store — CRT stations, tournament setups, and premium lounges."
      action={{ label: "🏗️ Add Save Room", href: "/nexus" }}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon="💬"
      title="No Messages Yet"
      description="Start a conversation with the AI Shopkeeper. Ask about inventory, market values, or game history."
      action={{ label: "🤖 Start Chatting", href: "/shopkeeper" }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="All Clear"
      description="No notifications right now. You'll see alerts for price spikes, legendary drops, and faction war updates here."
    />
  );
}
