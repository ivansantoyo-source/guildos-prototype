"use client";

import React, { useState } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { Bounty } from "@/lib/types";

export default function BountyBoardPage() {
  const bounties = useGuildStore((s) => s.bounties);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "fulfilled">("active");

  const activeBounties = bounties.filter((b) => b.status === "ACTIVE");
  const fulfilledBounties = bounties.filter((b) => b.status === "FULFILLED");
  const displayBounties = activeTab === "active" ? activeBounties : fulfilledBounties;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">📜 THE QUEST BOARD</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeBounties.length} active bounties · Community-sourced supply chain
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          id="btn-post-bounty"
        >
          {showForm ? "✕ Cancel" : "📌 POST BOUNTY"}
        </button>
      </div>

      {/* New Bounty Form */}
      {showForm && (
        <div className="guild-card bg-card rounded-lg p-5 border-primary/30 animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-bold text-primary mb-4">NEW QUEST PARAMETERS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Target Item</label>
              <input
                type="text"
                placeholder="e.g. Mega Man X3"
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground"
                id="input-bounty-item"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Platform</label>
              <input
                type="text"
                placeholder="e.g. SNES"
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground"
                id="input-bounty-platform"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Base Market Price ($)</label>
              <input
                type="number"
                placeholder="250.00"
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground"
                id="input-bounty-price"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Scarcity Multiplier</label>
              <input
                type="number"
                step="0.25"
                defaultValue="1.00"
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground"
                id="input-bounty-multiplier"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Any condition. Customer keeps asking for this one."
                rows={2}
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground resize-none"
                id="input-bounty-description"
              />
            </div>
          </div>
          <button className="mt-4 px-4 py-2 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors">
            DEPLOY QUEST
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeBounties.length})
        </button>
        <button
          onClick={() => setActiveTab("fulfilled")}
          className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "fulfilled"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Fulfilled ({fulfilledBounties.length})
        </button>
      </div>

      {/* Bounty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayBounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
        {displayBounties.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p className="text-lg mb-1">📭</p>
            <p>{activeTab === "active" ? "No active bounties. Post one to get started." : "No fulfilled bounties yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const isFulfilled = bounty.status === "FULFILLED";

  return (
    <div
      className={`guild-card bg-card rounded-lg overflow-hidden ${
        isFulfilled ? "opacity-70 border-xp/20" : "border-gold/20"
      }`}
    >
      {/* Reward Banner */}
      <div className={`px-4 py-2 text-xs font-bold tracking-wider ${
        isFulfilled ? "bg-xp/10 text-xp" : "bg-gold/10 text-gold"
      }`}>
        {isFulfilled ? "✅ QUEST COMPLETE" : "🎯 ACTIVE BOUNTY"}
      </div>

      <div className="p-4 space-y-3">
        {/* Item Name */}
        <div>
          <h3 className="text-base font-bold text-foreground">{bounty.target_item_name}</h3>
          {bounty.platform && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
              {bounty.platform}
            </span>
          )}
        </div>

        {/* Description */}
        {bounty.description && (
          <p className="text-xs text-muted-foreground italic">&quot;{bounty.description}&quot;</p>
        )}

        {/* Value Calculation */}
        <div className="bg-background/50 rounded p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base Market Price</span>
            <span className="text-foreground font-mono">${bounty.base_market_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Scarcity Multiplier</span>
            <span className="text-gold font-mono">×{bounty.scarcity_mult.toFixed(2)}</span>
          </div>
          <div className="border-t border-border/50 pt-1 flex justify-between text-sm font-bold">
            <span className="text-gold">Store Credit Reward</span>
            <span className="text-gold text-glow-gold font-mono">
              ${bounty.store_credit_value.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Expire / Fulfill Info */}
        {bounty.expires_at && !isFulfilled && (
          <p className="text-[11px] text-destructive/70">
            ⏰ Expires: {new Date(bounty.expires_at).toLocaleDateString()}
          </p>
        )}
        {isFulfilled && bounty.fulfilled_at && (
          <p className="text-[11px] text-xp">
            ✓ Fulfilled: {new Date(bounty.fulfilled_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
